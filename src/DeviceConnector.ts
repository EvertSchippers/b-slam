import { ARCamera } from './ARCamera';
import { ImuPose } from './ImuPose';
export class DeviceConnector {
    imu: ImuPose;
    camera: ARCamera;
    constructor(imu: ImuPose, camera: ARCamera) {
        this.imu = imu;
        this.camera = camera;
    }
    connect() {
        var deviceOrientationEvent: any = (window.DeviceOrientationEvent !== undefined) ? window.DeviceOrientationEvent : 0;
        // iOS 13+
        if (window.DeviceOrientationEvent !== undefined && typeof deviceOrientationEvent.requestPermission === 'function') {
            deviceOrientationEvent.requestPermission().then(function (response) {
                if (response == 'granted') {
                    console.log("A");
                    window.addEventListener('orientationchange', this.camera.onScreenOrientationChangeEvent.bind(this.camera), false);
                    window.addEventListener('deviceorientation', this.imu.onDeviceOrientationChangeEvent.bind(this.imu), false);
                }
            }).catch(function (error) {
                console.error('THREE.DeviceOrientationControls: Unable to use DeviceOrientation API:', error);
            });
        }
        else {
            console.log("B");
            window.addEventListener('orientationchange', this.camera.onScreenOrientationChangeEvent.bind(this.camera), false);
            window.addEventListener('deviceorientation', this.imu.onDeviceOrientationChangeEvent.bind(this.imu), false);
        }
    }
    ;
    disconnect() {
        window.removeEventListener('orientationchange', this.camera.onScreenOrientationChangeEvent.bind(this.camera), false);
        window.removeEventListener('deviceorientation', this.imu.onDeviceOrientationChangeEvent.bind(this.imu), false);
    }
    ;
}
