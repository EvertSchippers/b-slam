import * as THREE from 'three';

// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { Vector3 } from 'three';

var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
var device = new THREE.Group();
var world = new THREE.Group();

var scene, renderer, video;

var up = new Vector3(0,1,0);
var forward = new Vector3(0,0,-1);
var right = new Vector3(1,0,0);


init();
animate();


function addVideoBackground(group: THREE.Group)
{
    video = document.getElementById( 'video' );

    var texture = new THREE.VideoTexture( video );
    var distance = (camera.far - 0.01) ;
    var height = Math.tan(0.5 * camera.fov * Math.PI / 180) * distance * 2;
    var geometry = new THREE.PlaneBufferGeometry( height * 16.0 / 9.0, height);
    var material = new THREE.MeshBasicMaterial( { map: texture } );
    
    var mesh = new THREE.Mesh( geometry, material );
    mesh.position.set(0, 0, -distance);
    mesh.lookAt(0,0,0);    
    group.add( mesh );
}

function init() {
    
    scene = new THREE.Scene();

    device.add(camera);
    addVideoBackground(device);

    scene.add(device);

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // var controls = new OrbitControls( camera, renderer.domElement );
    // controls.enableZoom = false;
    // controls.enablePan = false;

    window.addEventListener('resize', onWindowResize, false );

    startVideoStream();

}

function startVideoStream()
{
    if ( navigator.mediaDevices && navigator.mediaDevices.getUserMedia )
    {
        var constraints = { video: { width: 1280, height: 720, facingMode: 'user' } };

        navigator.mediaDevices.getUserMedia( constraints ).then( function ( stream ) {

            // apply the stream to the video element used in the texture

            video.srcObject = stream;
            video.play();

        } ).catch( function ( error ) { console.error( 'Unable to access the camera/webcam.', error );   } );

    } else { console.error( 'MediaDevices interface not available.' ); }
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );
    renderer.render( scene, camera );

}

