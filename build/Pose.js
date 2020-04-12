export class Pose {
    constructor(rotation, translation) {
        this.rotation = rotation;
        this.translation = translation;
    }
    transform(point) {
        point.applyQuaternion(this.rotation).add(this.translation);
    }
    multiply(lefthandSide) {
        return this.multiplyPoses(this, lefthandSide);
    }
    multiplyPoses(a_from_b, b_from_c) {
        this.rotation.multiplyQuaternions(a_from_b.rotation, b_from_c.rotation);
        this.translation.copy(b_from_c.translation).applyQuaternion(a_from_b.rotation).add(a_from_b.translation);
        return this;
    }
}
