import { Vector3, Quaternion, MathUtils } from 'three';
export class ImuPose {
    world_from_imu: Quaternion;
    imu_roll: Quaternion = new Quaternion();
    imu_pitch: Quaternion = new Quaternion();
    imu_heading: Quaternion = new Quaternion();
    constructor(world_from_imu: Quaternion) {
        this.world_from_imu = world_from_imu;
    }
    public onDeviceOrientationChangeEvent(device) {
        var headingRadians = device.alpha ? MathUtils.degToRad(device.alpha) : 0;
        var pitchRadians = device.beta ? MathUtils.degToRad(device.beta) : 0;
        var rollRadians = device.gamma ? MathUtils.degToRad(device.gamma) : 0;
        this.imu_roll.setFromAxisAngle(new Vector3(0, 1, 0), rollRadians);
        this.imu_pitch.setFromAxisAngle(new Vector3(1, 0, 0), pitchRadians);
        this.imu_heading.setFromAxisAngle(new Vector3(0, 0, 1), headingRadians);
        this.world_from_imu.multiplyQuaternions(this.imu_heading, this.imu_pitch).multiply(this.imu_roll);
    }
    ;
}
