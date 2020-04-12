import { Quaternion, Vector3 } from "three";

export class Pose
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
