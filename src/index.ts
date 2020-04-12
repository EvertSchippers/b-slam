import * as THREE from 'three';

import { Vector3, Quaternion, Mesh, Euler, MathUtils, Object3D, Group, PerspectiveCamera, VideoTexture } from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

var camera : ARCamera;
var imu : ImuPose;

var scene, renderer, labelRenderer, video;

class Pose
{
    rotation: Quaternion;
    translation: Vector3;

    constructor(rotation: Quaternion, translation: Vector3) {
        this.rotation = rotation;
        this.translation = translation;
    }
    
    public transform(point : Vector3)
    {
        point.applyQuaternion(this.rotation).add(this.translation);
    }

    public multiply(lefthandSide : Pose) : Pose
    {
        return this.multiplyPoses(this, lefthandSide);
    }

    public multiplyPoses(a_from_b : Pose, b_from_c : Pose) : Pose
    {
        this.rotation.multiplyQuaternions(a_from_b.rotation, b_from_c.rotation);
        this.translation.copy(b_from_c.translation).applyQuaternion(a_from_b.rotation).add(a_from_b.translation);
        return this;
    }
}

class ARCamera extends Group
{
    tablet_from_camera: Pose;
    world_from_camera: Pose;
    
    imu_from_tablet : Pose = new Pose( new Quaternion(), new Vector3(0,0,0));
    world_from_imu : Pose = new Pose( new Quaternion(), new Vector3(0,0,0));

    render_cam : PerspectiveCamera;
    videoPlane : Mesh;

    constructor (tablet_from_camera : Pose, render_cam : PerspectiveCamera, video : VideoTexture)
    {
        super()

        this.render_cam = render_cam;
        this.tablet_from_camera = tablet_from_camera;

        // Set up image plane, behind anything else:
        var distance = (render_cam.far - 0.001) ;
        var height = Math.tan(0.5 * render_cam.fov * Math.PI / 180) * distance * 2;
    
        var geometry = new THREE.PlaneBufferGeometry( height * 16.0 / 9.0, height);
        var material = new THREE.MeshBasicMaterial( { map: video } );
        
        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.set(0, distance, 0);
        mesh.quaternion.setFromAxisAngle(new Vector3(1,0,0), 0.5 * Math.PI); 
        this.videoPlane = mesh;
        this.add(mesh);

        render_cam.up.set(0,0,1);
        render_cam.lookAt(0,1,0);
        this.add(render_cam);

        this.world_from_camera = new Pose(this.quaternion, this.position);
    
        this.onScreenOrientationChangeEvent();
    }
    
    update()
    {
        this.world_from_camera.multiplyPoses(this.world_from_imu, this.imu_from_tablet).multiply(this.tablet_from_camera);
    }

    public onScreenOrientationChangeEvent() 
    {
        var orientation : any = window.orientation || 0;
        var screen = MathUtils.degToRad(orientation);
        
        // default, 0, is portrait mode
        var heightToWidth = 9.0 / 16.0;

        // else, landscape mode
        if (Math.abs(screen) > 0)
        {
            heightToWidth = 16.0 / 9.0;
        }

        var distance = (this.render_cam.far - 0.01);
        var height = Math.tan(0.5 * this.render_cam.fov * Math.PI / 180) * distance * 2;
        var geometry = new THREE.PlaneBufferGeometry( height * heightToWidth, height);

        this.videoPlane.geometry = geometry;
        this.imu_from_tablet.rotation.setFromAxisAngle(new Vector3(0,0,1), -screen);
    };
}

class ImuPose
{
    world_from_imu: Quaternion;

    imu_roll : Quaternion = new Quaternion();
    imu_pitch : Quaternion = new Quaternion();
    imu_heading : Quaternion = new Quaternion();

    constructor(world_from_imu: Quaternion)
    {
        this.world_from_imu = world_from_imu;
    }

    public onDeviceOrientationChangeEvent( device ) 
    {
        var headingRadians = device.alpha ? MathUtils.degToRad( device.alpha ) : 0;
        var pitchRadians = device.beta ? MathUtils.degToRad( device.beta ) : 0;
        var rollRadians = device.gamma ? MathUtils.degToRad( device.gamma ) : 0;

        this.imu_roll.setFromAxisAngle(new Vector3(0,1,0), rollRadians);
        this.imu_pitch.setFromAxisAngle(new Vector3(1,0,0), pitchRadians);
        this.imu_heading.setFromAxisAngle(new Vector3(0,0,1), headingRadians);

        this.world_from_imu.multiplyQuaternions(this.imu_heading, this.imu_pitch).multiply(this.imu_roll);
    };
}

class DeviceConnector
{
    imu : ImuPose;
    camera : ARCamera;

    constructor(imu : ImuPose, camera : ARCamera){
        this.imu = imu;
        this.camera = camera;
    }

    connect()
    {
        var deviceOrientationEvent : any = (window.DeviceOrientationEvent !== undefined) ? window.DeviceOrientationEvent : 0;

		// iOS 13+

		if ( window.DeviceOrientationEvent !== undefined && typeof deviceOrientationEvent.requestPermission === 'function' ) {

			deviceOrientationEvent.requestPermission().then( function ( response ) {

				if ( response == 'granted' ) {

                    console.log("A");
					window.addEventListener( 'orientationchange', this.camera.onScreenOrientationChangeEvent.bind(this.camera), false );
					window.addEventListener( 'deviceorientation', this.imu.onDeviceOrientationChangeEvent.bind(this.imu), false );

				}

			} ).catch( function ( error ) {

				console.error( 'THREE.DeviceOrientationControls: Unable to use DeviceOrientation API:', error );

			} );

		} else {

            console.log("B");
			window.addEventListener( 'orientationchange',  this.camera.onScreenOrientationChangeEvent.bind(this.camera), false );
			window.addEventListener( 'deviceorientation', this.imu.onDeviceOrientationChangeEvent.bind(this.imu), false );

		}

	};

	disconnect() {
		window.removeEventListener( 'orientationchange', this.camera.onScreenOrientationChangeEvent.bind(this.camera), false );
		window.removeEventListener( 'deviceorientation', this.imu.onDeviceOrientationChangeEvent.bind(this.imu), false );
	};
}

init();
animate();


function init() {
    
    scene = new THREE.Scene();

    video = document.getElementById( 'video' ); 
    var texture = new THREE.VideoTexture( video );

    // setupDevice();
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

