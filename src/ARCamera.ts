import { Vector3, Quaternion, Mesh, MathUtils, Group, PerspectiveCamera, VideoTexture } from 'three';
import { Pose } from './Pose';
import * as THREE from 'three';
export class ARCamera extends Group {
    tablet_from_camera: Pose;
    world_from_camera: Pose;
    imu_from_tablet: Pose = new Pose(new Quaternion(), new Vector3(0, 0, 0));
    world_from_imu: Pose = new Pose(new Quaternion(), new Vector3(0, 0, 0));
    render_cam: PerspectiveCamera;
    videoPlane: Mesh;
    constructor(tablet_from_camera: Pose, render_cam: PerspectiveCamera, video: VideoTexture) {
        super();
        this.render_cam = render_cam;
        this.tablet_from_camera = tablet_from_camera;
        // Set up image plane, behind anything else:
        var distance = (render_cam.far - 0.001);
        var height = Math.tan(0.5 * render_cam.fov * Math.PI / 180) * distance * 2;
        var geometry = new THREE.PlaneBufferGeometry(height * 16.0 / 9.0, height);
        var material = new THREE.MeshBasicMaterial({ map: video });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, distance, 0);
        mesh.quaternion.setFromAxisAngle(new Vector3(1, 0, 0), 0.5 * Math.PI);
        this.videoPlane = mesh;
        this.add(mesh);
        render_cam.up.set(0, 0, 1);
        render_cam.lookAt(0, 1, 0);
        this.add(render_cam);
        this.world_from_camera = new Pose(this.quaternion, this.position);
        this.onScreenOrientationChangeEvent();
    }
    update() {
        this.world_from_camera.multiplyPoses(this.world_from_imu, this.imu_from_tablet).multiply(this.tablet_from_camera);
    }
    public onScreenOrientationChangeEvent() {
        var orientation: any = window.orientation || 0;
        var screen = MathUtils.degToRad(orientation);
        // default, 0, is portrait mode
        var heightToWidth = 9.0 / 16.0;
        // else, landscape mode
        if (Math.abs(screen) > 0) {
            heightToWidth = 16.0 / 9.0;
        }
        var distance = (this.render_cam.far - 0.01);
        var height = Math.tan(0.5 * this.render_cam.fov * Math.PI / 180) * distance * 2;
        var geometry = new THREE.PlaneBufferGeometry(height * heightToWidth, height);
        this.videoPlane.geometry = geometry;
        this.imu_from_tablet.rotation.setFromAxisAngle(new Vector3(0, 0, 1), -screen);
    }
    ;
}
