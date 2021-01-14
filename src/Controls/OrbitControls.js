import * as THREE from 'three';
// import { MAIN_LOOP_EVENTS } from 'Core/MainLoop';

const xAxis = new THREE.Vector3();
const yAxis = new THREE.Vector3();
const zAxis = new THREE.Vector3();
function createViewMatrix(position, target, upVector) {
    zAxis.subVectors(position, target);
    zAxis.normalize();
    xAxis.crossVectors(upVector, zAxis);
    xAxis.normalize();
    yAxis.crossVectors(zAxis, xAxis);
    return [
        xAxis.x, yAxis.x, zAxis.x, 0,
        xAxis.y, yAxis.y, zAxis.y, 0,
        xAxis.z, yAxis.z, zAxis.z, 0,
        -xAxis.dot(position), -yAxis.dot(position), -zAxis.dot(position), 1,
    ];
}

/**
 * Orbit controls.
 *
 * Bindings:
 * - up + down keys: forward/backward
 * - left + right keys: strafing movements
 * - PageUp + PageDown: roll movement
 * - mouse click+drag: pitch and yaw movements (as looking at a panorama, not as in FPS games for instance)
 */
class OrbitControls extends THREE.EventDispatcher {
    /**
     * @Constructor
     * @param {View} view
     * @param {object} options
     * @param {boolean} options.focusOnClick - whether or not to focus the renderer domElement on click
     * @param {boolean} options.focusOnMouseOver - whether or not to focus when the mouse is over the domElement
     */
    constructor(view, options = {}) {
        super();
        this.view = view;
        this.options = options;
        this._camera3D = view.camera.camera3D;

        this.init();

        this._isWithoutEvent = false || options.withoutEvent;
        if (!options.withoutEvent) {
            this._onMouseDown = this.onMouseDown.bind(this);
            this._onPointerMove = this.onPointerMove.bind(this);
            this._onMouseUp = this.onMouseUp.bind(this);
            this._onMouseWheel = this.onMouseWheel.bind(this);
            this._onTouchStart = this.onTouchStart.bind(this);
            this._onKeyDown = this.onKeyDown.bind(this);
            this._onKeyUp = this.onKeyUp.bind(this);
            this._onContextMenu = this.onContextMenu.bind(this);

            this.view.domElement.addEventListener('mousedown', this._onMouseDown, false);
            // for out of window
            document.addEventListener('mousemove', this._onPointerMove, false);
            document.addEventListener('mouseup', this._onMouseUp, false);
            this.view.domElement.addEventListener('mousewheel', this._onMouseWheel, false);
            this.view.domElement.addEventListener('DOMMouseScroll', this._onMouseWheel, false); // firefox
            this.view.domElement.addEventListener('touchstart', this._onTouchStart, false);
            this.view.domElement.addEventListener('touchmove', this._onPointerMove, false);
            this.view.domElement.addEventListener('touchend', this._onMouseUp, false);
            document.addEventListener('keyup', this._onKeyUp, true);
            document.addEventListener('keydown', this._onKeyDown, true);
            this.view.domElement.addEventListener('contextmenu', this._onContextMenu, false);

            // enable focus
            this.view.domElement.setAttribute('tabindex', '0');

            // focus policy
            if (options.focusOnMouseOver) {
                view.domElement.addEventListener('mouseover', () => view.domElement.focus());
            }
            if (options.focusOnClick) {
                view.domElement.addEventListener('click', () => view.domElement.focus());
            }
        }
    }

    init(position = new THREE.Vector3().copy(this._camera3D.position), target = new THREE.Vector3(0, 0, 0)) {
        // temporary cursor position
        this._posX = 0;
        this._posY = 0;

        this._cameraFirstPosition = position;
        this._cameraFirstNearFar = {
            near: this._camera3D.near,
            far: this._camera3D.far,
        };

        this._eye = new THREE.Vector3().copy(this._cameraFirstPosition);
        this._target = target;
        this._up = new THREE.Vector3(0, 0, 1); // zup for itowns gloveview
        this._centerPoint = new THREE.Vector3(0, 0, 0);

        // axis
        this.axisZ = new THREE.Vector3(0, 0, 1);

        this._isLeftDown = false;
        this._isRightDown = false;
    }

    /**
     * camera reset
     */
    resetCamera() {
        this._eye = new THREE.Vector3().copy(this._cameraFirstPosition);
        this._target = new THREE.Vector3(0, 0, 0);
        this._up = new THREE.Vector3(0, 0, 1);
        this._centerPoint = new THREE.Vector3(0, 0, 0);
        this._camera3D.near = this._cameraFirstNearFar.near;
        this._camera3D.far = this._cameraFirstNearFar.far;

        this.applyCameraMatrix();
        this.view.notifyChange(this._camera3D);
    }

    dispose() {
        if (!this.options.withoutEvent) {
            this.view.domElement.removeEventListener('mousedown', this._onMouseDown, false);
            document.removeEventListener('mousemove', this._onPointerMove, false);
            document.removeEventListener('mouseup', this._onMouseUp, false);
            this.view.domElement.removeEventListener('mousewheel', this._onMouseWheel, false);
            this.view.domElement.removeEventListener('DOMMouseScroll', this._onMouseWheel, false); // firefox
            this.view.domElement.removeEventListener('touchstart', this._onTouchStart, false);
            this.view.domElement.removeEventListener('touchmove', this._onPointerMove, false);
            this.view.domElement.removeEventListener('touchend', this._onMouseUp, false);
            document.addEventListener('keyup', this._onKeyUp, false);
            document.addEventListener('keydown', this._onKeyDown, false);
            this.view.domElement.removeEventListener('contextmenu', this._onContextMenu, false);
        }

        this.dispatchEvent({ type: 'dispose' });
    }

    applyCameraMatrix() {
        this._camera3D.matrixAutoUpdate = false;
        this._camera3D.matrixWorldInverse.elements = createViewMatrix(this._eye, this._target, this._up);
        this._camera3D.matrix.copy(this._camera3D.matrixWorldInverse).invert();

        const d = new THREE.Vector3();
        const q = new THREE.Quaternion();
        const s = new THREE.Vector3();
        this._camera3D.matrix.decompose(d, q, s);
        this._camera3D.position.copy(d);
        this._camera3D.quaternion.copy(q);
        this._camera3D.scale.copy(s);

        this._camera3D.matrixAutoUpdate = true;
    }

    onMouseDown(event) {
        event.preventDefault();
        const coords = this.view.eventToViewCoords(event);

        this._isLeftDown = (event.button === 0);
        this._isRightDown = (event.button === 2);

        this._posX = coords.x;
        this._posY = coords.y;
    }

    onPointerMove(event) {
        if (this._isLeftDown === true) {
            if (this._isCtrlDown) {
                const coords = this.view.eventToViewCoords(event);
                this.pan(coords);
                this.view.notifyChange(this._camera3D);
            } else {
                const coords = this.view.eventToViewCoords(event);
                this.rotate(coords);
                this.view.notifyChange(this._camera3D);
            }
        } else if (this._isRightDown === true) {
            const coords = this.view.eventToViewCoords(event);
            this.pan(coords);
            this.view.notifyChange(this._camera3D);
        }
    }

    rotate(coords) {
        const gfx = this.view.mainLoop.gfxEngine;

        const moveV = (new THREE.Vector3()).copy(this._centerPoint).negate();
        this._eye.add(moveV);
        const eyeVectorTemp = (new THREE.Vector3()).copy(this._eye);

        const rotZ = -2 * Math.PI * (coords.x - this._posX) / gfx.width * 0.5;
        const rotY = -2 * Math.PI * (coords.y - this._posY) / gfx.height * 0.5;

        const cameraVector = (new THREE.Vector3()).copy(this._target).sub(this._eye);
        const cameraToTarget = (new THREE.Vector3()).copy(cameraVector).normalize();

        const cross = (new THREE.Vector3()).copy(cameraToTarget).cross(this.axisZ).normalize();

        const quatZ = new THREE.Quaternion();
        const quatY = new THREE.Quaternion();

        quatY.setFromAxisAngle(cross, rotY);
        this._eye.applyQuaternion(quatY);
        const movedEyeVector = (new THREE.Vector3()).copy(this._target).sub(this._eye);
        const movedNormal = (new THREE.Vector3()).copy(movedEyeVector).cross(this.axisZ).normalize();

        const dot = movedNormal.dot(cross);

        if (dot <= 0.00001) {
            this._eye = eyeVectorTemp;
        }

        quatZ.setFromAxisAngle(this.axisZ, rotZ);
        this._eye.applyQuaternion(quatZ);

        this._eye.add(this._centerPoint);

        this.applyCameraMatrix();
        this._posX = coords.x;
        this._posY = coords.y;
    }

    pan(coords) {
        const gfx = this.view.mainLoop.gfxEngine;

        const cameraDir = (new THREE.Vector3()).copy(this._target).sub(this._eye);
        const eyeToTargetLen = cameraDir.length();
        cameraDir.normalize();
        const right = (new THREE.Vector3()).copy(cameraDir);
        right.cross(this._up).normalize();
        const top = (new THREE.Vector3()).copy(cameraDir);
        top.cross(right).normalize();

        const mx = -(coords.x - this._posX) / gfx.width * eyeToTargetLen / 2;
        const my = -(coords.y - this._posY) / gfx.height * eyeToTargetLen / 2;
        right.multiplyScalar(mx);
        top.multiplyScalar(my);

        this._target.add(right);
        this._target.add(top);
        this._eye.add(right);
        this._eye.add(top);
        this.applyCameraMatrix();

        this._posX = coords.x;
        this._posY = coords.y;
    }

    panToCenter() {
        const move = (new THREE.Vector3()).copy(this._target).negate();
        this._eye.add(move);
        this._target.set(0, 0, 0);
        this.applyCameraMatrix();
        this.view.notifyChange(this._camera3D);
    }

    onMouseUp() {
        this._isLeftDown = false;
        this._isRightDown = false;
    }

    zoomCamera(delta) {
        const prePos = (new THREE.Vector3()).copy(this._eye);
        // Get a vector showing the direction from the camera to the target
        const targetToEye = (new THREE.Vector3()).copy(this._eye).sub(this._target);
        const targetToEyeLen = targetToEye.length();
        const targetToEyeDir = (new THREE.Vector3()).copy(targetToEye).normalize();

        // Calculate the scale
        const rad = targetToEyeLen / delta * 10;

        // Move camera based on rad value
        this._eye = (new THREE.Vector3()).copy(this._eye).add(targetToEyeDir.multiplyScalar(rad));

        const movedTargetToEye = (new THREE.Vector3()).copy(this._eye).sub(this._target);
        const movedTargetToEyeLen = movedTargetToEye.length();
        const flipDetection = targetToEye.normalize().dot(movedTargetToEye.normalize());

        if (flipDetection < 0.00001 || movedTargetToEyeLen <= this._camera3D.near) {
            this._eye = prePos;
        }

        this.applyCameraMatrix();
        this.view.notifyChange(this._camera3D);
    }

    onMouseWheel(event) {
        let delta = 0;

        // Substitute wheel input for delta (invert)
        if (event.wheelDelta !== undefined) {
            delta = -event.wheelDelta;
            // Firefox
        } else if (event.detail !== undefined) {
            delta = event.detail;
            delta *= 120 / 5;
        }

        this.zoomCamera(delta);
    }

    onKeyDown(event) {
        this._isCtrlDown = (event.keyCode === 17);
        this._isAltDown = (event.keyCode === 18);
    }

    onKeyUp() {
        this._isCtrlDown = false;
        this._isAltDown = false;
    }

    onTouchStart(event) {
        event.preventDefault();
        this._isLeftDown = true;

        this._posX = event.touches[0].pageX;
        this._posY = event.touches[0].pageY;
    }

    onContextMenu(event) {
        // disable context menu
        event.preventDefault();
    }

    /**
     * watch the target
     * @param {*} bbox
     */
    fitCamera(bbox) {
        const minPoint = bbox.min;
        const centerPoint = bbox.getCenter(new THREE.Vector3());
        this._centerPoint = centerPoint;
        this._target.copy(centerPoint);

        const radiusVector = (new THREE.Vector3()).copy(minPoint).sub(centerPoint);
        const radius = radiusVector.length();
        const centerToEyeLen = radius / Math.sin(this._camera3D.fov / 2 * Math.PI / 180);

        this._camera3D.far = centerToEyeLen + radius * 2;
        this._camera3D.near = Math.max(1.0, this._camera3D.far) / 1.0e6;

        this._eye = (new THREE.Vector3(
            centerPoint.x + centerToEyeLen,
            centerPoint.y,
            centerPoint.z,
        ));

        this.applyCameraMatrix();
        this.view.notifyChange(this._camera3D);
    }
}

export default OrbitControls;
