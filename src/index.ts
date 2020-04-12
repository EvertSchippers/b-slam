import * as THREE from 'three';

import { Vector3, Quaternion, Mesh, Euler, MathUtils } from 'three';
import { DeviceOrientationControls } from 'three/examples/jsm/controls/DeviceOrientationControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

var render_cam = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
var camera_rfu = new THREE.Group();

var tablet_from_camera = new Quaternion();
tablet_from_camera.setFromAxisAngle(new Vector3(1,0,0), -Math.PI * 0.5);

var scene, renderer, labelRenderer, video, rawOrientation, earthDiv, videoPlane;

var DeviceOrientationRaw = function (  ) {

	var scope = this;

	this.enabled = true;

	this.deviceOrientation = {};
	this.screenOrientation = 0;
	this.alphaOffset = 0; // radians
    this.world_from_tablet = new Quaternion();

	var onDeviceOrientationChangeEvent = function ( event ) {

        scope.deviceOrientation = event;

	};

	var onScreenOrientationChangeEvent = function () {

        scope.screenOrientation = window.orientation || 0;
        
        // default, 0, is portrait mode
        var heightToWidth = 9.0 / 16.0;

        // else, landscape mode
        if (Math.abs(scope.screenOrientation) > 0)
        {
            heightToWidth = 16.0 / 9.0;
        }

        var distance = (render_cam.far - 0.01);
        var height = Math.tan(0.5 * render_cam.fov * Math.PI / 180) * distance * 2;
        var geometry = new THREE.PlaneBufferGeometry( height * heightToWidth, height);

        videoPlane.geometry = geometry;

        // var camera_from_tablet = new Quaternion();
        // camera_from_tablet.setFromAxisAngle(new Vector3(0, 0, 1), scope.screenOrientation);

        // var up = new Vector3(0,1,0).applyQuaternion(camera_from_tablet);
        // var down = new Vector3(0,0,-1).applyQuaternion(camera_from_tablet);

        // camera.up.set(up.x, up.y, up.z);
        // camera.lookAt(down);
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

        var toFoolTypeScript; 
        var deviceOrientationEvent = (window.DeviceOrientationEvent !== undefined) ? window.DeviceOrientationEvent : toFoolTypeScript;

		// iOS 13+

		if ( window.DeviceOrientationEvent !== undefined && typeof deviceOrientationEvent.requestPermission === 'function' ) {

			deviceOrientationEvent.requestPermission().then( function ( response ) {

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

			var headingRadians = device.alpha ? MathUtils.degToRad( device.alpha ) + scope.alphaOffset : 0; // Z
			var pitchRadians = device.beta ? MathUtils.degToRad( device.beta ) : 0; // X'
			var rollRadians = device.gamma ? MathUtils.degToRad( device.gamma ) : 0; // Y''
            var screen = scope.screenOrientation ? MathUtils.degToRad(scope.screenOrientation) : 0;

            var roll = new Quaternion();
            roll.setFromAxisAngle(new Vector3(0,1,0), rollRadians);

            var pitch = new Quaternion();
            pitch.setFromAxisAngle(new Vector3(1,0,0), pitchRadians);

            var heading = new Quaternion();
            heading.setFromAxisAngle(new Vector3(0,0,1), headingRadians);

            var screenCorrection = new Quaternion();
            screenCorrection.setFromAxisAngle(new Vector3(0,0,1), -screen);

            // This rotation is not affected by the orientation of the device:
            this.world_from_tablet = heading.multiply(pitch).multiply(roll).multiply(screenCorrection);
            
            camera_rfu.setRotationFromQuaternion(this.world_from_tablet.multiply(tablet_from_camera));

            // // Physically the camera also doesn't change orientation, however, the incoming
            // // video stream rotates and even changes aspect ratio.
            // // Same for the screen itself.
            // var camera_from_tablet = new Quaternion();
            // camera_from_tablet.setFromAxisAngle(new Vector3(0,0,1), screenOrientation);


            // var tablet_from_camera = camera_from_tablet.inverse();

            // var world_from_camera = world_from_tablet.multiply(tablet_from_camera);

            // var forward = new Vector3(0,1,0).applyQuaternion(world_from_camera);

            // earthDiv.textContent = forward.x + ", " + forward.y + ", "+ forward.z;

            


            
			// setObjectQuaternion( scope.object.quaternion, alpha, beta, gamma, orient );

		}


	};

	this.dispose = function () {

		scope.disconnect();

	};

	this.connect();

};





init();
animate();


function setupDevice()
{
    video = document.getElementById( 'video' );
  
    var texture = new THREE.VideoTexture( video );
    var distance = (render_cam.far - 0.01) ;
    var height = Math.tan(0.5 * render_cam.fov * Math.PI / 180) * distance * 2;

    var geometry = new THREE.PlaneBufferGeometry( height * 16.0 / 9.0, height);
    var material = new THREE.MeshBasicMaterial( { map: texture } );

    var mesh = new THREE.Mesh( geometry, material );
    mesh.position.set(0, distance, 0);
    mesh.quaternion.setFromAxisAngle(new Vector3(1,0,0), 0.5 * Math.PI); 
    videoPlane = mesh;

    render_cam.up.set(0,0,1);
    render_cam.lookAt(0,1,0);

    earthDiv = document.createElement("div");    
    earthDiv.className = 'label';
    earthDiv.textContent = 'Earth';
    earthDiv.style.marginTop = '-1em';
    var earthLabel = new CSS2DObject( earthDiv );
    earthLabel.position.set( 0, distance - 0.01, 0 );

    camera_rfu.add(earthLabel);
    camera_rfu.add(render_cam);
    camera_rfu.add(videoPlane);
}

function init() {
    
    scene = new THREE.Scene();

    setupDevice();


    scene.add(camera_rfu);


    rawOrientation = new DeviceOrientationRaw();
    rawOrientation.connect();

    var axisHelper =new THREE.AxesHelper( 5 );
    axisHelper.position.set(0,5,-1);
    var gridHelper = new THREE.GridHelper(20,50);
    gridHelper.quaternion.setFromAxisAngle(new Vector3(1,0,0), 0.5 * Math.PI);
    gridHelper.position.set(0,5, -1);


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

    render_cam.aspect = window.innerWidth / window.innerHeight;
    render_cam.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() 
{
    

    rawOrientation.update();

    requestAnimationFrame( animate );

    renderer.render( scene, render_cam );
    labelRenderer.render( scene, render_cam );

}

