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

init();
animate();


function init() {
    
    scene = new THREE.Scene();

    video = document.getElementById( 'video' ); 
    var texture = new THREE.VideoTexture( video );

    camera = new ARCamera(new Pose(new Quaternion().setFromAxisAngle(new Vector3(1,0,0), -Math.PI * 0.5), new Vector3(0,0,0)),
                          new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 ), texture );

    scene.add(camera);

    imu = new ImuPose(camera.world_from_imu.rotation);
    new DeviceConnector(imu, camera).connect();

    var axisHelper =new THREE.AxesHelper( 5 );
    axisHelper.position.set(0,0,-1);
    var gridHelper = new THREE.GridHelper(20,50);
    gridHelper.quaternion.setFromAxisAngle(new Vector3(1,0,0), 0.5 * Math.PI);
    gridHelper.position.set(0, 0, -1);

    scene.add( axisHelper);
    scene.add( gridHelper);

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

}

function startVideoStream()
{
    if ( navigator.mediaDevices && navigator.mediaDevices.getUserMedia )
    {
        // if enable switch camera, rotate camera pose
        var constraints = { video: { width: 1280, height: 720, facingMode: 'environment' } };

        navigator.mediaDevices.getUserMedia( constraints ).then( function ( stream ) {

            // apply the stream to the video element used in the texture

            video.srcObject = stream;
            video.play();

        } ).catch( function ( error ) { console.error( 'Unable to access the camera/webcam.', error );   } );

    } else { console.error( 'MediaDevices interface not available.' ); }
}

function onWindowResize() {

    camera.render_cam.aspect = window.innerWidth / window.innerHeight;
    camera.render_cam.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() 
{
    

    camera.update();

    requestAnimationFrame( animate );

    renderer.render( scene, camera.render_cam );
    labelRenderer.render( scene, camera.render_cam );

}

