import * as THREE from 'three';

import { Vector3, Quaternion, Mesh, Euler, MathUtils } from 'three';
import { DeviceOrientationControls } from 'three/examples/jsm/controls/DeviceOrientationControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
var device = new THREE.Group();
var world = new THREE.Group();

var scene, renderer,labelRenderer, video, rawOrientation, earthDiv;

// class DeviceOrientationRaw
// {
//     // absolute :number;
//     alpha    :any;
//     beta     :any;
//     gamma    :any;

//     deviceOrientationEvent    :any;

//     constructor() {
//         this.deviceOrientationEvent = window.DeviceOrientationEvent;
//     }

//     connect() {
        
//         console.info("CONNECTING...");

//         if (  this.deviceOrientationEvent !== undefined && typeof  this.deviceOrientationEvent.requestPermission === 'function' ) {

//             this.deviceOrientationEvent.requestPermission().then( function ( response ) {

// 				if ( response == 'granted' ) {

// 					// window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
// 					window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );
// console.info("ACCESS GRANTED...");
        
// 				}

// 			} ).catch( function ( error ) {

// 				console.error( 'THREE.DeviceOrientationControls: Unable to use DeviceOrientation API:', error );

// 			} );

// 		} else {
//             console.info("NO PERMISSION NEEDED...");

// 			// window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
// 			window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

// 		}
//     }

// }


var DeviceOrientationRaw = function (  ) {

	var scope = this;

	// this.object = object;
	// this.object.rotation.reorder( 'YXZ' );

	this.enabled = true;

	this.deviceOrientation = {};
	this.screenOrientation = 0;

	this.alphaOffset = 0; // radians

	var onDeviceOrientationChangeEvent = function ( event ) {

		scope.deviceOrientation = event;

	};

	var onScreenOrientationChangeEvent = function () {

		scope.screenOrientation = window.orientation || 0;

	};

	// The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

	// var setObjectQuaternion = function () {

	// 	var zee = new Vector3( 0, 0, 1 );

	// 	var euler = new Euler();

	// 	var q0 = new Quaternion();

	// 	var q1 = new Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis

	// 	return function ( quaternion, alpha, beta, gamma, orient ) {

	// 		euler.set( beta, alpha, - gamma, 'YXZ' ); // 'ZXY' for the device, but 'YXZ' for us

	// 		quaternion.setFromEuler( euler ); // orient the device

	// 		quaternion.multiply( q1 ); // camera looks out the back of the device, not the top

	// 		quaternion.multiply( q0.setFromAxisAngle( zee, - orient ) ); // adjust for screen orientation

	// 	};

	// }();

	this.connect = function () {

		onScreenOrientationChangeEvent(); // run once on load

		// iOS 13+

		if ( window.DeviceOrientationEvent !== undefined && typeof window.DeviceOrientationEvent.requestPermission === 'function' ) {

			window.DeviceOrientationEvent.requestPermission().then( function ( response ) {

				if ( response == 'granted' ) {

					window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
					window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

				}

			} ).catch( function ( error ) {

				console.error( 'THREE.DeviceOrientationControls: Unable to use DeviceOrientation API:', error );

			} );

		} else {

			window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
			window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

		}

		scope.enabled = true;

	};

	this.disconnect = function () {

		window.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
		window.removeEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

		scope.enabled = false;

	};

	this.update = function () {

		if ( scope.enabled === false ) return;

		var device = scope.deviceOrientation;

		if ( device ) {

			var alpha = device.alpha ? MathUtils.degToRad( device.alpha ) + scope.alphaOffset : 0; // Z

			var beta = device.beta ? MathUtils.degToRad( device.beta ) : 0; // X'

			var gamma = device.gamma ? MathUtils.degToRad( device.gamma ) : 0; // Y''

			var orient = scope.screenOrientation ? MathUtils.degToRad( scope.screenOrientation ) : 0; // O

            earthDiv.textContent = alpha + "," + beta + ","+ gamma;

			// setObjectQuaternion( scope.object.quaternion, alpha, beta, gamma, orient );

		}


	};

	this.dispose = function () {

		scope.disconnect();

	};

	this.connect();

};



// function onDeviceOrientationChangeEvent(event) {
//     // this.absolute = event.absolute;
//     rawOrientation.alpha    = 1.0 ;  //event.alpha ? event.alpha : 0.0;
//     rawOrientation.beta     = event.beta ? event.beta : 0.0;
//     rawOrientation.gamma    = event.gamma ? event.gamma : 0.0;      
//   }





init();
animate();


function setupDevice()
{
    video = document.getElementById( 'video' );
  
    var texture = new THREE.VideoTexture( video );
    var distance = (camera.far - 0.01) ;
    var height = Math.tan(0.5 * camera.fov * Math.PI / 180) * distance * 2;
    var geometry = new THREE.PlaneBufferGeometry( height * 16.0 / 9.0, height);
    var material = new THREE.MeshBasicMaterial( { map: texture } );

    var mesh = new THREE.Mesh( geometry, material );
    mesh.position.set(0, distance, 0);
    mesh.quaternion.setFromAxisAngle(new Vector3(1,0,0), 0.5 * Math.PI); 
    
    camera.up.set(0,0,1);
    camera.lookAt(0,1,0);

    earthDiv = document.createElement("div");    
    earthDiv.className = 'label';
    earthDiv.textContent = 'Earth';
    earthDiv.style.marginTop = '-1em';
    var earthLabel = new CSS2DObject( earthDiv );
    earthLabel.position.set( 0, distance - 0.01, 0 );

    device.add(earthLabel);
    device.add(camera);
    device.add( mesh );
}

function init() {
    
    scene = new THREE.Scene();

    setupDevice();


    scene.add(device);


    rawOrientation = new DeviceOrientationRaw();
    rawOrientation.connect();


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
    labelRenderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() 
{
    

    rawOrientation.update();

    requestAnimationFrame( animate );
    renderer.render( scene, camera );
    labelRenderer.render( scene, camera );

}

