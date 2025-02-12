import * as THREE from 'three';

import { Vector3, Quaternion, Euler, Object3D } from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

import { Pose } from './Pose';
import { ARCamera } from './ARCamera';
import { ImuPose } from './ImuPose';
import { DeviceConnector } from './DeviceConnector';

var camera : ARCamera;
var imu : ImuPose;

var scene, renderer, labelRenderer, video;
// var dimensionsLabel: CSS2DObject;

// Add these variables near the top with other global variables
var initialPinchDistance: number | null = null;
var initialFov: number;

init();
animate();


function init() {
    
    scene = new THREE.Scene();

    video = document.getElementById( 'video' );

    var texture = new THREE.VideoTexture( video );

    // Get FOV from URL parameter, default to 60 if not specified
    const urlParams = new URLSearchParams(window.location.search);
    const fov = parseFloat(urlParams.get('fov')) || 60;

    let fov_ratio = window.innerHeight / Math.max(window.innerWidth, window.innerHeight);

    camera = new ARCamera(new Pose(new Quaternion().setFromAxisAngle(new Vector3(1,0,0), -Math.PI * 0.5), new Vector3(0,0,0)),
                          new THREE.PerspectiveCamera(fov * fov_ratio, window.innerWidth / window.innerHeight, 0.1, 100 ), texture );

    scene.add(camera);

    imu = new ImuPose(camera.world_from_imu.rotation);
    new DeviceConnector(imu, camera).connect();

    // var axisHelper =new THREE.AxesHelper( 5 );
    // axisHelper.position.set(0,0,-1);
    // scene.add( axisHelper);

    // var gridHelper = new THREE.GridHelper(20,50);
    // gridHelper.quaternion.setFromAxisAngle(new Vector3(1,0,0), 0.5 * Math.PI);
    // gridHelper.position.set(0, 0, -1);
    // scene.add( gridHelper);


    // Create lines fixed to camera
    const distance = 1; // Distance from camera
    const angleSpacing = 2; // degrees
    const totalAngleRange = 6; // degrees
    
    // Create a container for all the lines
    const linesContainer = new THREE.Object3D();
    
    // Create horizontal lines
    for (let angle = -totalAngleRange/2; angle <= totalAngleRange/2; angle += angleSpacing) {
        const z = distance * Math.tan(angle * Math.PI / 180);
        const points = [
            new THREE.Vector3(-2, distance, z),
            new THREE.Vector3(2, distance, z)
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0xFF8C00,  // Dark orange color
            linewidth: 1      // Thin lines
        });
        const line = new THREE.Line(geometry, material);
        linesContainer.add(line);
    }
    
    // Create vertical lines
    for (let angle = -totalAngleRange/2; angle <= totalAngleRange/2; angle += angleSpacing) {
        const x = distance * Math.tan(angle * Math.PI / 180);
        const points = [
            new THREE.Vector3(x, distance, -2),
            new THREE.Vector3(x, distance, 2)
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0xFF8C00,  // Dark orange color
            linewidth: 1      // Thin lines
        });
        const line = new THREE.Line(geometry, material);
        linesContainer.add(line);
    }

    camera.add(linesContainer);

    // // Create dimensions label
    // const dimensionsDiv = document.createElement('div');
    // dimensionsDiv.className = 'label';
    // dimensionsDiv.style.backgroundColor = 'rgba(0,0,0,0.6)';
    // dimensionsDiv.style.color = 'white';
    // dimensionsDiv.style.padding = '2px 6px';
    // dimensionsDiv.style.borderRadius = '3px';
    // dimensionsDiv.textContent = `Window: ${window.innerWidth}x${window.innerHeight} Video: ${video.videoWidth}x${video.videoHeight} ${screen.orientation.type}`;
    
    // dimensionsLabel = new CSS2DObject(dimensionsDiv);
    // dimensionsLabel.position.set(0.0, 0.0, -0.5);
    // scene.add(dimensionsLabel);

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

	labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = 0;
    document.body.appendChild( labelRenderer.domElement );

    window.addEventListener('resize', onWindowResize, false );

    startVideoStream();

    // Add touch event listeners after creating renderer
    labelRenderer.domElement.addEventListener('touchstart', handleTouchStart, false);
    labelRenderer.domElement.addEventListener('touchmove', handleTouchMove, false);
    labelRenderer.domElement.addEventListener('touchend', handleTouchEnd, false);

}

function startVideoStream()
{
    if ( navigator.mediaDevices && navigator.mediaDevices.getUserMedia )
    {
        var constraints = { video: { width: 1280, height: 720, facingMode: 'environment' } };

        navigator.mediaDevices.getUserMedia( constraints ).then( function ( stream ) {
            video.srcObject = stream;
            video.play();
            
        } ).catch( function ( error ) { console.error( 'Unable to access the camera/webcam.', error );   } );

    } else { console.error( 'MediaDevices interface not available.' ); }
}

function onWindowResize() {

    renderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.setSize( window.innerWidth, window.innerHeight );

    camera.onScreenOrientationChangeEvent();
    
}

function animate() 
{
    camera.update();
    requestAnimationFrame( animate );
    renderer.render( scene, camera.render_cam );
    labelRenderer.render( scene, camera.render_cam );
}

// Add these new functions before the animate() function
function getDistanceBetweenTouches(event: TouchEvent): number {
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    return Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
    );
}

function handleTouchStart(event: TouchEvent) {
    if (event.touches.length === 2) {
        initialPinchDistance = getDistanceBetweenTouches(event);
        initialFov = camera.render_cam.fov;
    }
}

function handleTouchMove(event: TouchEvent) {
    if (event.touches.length === 2 && initialPinchDistance !== null) {
        const currentDistance = getDistanceBetweenTouches(event);
        const distanceRatio = initialPinchDistance / currentDistance;
        
        // Adjust FOV based on pinch gesture
        // Clamp FOV between 5 and 90 degrees
        const newFov = Math.min(Math.max(initialFov * distanceRatio, 5), 90);
        camera.render_cam.fov = newFov;
        camera.render_cam.updateProjectionMatrix();
    }
}

function handleTouchEnd(event: TouchEvent) {
    initialPinchDistance = null;
}

