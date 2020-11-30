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

        // temporary cursor position
        this._posX = 0;
        this._posY = 0;

        this._eye = new THREE.Vector3(0, 0, 0);
        this._eye.copy(this._camera3D.position);
        this._target = new THREE.Vector3(0, 0, 0);
        this._up = new THREE.Vector3(0, 0, 1); // zup for itowns gloveview

        this._isLeftDown = false;
        this._isRightDown = false;

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
        this.view.domElement.addEventListener('keyup', this._onKeyUp, true);
        this.view.domElement.addEventListener('keydown', this._onKeyDown, true);
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

        this._lookedTarget = false;
        this.limitLen = -1;
    }

    dispose() {
        this.view.domElement.removeEventListener('mousedown', this._onMouseDown, false);
        document.removeEventListener('mousemove', this._onPointerMove, false);
        document.removeEventListener('mouseup', this._onMouseUp, false);
        this.view.domElement.removeEventListener('mousewheel', this._onMouseWheel, false);
        this.view.domElement.removeEventListener('DOMMouseScroll', this._onMouseWheel, false); // firefox
        this.view.domElement.removeEventListener('touchstart', this._onTouchStart, false);
        this.view.domElement.removeEventListener('touchmove', this._onPointerMove, false);
        this.view.domElement.removeEventListener('touchend', this._onMouseUp, false);
        this.view.domElement.removeEventListener('keyup', this._onKeyUp, false);
        this.view.domElement.removeEventListener('keydown', this._onKeyDown, false);
        this.view.domElement.removeEventListener('contextmenu', this._onContextMenu, false);

        this.dispatchEvent({ type: 'dispose' });
    }

    applyCameraMatrix() {
        this._camera3D.matrixAutoUpdate = false;
        this._camera3D.matrixWorldInverse.elements = createViewMatrix(this._eye, this._target, this._up);
        this._camera3D.matrix.getInverse(this._camera3D.matrixWorldInverse);

        const d = new THREE.Vector3();
        const q = new THREE.Quaternion();
        const s = new THREE.Vector3();
        // console.log(this._camera3D.matrixWorld, this._viewMatrix);
        this._camera3D.matrix.decompose(d, q, s);
        this._camera3D.position.copy(d);
        this._camera3D.quaternion.copy(q);
        this._camera3D.scale.copy(s);


        /*
        this._camera3D.zoom = cameraParams.zoom;
        this._camera3D.filmOffset = cameraParams.filmOffset;
        this._camera3D.filmGauge = cameraParams.filmGauge;
        this._camera3D.aspect = cameraParams.aspect;
        */

        // document.getElementById('positionx').textContent = this._eye.x;

        this._camera3D.matrixAutoUpdate = true;
        console.log(this._eye);
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
            const coords = this.view.eventToViewCoords(event);
            this.rotate(coords);
            this.view.notifyChange(this._camera3D);
        }
        if (this._isRightDown === true) {
            const coords = this.view.eventToViewCoords(event);
            this.pan(coords);
            this.view.notifyChange(this._camera3D);
        }
    }

    rotate(coords) {
        const gfx = this.view.mainLoop.gfxEngine;

        const rotZ = -2 * Math.PI * (coords.x - this._posX) / gfx.width * 0.25;
        const rotY = -2 * Math.PI * (coords.y - this._posY) / gfx.height * 0.25;

        const rotateYMatrix = new THREE.Matrix4();
        const rotateZMatrix = new THREE.Matrix4();
        const rotateXMatrix = new THREE.Matrix4();
        const cameraVector = (new THREE.Vector3()).copy(this._eye).sub(this._target);
        const cameraVector4 = new THREE.Vector4(cameraVector.x, cameraVector.y, cameraVector.z, 1);
        let rotateMatrix = new THREE.Vector3();
        
        rotateZMatrix.makeRotationZ(rotZ);
        rotateYMatrix.makeRotationY(rotY);
        rotateXMatrix.makeRotationY(rotY);

        if(cameraVector.y != 0.0){
            rotateMatrix = rotateYMatrix.multiply(rotateZMatrix);
        } else {
            rotateMatrix = rotateZMatrix.multiply(rotateXMatrix);
            console.log('rotateX');
        }
        
        // const rotateMatrix = rotateZMatrix.multiply(rotateYMatrix);

        
        const distCameraPosition = cameraVector4.applyMatrix4(rotateMatrix);
        
        this._eye = distCameraPosition;

        this.applyCameraMatrix();

        this._posX = coords.x;
        this._posY = coords.y;

        console.log(rotY);
        console.log(rotZ);

        // let cameraPositionVector = new THREE.Vector3(this._eye.x, this._eye.y, this._eye.z);
        // let cameraUpVector = new THREE.Vector3(0, 0, -1);

        // let u = (new THREE.Vector3()).copy(cameraUpVector);
        // let w = (new THREE.Vector3()).copy(cameraPositionVector).cross(u);

        // let wn = w.normalize();

        // const quatZ = new THREE.Quaternion();
        // const quatY = new THREE.Quaternion();

        // quatZ.setFromAxisAngle(u, rotZ);
        // quatY.setFromAxisAngle(wn, rotY);
        // this._eye.applyQuaternion(quatY.multiply(quatZ));

        // console.log(this._eye);

        // const cameraVector = (new THREE.Vector3()).copy(this._eye).sub(this._target);
        // const axis = (new THREE.Vector3()).copy(this._up);

        // const axisY = (new THREE.Vector3().copy(cameraVector)).cross(axis);

        // const quatZ = new THREE.Quaternion();
        // const quatY = new THREE.Quaternion();
        // // TODO axis is wrong
        // quatZ.setFromAxisAngle(axis, rotZ);
        // quatY.setFromAxisAngle(axisY.normalize(), rotY);
        // this._eye.applyQuaternion(quatY.multiply(quatZ));

        // let cameraVector = (new THREE.Vector3()).copy(this._eye).sub(this._target);
        // let axis = new THREE.Vector3(0, 0, 1);

        // console.log(cameraVector.normalize());

        // let angle = axis.dot(cameraVector.normalize());
        // const angle = axis.angleTo(cameraVector.normalize());

        // if (angle <= 89.0 * Math.PI / 180.0 && angle >= -89.0 * Math.PI / 180.0) {

        //     this.applyCameraMatrix();

        //     this._posX = coords.x;
        //     this._posY = coords.y;
        // } else {
        //     // console.log('test');
        // }

        // this.applyCameraMatrix();

        // this._posX = coords.x;
        // this._posY = coords.y;

        // console.log(this._eye);
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

    onMouseUp() {
        this._isLeftDown = false;
        this._isRightDown = false;
    }

    onMouseWheel(event) {
        let delta = 0;
        let limitLen = this.limitLen;

        // ホイールの入力をdeltaに代入
        if (event.wheelDelta !== undefined) {
            delta = event.wheelDelta;
            // Firefox
        } else if (event.detail !== undefined) {
            delta = -event.detail;
        }

        // カメラからターゲットのベクトルから距離を得る
        const targetToEye = (new THREE.Vector3()).copy(this._eye).sub(this._target);
        const targetToEyeLen = targetToEye.length();
        const normal1 = (new THREE.Vector3()).copy(targetToEye).normalize();

        if (this._lookedTarget) {
            limitLen = this.centerToEyeLen;
        } else if (limitLen === -1) {
            limitLen = targetToEyeLen / 20;
        }

        this.scale = targetToEyeLen - limitLen;

        if (this._lookedTarget === true || this.scale <= 0) {
            this.scale = 1;
            this._lookedTarget = false;
        }

        let rad = targetToEyeLen;
        rad -= delta * this.scale / 1000;

        // カメラをradの値に基づき移動
        this._eye = (new THREE.Vector3()).copy(this._target).add(normal1.multiplyScalar(rad));

        // 移動したあとのカメラからターゲットのベクトルから距離を得る
        const movedTargetToEye = (new THREE.Vector3()).copy(this._eye).sub(this._target);
        const normal2 = (new THREE.Vector3()).copy(movedTargetToEye).normalize();

        const value = normal1.dot(normal2);

        if (value <= 0 || movedTargetToEye.length() <= limitLen) {
            if (delta > 0 && this.limitPosition !== undefined) {
                this.scale = 0;
                this._eye = this.limitPosition;
            } else {
                this._eye = (new THREE.Vector3()).copy(this._target).add(normal1.multiplyScalar(-rad));
            }
        }

        this.limitLen = limitLen;

        //     let scalePer = this.radius;
        //     if(scalePer == undefined){
        //         scalePer = 10000;
        //     }

        //     if (event.wheelDelta !== undefined) {
        //         delta = event.wheelDelta;
        //         // Firefox
        //     } else if (event.detail !== undefined) {
        //         delta = -event.detail;
        //     }

        //     const targetToEye = (new THREE.Vector3()).copy(this._eye).sub(this._target);
        //     let rad = targetToEye.length();

        //     rad -= delta * scalePer;

        //     let normal = targetToEye.normalize();

        //     this._eye = (new THREE.Vector3()).copy(this._target).add(normal.multiplyScalar(rad));

        //     let distanseV = (new THREE.Vector3()).copy(this._eye).sub(this._target);

        //     let distanse = distanseV.length();

        //     let distanseNormal = distanseV.normalize();

        //     if (value <= 0 || distanse <= len) {
        //         this._eye = (new THREE.Vector3()).copy(this._target).add(normal.multiplyScalar(scalePer));
        //     }

        this.applyCameraMatrix();

        this.view.notifyChange(this._camera3D);
    }

    onKeyDown(e) {
        console.warn('TODO', e);
    }

    onKeyUp(e) {
        console.warn('TODO', e);
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
     * ターゲットにカメラを注視する
     * @param {*} event 
     */
    fitCamera(event) {
        this._lookedTarget = true;

        const minPoint = event.min;

        const centerPoint = event.getCenter();

        const radiusVector = (new THREE.Vector3()).copy(minPoint).sub(centerPoint);
        const radius = radiusVector.length();

        const centerToEyeLen = radius / Math.sin(this._camera3D.fov / 2 * Math.PI / 180);

        this.centerToEyeLen = centerToEyeLen;

        this._eye = (new THREE.Vector3(
            centerPoint.x + centerToEyeLen,
            centerPoint.y,
            centerPoint.z,
        ));
        this.limitPosition = this._eye;

        this._target = centerPoint;

        this._camera3D.near = 1;
        this._camera3D.far = centerToEyeLen + radius * 2;

        this.applyCameraMatrix();

        this.view.notifyChange(this._camera3D);
    }
}

export default OrbitControls;
