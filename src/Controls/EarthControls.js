import * as THREE from 'three';
import AnimationPlayer from 'Core/AnimationPlayer';
import Coordinates from 'Core/Geographic/Coordinates';
import CameraUtils from 'Utils/CameraUtils';
import StateControl from 'Controls/StateControl';

const EPS = 0.000001;

const xyz = new Coordinates('EPSG:4978', 0, 0, 0);
// Position object on globe
const positionObject = (() => {
    const c = new Coordinates('EPSG:4326', 0, 0, 0);
    return (newPosition, object) => {
        xyz.setFromVector3(newPosition).as('EPSG:4326', c);
        object.position.copy(newPosition);
        object.lookAt(c.geodesicNormal.add(newPosition));
        object.rotateX(Math.PI * 0.5);
        object.updateMatrixWorld(true);
    };
})();

/**
 * Globe control pan event. Fires after camera pan
 * @event EarthControls#pan-changed
 * @property target {EarthControls} dispatched on controls
 * @property type {string} orientation-changed
 */
/**
 * Globe control orientation event. Fires when camera's orientation change
 * @event EarthControls#orientation-changed
 * @property new {object}
 * @property new.tilt {number} the new value of the tilt of the camera
 * @property new.heading {number} the new value of the heading of the camera
 * @property previous {object}
 * @property previous.tilt {number} the previous value of the tilt of the camera
 * @property previous.heading {number} the previous value of the heading of the camera
 * @property target {EarthControls} dispatched on controls
 * @property type {string} orientation-changed
 */
/**
 * Globe control range event. Fires when camera's range to target change
 * @event EarthControls#range-changed
 * @property new {number} the new value of the range
 * @property previous {number} the previous value of the range
 * @property target {EarthControls} dispatched on controls
 * @property type {string} range-changed
 */
/**
 * Globe control camera's target event. Fires when camera's target change
 * @event EarthControls#camera-target-changed
 * @property new {object}
 * @property new {Coordinates} the new camera's target coordinates
 * @property previous {Coordinates} the previous camera's target coordinates
 * @property target {EarthControls} dispatched on controls
 * @property type {string} camera-target-changed
 */

/**
 * globe controls events
 * @property PAN_CHANGED {string} Fires after camera pan
 * @property ORIENTATION_CHANGED {string} Fires when camera's orientation change
 * @property RANGE_CHANGED {string} Fires when camera's range to target change
 * @property CAMERA_TARGET_CHANGED {string} Fires when camera's target change
 */

export const CONTROL_EVENTS = {
    PAN_CHANGED: 'pan-changed',
    ORIENTATION_CHANGED: 'orientation-changed',
    RANGE_CHANGED: 'range-changed',
    CAMERA_TARGET_CHANGED: 'camera-target-changed',
};

/**
 * EarthControls is a camera controller
 *
 * @class      EarthControls
 * @param      {GlobeView}  view the view where the control will be used
 * @param      {CameraTransformOptions}  targetCoordinate the target looked by camera, at initialization
 * @param      {number}  range distance between the target looked and camera, at initialization
 * @param      {object}  options
 * @param      {number}  options.zoomSpeed Speed zoom with mouse
 * @param      {number}  options.rotateSpeed Speed camera rotation in orbit and panoramic mode
 * @param      {number}  options.minDistance Minimum distance between ground and camera
 * @param      {number}  options.maxDistance Maximum distance between ground and camera
 * @param      {bool}  options.handleCollision enable collision camera with ground
 * @property   {bool} enabled enable control
 * @property   {number} minDistance Minimum distance between ground and camera
 * @property   {number} maxDistance Maximum distance between ground and camera
 * @property   {number} zoomSpeed Speed zoom with mouse
 * @property   {number} wheelZoomSPeed Speed zoom with mousewheel
 * @property   {number} rotateSpeed Speed camera rotation in orbit and panoramic mode
 * @property   {number} minDistanceCollision Minimum distance collision between ground and camera
 * @property   {bool} enableDamping enable camera damping, if it's disabled the camera immediately when the mouse button is released.
 * If it's enabled, the camera movement is decelerate.
 */
class EarthControls extends THREE.EventDispatcher {
    constructor(view, placement, options = {}) {
        super();
        this.player = new AnimationPlayer();
        this.view = view;
        this.camera = view.camera.camera3D;

        // State control
        this.states = new StateControl();
        this.state = this.states.NONE;

        // we don't use PAN
        this.states.PAN.enable = false;
        // we use rightbutton for dolly
        this.states.DOLLY.mouseButton = THREE.MOUSE.RIGHT;
        // we use middlebutton for orbit
        this.states.ORBIT_BY_MIDDLEBUTTON = {
            mouseButton: THREE.MOUSE.MIDDLE,
            enable: true,
        };
        this.states.DOLLY_BY_LEFTBUTTON = {
            mouseButton: THREE.MOUSE.LEFT,
            keyboard: 18, // Alt
            enable: true,
        };

        // Set to false to disable this control
        this.enabled = true;

        this.zoomSpeed = options.zoomSpeed || 0.5;
        this.wheelZoomSpeed = options.wheelZoomSpeed || 3.0;

        // Limits to how far you can dolly in and out ( PerspectiveCamera only )
        this.minDistance = options.minDistance || 10;
        this.maxDistance = options.maxDistance || view.camera.camera3D.far * 0.8;

        // Limits to how far you can zoom in and out ( OrthographicCamera only )
        this.minZoom = 0;
        this.maxZoom = Infinity;

        // Set to true to disable this control
        this.rotateSpeed = options.rotateSpeed || 0.25;

        // Set to true to disable this control
        this.keyPanSpeed = 7.0; // pixels moved per arrow key push

        // How far you can orbit vertically, upper and lower limits.
        // Range is 0 to Math.PI radians.
        // TODO Warning minPolarAngle = 0.01 -> it isn't possible to be perpendicular on Globe
        this.minPolarAngle = THREE.MathUtils.degToRad(0.5); // radians
        this.maxPolarAngle = THREE.MathUtils.degToRad(86); // radians

        // How far you can orbit horizontally, upper and lower limits.
        // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
        this.minAzimuthAngle = -Infinity; // radians
        this.maxAzimuthAngle = Infinity; // radians

        // Set collision options
        this.handleCollision = typeof (options.handleCollision) !== 'undefined' ? options.handleCollision : true;
        this.minDistanceCollision = 10;

        // Set to true to disable use of the keys
        this.enableKeys = true;

        // Enable Damping
        this.enableDamping = true;
        this.startEvent = {
            type: 'start',
        };
        this.endEvent = {
            type: 'end',
        };

        // parameters
        this.params = {
            // Orbit
            spherical: new THREE.Spherical(1.0, 0.01, 0),
            sphericalDelta: new THREE.Spherical(1.0, 0, 0),

            // Save the last time of mouse move for damping
            lastTimeMouseMove: 0,
            // current downed key
            currentKey: undefined,
            // Animations and damping
            enableAnimation: true,
            dampingMove: new THREE.Quaternion(0, 0, 0, 1),
            // Save last transformation
            lastPosition: new THREE.Vector3(),
            lastQuaternion: new THREE.Quaternion(),

            // Set to true to enable target helper
            enableTargetHelper: false,
            helpers: {},

            previousCameraTransform: undefined,

            minDistanceZ: Infinity,

            pickedPosition: new THREE.Vector3(),
            cameraTarget: new THREE.Object3D(),
        };
        this.params.cameraTarget.matrixWorldInverse = new THREE.Matrix4();

        this.constants = {
            dampingFactor: 0.6,
            durationDampingMove: 120,
            durationDampingOrbital: 0,
        };

        view.scene.add(this.params.cameraTarget);

        positionObject(placement.coord.as('EPSG:4978', xyz), this.params.cameraTarget);

        placement.tilt = placement.tilt || 89.5;
        placement.heading = placement.heading || 0;
        // this.lookAtCoordinate(placement, false);

        this.initHelpers();
        this.initEvents();

        this.dolly = this.createDolly();
        this.panoramic = this.createPanoramic();
        this.orbit = this.createOrbit();
        this.globemove = this.createGlobeMove();

        this.getMinDistanceCameraBoundingSphereObbsUp = (() => {
            const sphereCamera = new THREE.Sphere();
            return (tile) => {
                if (tile.level > 10 && tile.children.length == 1 && tile.geometry) {
                    const obb = tile.obb;
                    sphereCamera.center.copy(this.camera.position);
                    sphereCamera.radius = this.minDistanceCollision;
                    if (obb.isSphereAboveXYBox(sphereCamera)) {
                        this.params.minDistanceZ = Math.min(sphereCamera.center.z - obb.box3D.max.z, this.params.minDistanceZ);
                    }
                }
            };
        })();

        this.updateTarget = (() => {
            const targetPosition = new THREE.Vector3();
            return () => {
                // Update camera's target position
                const res = this.view.getPickingPositionFromDepth(null, this.params.pickedPosition);
                const distance = (res !== undefined) ? this.camera.position.distanceTo(this.params.pickedPosition) : 100;
                targetPosition.set(0, 0, -distance);
                this.camera.localToWorld(targetPosition);

                // set new camera target on globe
                positionObject(targetPosition, this.params.cameraTarget);
                this.params.cameraTarget.matrixWorldInverse.copy(this.params.cameraTarget.matrixWorld).transpose();
                targetPosition.copy(this.camera.position);
                targetPosition.applyMatrix4(this.params.cameraTarget.matrixWorldInverse);
                this.params.spherical.setFromVector3(targetPosition);
            };
        })();
    }

    dispose() {
        document.documentElement.removeEventListener('contextmenu', this._onContextMenuListener, false);
        this.view.domElement.removeEventListener('mousedown', this._onMouseDown, false);
        document.documentElement.removeEventListener('mousemove', this._onMouseMove, false);
        this.view.domElement.removeEventListener('mousewheel', this._onMouseWheel, false);
        this.view.domElement.removeEventListener('DOMMouseScroll', this._onMouseWheel, false); // firefox
        document.documentElement.removeEventListener('mouseup', this._onMouseUp, false);
        // this.view.domElement.removeEventListener('mouseleave', this._onMouseUp, false);
        this.view.domElement.removeEventListener('dblclick', this._ondblclick, false);

        this.view.domElement.removeEventListener('touchstart', this._onTouchStart, false);
        this.view.domElement.removeEventListener('touchend', this._onMouseUp, false);
        this.view.domElement.removeEventListener('touchmove', this._onTouchMove, false);

        this.player.removeEventListener('animation-frame', this._onKeyUp);

        window.removeEventListener('keydown', this._onKeyDown, false);
        window.removeEventListener('keyup', this._onKeyUp, false);

        window.removeEventListener('blur', this._onBlurListener);

        this.dispatchEvent({ type: 'dispose' });
    }

    initEvents() {
        this._onEndingMove = null;
        this._onMouseMove = this.onMouseMove.bind(this);
        this._onMouseUp = this.onMouseUp.bind(this);
        this._onMouseDown = this.onMouseDown.bind(this);
        this._onMouseWheel = this.onMouseWheel.bind(this);
        this._onContextMenuListener = this.onContextMenuListener.bind(this);
        this._ondblclick = this.ondblclick.bind(this);
        this._onTouchStart = this.onTouchStart.bind(this);
        this._update = this.update.bind(this);
        // this._onTouchMove = this.onTouchMove.bind(this);
        this._onKeyDown = this.onKeyDown.bind(this);
        this._onKeyUp = this.onKeyUp.bind(this);
        this._onBlurListener = this.onBlurListener.bind(this);

        document.documentElement.addEventListener('contextmenu', this._onContextMenuListener, false);
        this.view.domElement.addEventListener('mousedown', this._onMouseDown, false);
        this.view.domElement.addEventListener('mousewheel', this._onMouseWheel, false);
        this.view.domElement.addEventListener('dblclick', this._ondblclick, false);
        this.view.domElement.addEventListener('DOMMouseScroll', this._onMouseWheel, false); // firefox
        this.view.domElement.addEventListener('touchstart', this._onTouchStart, false);
        this.view.domElement.addEventListener('touchend', this._onMouseUp, false);
        this.view.domElement.addEventListener('touchmove', this._onTouchMove, false);

        // refresh control for each animation's frame
        this.player.addEventListener('animation-frame', this._update);

        // TODO: Why windows
        window.addEventListener('keydown', this._onKeyDown, false);
        window.addEventListener('keyup', this._onKeyUp, false);

        // Reset key/mouse when window loose focus
        window.addEventListener('blur', this._onBlurListener);
    }

    initHelpers() {
        if (this.params.enableTargetHelper) {
            this.updateHelper = (position, helper) => {
                positionObject(position, helper);
                this.view.notifyChange(this.camera);
            };
            this.params.helpers.picking = new THREE.AxesHelper(500000);
            this.params.helpers.target = new THREE.AxesHelper(500000);
            this.params.cameraTarget.add(this.params.helpers.target);
            this.view.scene.add(this.params.helpers.picking);
            const layerTHREEjs = this.view.mainLoop.gfxEngine.getUniqueThreejsLayer();
            this.params.helpers.target.layers.set(layerTHREEjs);
            this.params.helpers.picking.layers.set(layerTHREEjs);
            this.camera.layers.enable(layerTHREEjs);
        } else {
            this.updateHelper = () => {};
        }
    }

    createDolly() {
        class Dolly {
            constructor(view, camera, minZoom, maxZoom, zoomSpeed, wheelZoomSpeed) {
                // reference
                this.view = view;
                this.camera = camera;
                // copy
                this.minZoom = minZoom;
                this.maxZoom = maxZoom;
                this.zoomSpeed = zoomSpeed;
                this.wheelZoomSpeed = wheelZoomSpeed;
                // self
                this.dollyStart = new THREE.Vector2();
                this.dollyEnd = new THREE.Vector2();
                this.dollyDelta = new THREE.Vector2();
                this.orbitScale = 1.0;
            }
            get dollyScale() {
                return 0.95 ** this.zoomSpeed;
            }
            get wheelDollyScale() {
                return 0.95 ** this.wheelZoomSpeed;
            }
            dollyIn(dollyScale) {
                if (dollyScale === undefined) {
                    dollyScale = this.dollyScale;
                }
                if (this.camera.isPerspectiveCamera) {
                    this.orbitScale /= dollyScale;
                } else if (this.camera.isOrthographicCamera) {
                    this.camera.zoom = THREE.MathUtils.clamp(this.camera.zoom * dollyScale, this.minZoom, this.maxZoom);
                    this.camera.updateProjectionMatrix();
                    this.view.notifyChange(this.camera);
                }
            }
            dollyOut(dollyScale) {
                if (dollyScale === undefined) {
                    dollyScale = this.dollyScale;
                }
                if (this.camera.isPerspectiveCamera) {
                    this.orbitScale *= dollyScale;
                } else if (this.camera.isOrthographicCamera) {
                    this.camera.zoom = THREE.MathUtils.clamp(this.camera.zoom / dollyScale, this.minZoom, this.maxZoom);
                    this.camera.updateProjectionMatrix();
                    this.view.notifyChange(this.camera);
                }
            }
            onMouseDown(coords) {
                this.dollyStart.copy(coords);
            }
            onMouseMove(coords) {
                this.dollyEnd.copy(coords);
                this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);
                const gfx = this.view.mainLoop.gfxEngine;
                const hightSpeedMove = Math.max(1, Math.abs(this.dollyDelta.y) / (gfx.height / 100));
                if (this.dollyDelta.y > 0) {
                    this.dollyIn(this.dollyScale ** hightSpeedMove);
                } else if (this.dollyDelta.y < 0) {
                    this.dollyOut(this.dollyScale ** hightSpeedMove);
                }
                this.dollyStart.copy(this.dollyEnd);
            }
            onMouseWheel(delta) {
                if (delta > 0) {
                    this.dollyOut(this.wheelDollyScale);
                } else if (delta < 0) {
                    this.dollyIn(this.wheelDollyScale);
                }
            }
        }
        return new Dolly(this.view, this.camera, this.minZoom, this.maxZoom, this.zoomSpeed, this.wheelZoomSpeed);
    }

    createPan() {
        class Pan {
            constructor(view, camera, cameraTarget) {
                // reference
                this.view = view;
                this.camera = camera;
                this.cameraTarget = cameraTarget;
                // self
                this.panStart = new THREE.Vector2();
                this.panEnd = new THREE.Vector2();
                this.panDelta = new THREE.Vector2();
                this.panOffset = new THREE.Vector3();
                this.panAxisMatrix = new THREE.Matrix4();
                this.panVector = new THREE.Vector3();
            }
            // pass in distance in world space to move left
            panLeft(distance) {
                const te = this.panAxisMatrix.elements;
                // get X column of matrix
                this.panOffset.fromArray(te, 0);
                this.panOffset.multiplyScalar(-distance);
                this.panVector.add(this.panOffset);
            }
            // pass in distance in world space to move up
            panUp(distance) {
                const te = this.panAxisMatrix.elements;
                // get Y column of matrix
                this.panOffset.fromArray(te, 4);
                this.panOffset.multiplyScalar(distance);
                this.panVector.add(this.panOffset);
            }
            // pass in x,y of change desired in pixel space,
            // right and down are positive
            mouseToPan(deltaX, deltaY) {
                const gfx = this.view.mainLoop.gfxEngine;
                if (this.camera.isPerspectiveCamera) {
                    let targetDistance = this.camera.position.distanceTo(this.cameraTarget.position);
                    // half of the fov is center to top of screen
                    targetDistance *= 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5));

                    // we actually don't use screenWidth, since perspective camera is fixed to screen height
                    this.panLeft(deltaX * targetDistance / gfx.width * this.camera.aspect);
                    this.panUp(deltaY * targetDistance / gfx.height);
                } else if (this.camera.isOrthographicCamera) {
                    // orthographic
                    this.panLeft(deltaX * (this.camera.right - this.camera.left) / gfx.width);
                    this.panUp(deltaY * (this.camera.top - this.camera.bottom) / gfx.height);
                }
            }
            onMouseDown(coords) {
                this.panStart.copy(coords);
                this.panAxisMatrix.copy(this.camera.matrix);
            }
            onMouseMove(coords) {
                this.panEnd.copy(coords);
                this.panDelta.subVectors(this.panEnd, this.panStart);

                this.mouseToPan(this.panDelta.x, this.panDelta.y);

                this.panStart.copy(this.panEnd);
            }
        }
        return new Pan(this.view, this.camera, this.params.cameraTarget);
    }

    createPanoramic() {
        class Panoramic {
            constructor(view, camera, cameraTarget, rotateSpeed, sphericalDelta) {
                // reference
                this.view = view;
                this.camera = camera;
                this.cameraTarget = cameraTarget;
                this.sphericalDelta = sphericalDelta;
                // copy
                this.rotateSpeed = rotateSpeed;
                // self
                this.quaterPano = new THREE.Quaternion();
                this.quaterAxis = new THREE.Quaternion();
                this.axisX = new THREE.Vector3(1, 0, 0);
                this.rotateStart = new THREE.Vector2();
                this.rotateEnd = new THREE.Vector2();
                this.rotateDelta = new THREE.Vector2();
            }
            rotateLeft(angle = 0) {
                this.sphericalDelta.theta -= angle;
            }
            rotateUp(angle = 0) {
                this.sphericalDelta.phi -= angle;
            }
            onMouseDown(coords) {
                this.rotateStart.copy(coords);
            }
            onMouseMove(coords) {
                this.rotateEnd.copy(coords);
                this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
                const gfx = this.view.mainLoop.gfxEngine;

                // rotate around rotateStart point
                this.rotateLeft(2 * Math.PI * this.rotateDelta.x / gfx.width * this.rotateSpeed);
                // rotating up and down along whole screen attempts to go 360, but limited to 180
                this.rotateUp(2 * Math.PI * this.rotateDelta.y / gfx.height * this.rotateSpeed);

                this.rotateStart.copy(this.rotateEnd);
            }
            // PANORAMIC Move target camera
            update() {
                this.camera.worldToLocal(this.cameraTarget.position);
                const normal = this.camera.position.clone().normalize().applyQuaternion(this.camera.quaternion.clone().invert());
                this.quaterPano.setFromAxisAngle(normal, this.sphericalDelta.theta).multiply(this.quaterAxis.setFromAxisAngle(this.axisX, this.sphericalDelta.phi));
                this.cameraTarget.position.applyQuaternion(this.quaterPano);
                this.camera.localToWorld(this.cameraTarget.position);

                this.camera.up.copy(this.cameraTarget.position).normalize();
                this.camera.lookAt(this.cameraTarget.position);
            }
        }
        return new Panoramic(this.view, this.camera, this.params.cameraTarget, this.rotateSpeed, this.params.sphericalDelta);
    }

    createOrbit() {
        // for 4 classes limitation
        function Orbit(view, camera, cameraTarget, rotateSpeed, sphericalDelta) {
            // reference
            this.view = view;
            this.camera = camera;
            this.cameraTarget = cameraTarget;
            this.sphericalDelta = sphericalDelta;
            // copy
            this.rotateSpeed = rotateSpeed;
            // self
            this.rotateStart = new THREE.Vector2();
            this.rotateEnd = new THREE.Vector2();
            this.rotateDelta = new THREE.Vector2();
        }
        Orbit.prototype.rotateLeft = function _(angle = 0) {
            this.sphericalDelta.theta -= angle;
        };
        Orbit.prototype.rotateUp = function _(angle = 0) {
            this.sphericalDelta.phi -= angle;
        };
        Orbit.prototype.onMouseDown = function _(coords) {
            this.rotateStart.copy(coords);
        };
        Orbit.prototype.onMouseMove = function _(coords) {
            this.rotateEnd.copy(coords);
            this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
            const gfx = this.view.mainLoop.gfxEngine;

            // rotate around rotateStart point
            this.rotateLeft(2 * Math.PI * this.rotateDelta.x / gfx.width * this.rotateSpeed);
            // rotating up and down along whole screen attempts to go 360, but limited to 180
            this.rotateUp(2 * Math.PI * this.rotateDelta.y / gfx.height * this.rotateSpeed);

            this.rotateStart.copy(this.rotateEnd);
        };
        return new Orbit(this.view, this.camera, this.params.cameraTarget, this.rotateSpeed, this.params.sphericalDelta);
    }

    createGlobeMove() {
        // for 4 classes limitation
        function GlobeMove(view, camera, params) {
            // reference
            this.view = view;
            this.camera = camera;
            this.params = params;

            // private
            this.isOutOfSphere = false;
            this.rotateStart = new THREE.Vector2();
            this.rotateEnd = new THREE.Vector2();
            this.rotateDelta = new THREE.Vector2();
            this.raycaster = new THREE.Raycaster();

            this.moveAroundGlobe = new THREE.Quaternion();
            this.deltaRotation = new THREE.Quaternion();
            this.outOfGlobeAxis = new THREE.Vector3();
            // Tangent sphere to ellipsoid
            this.pickSphere = new THREE.Sphere();
            this.pickingPoint = new THREE.Vector3();
            // Sphere intersection
            this.intersection = new THREE.Vector3();

            this.lastNormalizedIntersection = new THREE.Vector3();
            this.normalizedIntersection = new THREE.Vector3();
        }
        GlobeMove.prototype.onMouseDown = function _(coords) {
            // update picking on sphere
            if (this.view.getPickingPositionFromDepth(coords, this.pickingPoint)) {
                this.pickSphere.radius = this.pickingPoint.length();
                this.lastNormalizedIntersection.copy(this.pickingPoint).normalize();
            } else {
                // picking out of sphere
                this.rotateStart.copy(coords);
            }
        };
        GlobeMove.prototype.onMouseMove = function _(coords) {
            this.rotateEnd.copy(coords);
            const normalized = this.view.viewToNormalizedCoords(coords);
            this.camera.updateMatrixWorld();
            this.raycaster.setFromCamera(normalized, this.camera);
            // If there's intersection then move globe keeping intersection point
            // else we just rotate globe
            if (this.raycaster.ray.intersectSphere(this.pickSphere, this.intersection)) {
                this.normalizedIntersection.copy(this.intersection).normalize();
                if (this.lastNormalizedIntersection.lengthSq() < EPS) {
                    this.lastNormalizedIntersection.copy(this.normalizedIntersection);
                }
                this.moveAroundGlobe.setFromUnitVectors(this.normalizedIntersection, this.lastNormalizedIntersection);

                this.isOutOfSphere = false;
            } else {
                this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
                this.lastNormalizedIntersection.set(0, 0, 0);
                const gfx = this.view.mainLoop.gfxEngine;
                const yrot = -Math.PI * this.rotateDelta.x / gfx.width;
                const xrot = -Math.PI * this.rotateDelta.y / gfx.height;
                this.outOfGlobeAxis.fromArray(this.camera.matrix.elements, 4);
                this.deltaRotation.setFromAxisAngle(this.outOfGlobeAxis, yrot);
                this.moveAroundGlobe.multiply(this.deltaRotation);
                this.outOfGlobeAxis.fromArray(this.camera.matrix.elements, 0);
                this.deltaRotation.setFromAxisAngle(this.outOfGlobeAxis, xrot);
                this.moveAroundGlobe.multiply(this.deltaRotation);

                this.isOutOfSphere = true;
            }
            this.rotateStart.copy(this.rotateEnd);
        };
        // MOVE_GLOBE Rotate globe with mouse
        GlobeMove.prototype.update = function _() {
            if (this.params.minDistanceZ < 0) {
                this.params.cameraTarget.translateY(-this.params.minDistanceZ);
                this.camera.position.setLength(this.camera.position.length() - this.params.minDistanceZ);
            } else if (this.params.minDistanceZ < this.minDistanceCollision) {
                const translate = this.minDistanceCollision * (1.0 - this.params.minDistanceZ / this.minDistanceCollision);
                this.params.cameraTarget.translateY(translate);
                this.camera.position.setLength(this.camera.position.length() + translate);
            }
            if (this.lastNormalizedIntersection.lengthSq() > EPS) {
                this.lastNormalizedIntersection.copy(this.normalizedIntersection).applyQuaternion(this.moveAroundGlobe);
            }
            this.params.cameraTarget.position.applyQuaternion(this.moveAroundGlobe);
            this.camera.position.applyQuaternion(this.moveAroundGlobe);

            this.camera.up.copy(this.params.cameraTarget.position).normalize();
            this.camera.lookAt(this.params.cameraTarget.position);
        };
        return new GlobeMove(this.view, this.camera, this.params);
    }

    onEndingMove(current) {
        if (this._onEndingMove) {
            this.player.removeEventListener('animation-stopped', this._onEndingMove);
            this._onEndingMove = null;
        }
        this.state = this.states.NONE;
        this.handlingEvent(current);
    }

    // ZOOM/ORBIT Move Camera around the target camera
    updateOrbitDolly() {
        // get camera position in local space of target
        this.params.cameraTarget.worldToLocal(this.camera.position);

        // angle from z-axis around y-axis
        if (this.params.sphericalDelta.theta || this.params.sphericalDelta.phi) {
            this.params.spherical.setFromVector3(this.camera.position);
        }
        // far underground
        const dynamicRadius = this.params.spherical.radius * Math.sin(this.minPolarAngle);
        const slowdownLimit = dynamicRadius * 8;
        const contraryLimit = dynamicRadius * 2;
        const minContraintPhi = -0.01;

        if (this.params.minDistanceZ < slowdownLimit && this.params.minDistanceZ > contraryLimit && this.params.sphericalDelta.phi > 0) {
            // slowdown zone : slowdown this.params.sphericalDelta.phi
            const slowdownZone = slowdownLimit - contraryLimit;
            // the deeper the camera is in this zone, the bigger the factor is
            const slowdownFactor = 1 - (slowdownZone - (this.params.minDistanceZ - contraryLimit)) / slowdownZone;
            // apply slowdown factor on tilt mouvement
            this.params.sphericalDelta.phi *= slowdownFactor * slowdownFactor;
        } else if (this.params.minDistanceZ < contraryLimit && this.params.minDistanceZ > -contraryLimit && this.params.sphericalDelta.phi > minContraintPhi) {
            // contraint zone : contraint this.params.sphericalDelta.phi
            const contraryZone = 2 * contraryLimit;
            // calculation of the angle of rotation which allows to leave this zone
            let contraryPhi = -Math.asin((contraryLimit - this.params.minDistanceZ) * 0.25 / this.params.spherical.radius);
            // clamp contraryPhi to make a less brutal exit
            contraryPhi = THREE.MathUtils.clamp(contraryPhi, minContraintPhi, 0);
            // the deeper the camera is in this zone, the bigger the factor is
            const contraryFactor = 1 - (contraryLimit - this.params.minDistanceZ) / contraryZone;
            this.params.sphericalDelta.phi = THREE.MathUtils.lerp(this.params.sphericalDelta.phi, contraryPhi, contraryFactor);
            this.params.minDistanceZ -= Math.sin(this.params.sphericalDelta.phi) * this.params.spherical.radius;
        }
        this.params.spherical.theta += this.params.sphericalDelta.theta;
        this.params.spherical.phi += this.params.sphericalDelta.phi;

        // restrict spherical.theta to be between desired limits
        this.params.spherical.theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, this.params.spherical.theta));

        // restrict spherical.phi to be between desired limits
        this.params.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.params.spherical.phi));
        this.params.spherical.radius = this.camera.position.length() * this.dolly.orbitScale;

        // restrict spherical.phi to be betwee EPS and PI-EPS
        this.params.spherical.makeSafe();

        // restrict radius to be between desired limits
        this.params.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.params.spherical.radius));

        this.camera.position.setFromSpherical(this.params.spherical);

        // if camera is underground, so move up camera
        if (this.params.minDistanceZ < 0) {
            this.camera.position.y -= this.params.minDistanceZ;
            this.params.spherical.setFromVector3(this.camera.position);
            this.params.sphericalDelta.phi = 0;
        }

        this.params.cameraTarget.localToWorld(this.camera.position);

        this.camera.up.copy(this.params.cameraTarget.position).normalize();
        this.camera.lookAt(this.params.cameraTarget.position);

        this.dolly.orbitScale = 1;
    }

    update() {
        // We compute distance between camera's bounding sphere and geometry's obb up face
        if (this.handleCollision) { // We check distance to the ground/surface geometry
            // add minDistanceZ between camera's bounding and tiles's oriented bounding box (up face only)
            // Depending on the distance of the camera with obbs, we add a slowdown or constrain to the movement.
            // this constraint or deceleration is suitable for two types of movement MOVE_GLOBE and ORBIT.
            // This constraint or deceleration inversely proportional to the camera/obb distance
            if (this.view.tileLayer) {
                this.params.minDistanceZ = Infinity;
                for (const tile of this.view.tileLayer.level0Nodes) {
                    tile.traverse(this.getMinDistanceCameraBoundingSphereObbsUp);
                }
            }
        }
        switch (this.state) {
            case this.states.MOVE_GLOBE:
                this.globemove.update();
                break;
            case this.states.PANORAMIC:
                this.panoramic.update();
                break;
            default: {
                this.updateOrbitDolly();
            }
        }

        // TODO : use Date() for dumpingTime
        if (!this.enableDamping) {
            this.params.sphericalDelta.theta = 0;
            this.params.sphericalDelta.phi = 0;
            this.globemove.moveAroundGlobe.set(0, 0, 0, 1);
        } else if (this.globemove.isOutOfSphere) {
            this.params.sphericalDelta.theta = 0;
            this.params.sphericalDelta.phi = 0;
            this.globemove.moveAroundGlobe.slerp(this.params.dampingMove, this.constants.dampingFactor * 0.5);
        } else {
            this.params.sphericalDelta.theta *= (1 - this.constants.dampingFactor);
            this.params.sphericalDelta.phi *= (1 - this.constants.dampingFactor);
            this.globemove.moveAroundGlobe.slerp(this.params.dampingMove, this.constants.dampingFactor * 0.2);
        }

        // update condition is:
        // min(camera displacement, camera rotation in radians)^2 > EPS
        // using small-angle approximation cos(x/2) = 1 - x^2 / 8
        if (this.params.lastPosition.distanceToSquared(this.camera.position) > EPS
         || 8 * (1 - this.params.lastQuaternion.dot(this.camera.quaternion)) > EPS) {
            this.view.notifyChange(this.camera);

            this.params.lastPosition.copy(this.camera.position);
            this.params.lastQuaternion.copy(this.camera.quaternion);
        }
        // Launch animationdamping if mouse stops these movements
        const isORBIT = (this.state === this.states.ORBIT || this.states === this.states.ORBIT_BY_MIDDLEBUTTON);
        const isSphericalMoving = (this.params.sphericalDelta.theta > EPS || this.params.sphericalDelta.phi > EPS);
        if (this.enableDamping && isORBIT && this.player.isStopped() && isSphericalMoving) {
            this.player.playLater(this.constants.durationDampingOrbital, 2);
        }
    }

    onMouseMove(event) {
        if (this.player.isPlaying()) {
            this.player.stop();
        }
        if (this.enabled === false) { return; }

        event.preventDefault();
        const coords = this.view.eventToViewCoords(event);

        switch (this.state) {
            case this.states.ORBIT:
            case this.states.ORBIT_BY_MIDDLEBUTTON:
                this.orbit.onMouseMove(coords);
                break;
            case this.states.PANORAMIC:
                this.panoramic.onMouseMove(coords);
                break;
            case this.states.DOLLY:
            case this.states.DOLLY_BY_LEFTBUTTON:
                this.dolly.onMouseMove(coords);
                break;
            case this.states.MOVE_GLOBE:
                this.globemove.onMouseMove(coords);
                break;
            default:
        }
        this.params.lastTimeMouseMove = Date.now();

        if (this.state !== this.states.NONE) {
            this.update();
        }
    }

    handlingEvent(current) {
        current = current || CameraUtils.getTransformCameraLookingAtTarget(this.view, this.camera);
        const diff = CameraUtils.getDiffParams(this.params.previousCameraTransform, current);
        if (diff) {
            if (diff.range) {
                this.dispatchEvent({
                    type: CONTROL_EVENTS.RANGE_CHANGED,
                    previous: diff.range.previous,
                    new: diff.range.new,
                });
            }
            if (diff.coord) {
                this.dispatchEvent({
                    type: CONTROL_EVENTS.CAMERA_TARGET_CHANGED,
                    previous: diff.coord.previous,
                    new: diff.coord.new,
                });
            }
            if (diff.tilt || diff.heading) {
                const event = {
                    type: CONTROL_EVENTS.ORIENTATION_CHANGED,
                };
                if (diff.tilt) {
                    event.previous = { tilt: diff.tilt.previous };
                    event.new = { tilt: diff.tilt.new };
                }

                if (diff.heading) {
                    event.previous = event.previous || {};
                    event.new = event.new || {};
                    event.new.heading = diff.heading.new;
                    event.previous.heading = diff.heading.previous;
                }

                this.dispatchEvent(event);
            }
        }
    }

    onMouseDown(event) {
        CameraUtils.stop(this.view, this.camera);
        this.player.stop();
        this.onEndingMove();
        if (this.enabled === false) { return; }
        event.preventDefault();

        this.params.previousCameraTransform = CameraUtils.getTransformCameraLookingAtTarget(this.view, this.camera, this.params.pickedPosition);
        this.state = this.states.inputToState(event.button, this.params.currentKey);
        const coords = this.view.eventToViewCoords(event);
        this.updateTarget();

        switch (this.state) {
            case this.states.ORBIT:
            case this.states.ORBIT_BY_MIDDLEBUTTON:
                this.orbit.onMouseDown(coords);
                break;
            case this.states.PANORAMIC:
                this.panoramic.onMouseDown(coords);
                break;
            case this.states.MOVE_GLOBE:
                this.globemove.onMouseDown(coords);
                this.updateHelper(this.globemove.pickingPoint, this.params.helpers.picking);
                break;
            case this.states.DOLLY:
            case this.states.DOLLY_BY_LEFTBUTTON:
                this.dolly.onMouseDown(coords);
                break;
            default:
        }
        if (this.state != this.states.NONE) {
            // add to documentElement for capturing mouse cursor without window
            document.documentElement.addEventListener('mousemove', this._onMouseMove, false);
            document.documentElement.addEventListener('mouseup', this._onMouseUp, false);

            this.dispatchEvent(this.startEvent);
        }
    }

    ondblclick(event) {
        if (this.enabled === false || this.params.currentKey) { return; }
        this.player.stop();
        const point = this.view.getPickingPositionFromDepth(this.view.eventToViewCoords(event));
        const range = this.getRange(point);
        if (point && range > this.minDistance) {
            return this.lookAtCoordinate({
                coord: new Coordinates('EPSG:4978', point),
                range: range * 0.4,
                time: 1000,
            });
        }
    }

    onMouseUp() {
        if (this.enabled === false) { return; }

        document.documentElement.removeEventListener('mousemove', this._onMouseMove, false);
        document.documentElement.removeEventListener('mouseup', this._onMouseUp, false);

        this.globemove.isOutOfSphere = false;
        this.dispatchEvent(this.endEvent);

        this.player.stop();

        // Launch damping movement for :
        //      * this.states.ORBIT
        //      * this.states.MOVE_GLOBE
        if (this.enableDamping) {
            const isORBIT = (this.state === this.states.ORBIT || this.states === this.states.ORBIT_BY_MIDDLEBUTTON);
            const isSphericalMoving = (this.params.sphericalDelta.theta > EPS || this.params.sphericalDelta.phi > EPS);
            if (isORBIT && isSphericalMoving) {
                this.player.play(this.constants.durationDampingOrbital);
                this._onEndingMove = () => this.onEndingMove();
                this.player.addEventListener('animation-stopped', this._onEndingMove);
            } else if (this.state === this.states.MOVE_GLOBE && (Date.now() -  this.params.lastTimeMouseMove < 50)) {
                // animation since mouse up event occurs less than 50ms after the last mouse move
                this.player.play(this.constants.durationDampingMove);
                this._onEndingMove = () => this.onEndingMove();
                this.player.addEventListener('animation-stopped', this._onEndingMove);
            } else {
                this.onEndingMove();
            }
        } else {
            this.onEndingMove();
        }
    }

    onMouseWheel(event) {
        this.player.stop();
        if (!this.enabled || !this.states.DOLLY.enable) { return; }
        CameraUtils.stop(this.view, this.camera);
        event.preventDefault();

        this.updateTarget();

        let delta = 0;
        // WebKit / Opera / Explorer 9
        if (event.wheelDelta !== undefined) {
            delta = event.wheelDelta;
            // Firefox
        } else if (event.detail !== undefined) {
            delta = -event.detail;
        }

        this.dolly.onMouseWheel(delta);

        const previousRange = this.getRange(this.params.pickedPosition);
        this.update();
        const newRange = this.getRange(this.params.pickedPosition);
        if (Math.abs(newRange - previousRange) / previousRange > 0.001) {
            this.dispatchEvent({
                type: CONTROL_EVENTS.RANGE_CHANGED,
                previous: previousRange,
                new: newRange,
            });
        }
        this.dispatchEvent(this.startEvent);
        this.dispatchEvent(this.endEvent);
    }

    onKeyUp() {
        if (this.enabled === false || this.enableKeys === false) { return; }
        this.params.currentKey = undefined;
    }

    onKeyDown(event) {
        this.player.stop();
        if (this.enabled === false || this.enableKeys === false) { return; }
        this.params.currentKey = event.keyCode;
    }

    onTouchStart(event) {
        // CameraUtils.stop(view);
        this.player.stop();
        if (this.enabled === false) { return; }

        this.state = this.states.touchToState(event.touches.length);

        this.updateTarget();

        if (this.state !== this.states.NONE) {
            switch (this.state) {
                case this.states.MOVE_GLOBE: {
                    const coords = this.view.eventToViewCoords(event);
                    this.globemove.onMouseDown(coords);
                    /*
                    if (this.view.getPickingPositionFromDepth(coords, this.params.pickingPoint)) {
                        this.params.pickSphere.radius = this.params.pickingPoint.length();
                        this.params.lastNormalizedIntersection.copy(this.params.pickingPoint).normalize();
                        this.updateHelper(this.params.pickingPoint, this.params.helpers.picking);
                    } else {
                        this.params.rotateStart.copy(coords);
                    }
                    */
                    break;
                }
                case this.states.ORBIT:
                case this.states.DOLLY: {
                    const x = event.touches[0].pageX;
                    const y = event.touches[0].pageY;
                    const dx = x - event.touches[1].pageX;
                    const dy = y - event.touches[1].pageY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    this.dolly.onMouseDown({ x: 0, y: distance });
                    // this.params.dollyStart.set(0, distance);
                    // this.params.rotateStart.set(x, y);
                    break;
                }
                /*
                case this.states.PAN:
                    this.params.panStart.set(event.touches[0].pageX, event.touches[0].pageY);
                    break;
                */
                default:
            }

            this.dispatchEvent(this.startEvent);
        }
    }

    /*
    onTouchMove(event) {
        if (this.player.isPlaying()) {
            this.player.stop();
        }
        if (this.enabled === false) { return; }
        if (this.state === this.states.NONE) { return; }

        event.preventDefault();
        event.stopPropagation();

        switch (event.touches.length) {
            case this.states.MOVE_GLOBE.finger: {
                const coords = this.view.eventToViewCoords(event);
                this.params.rotateEnd.copy(coords);
                const normalized = this.view.viewToNormalizedCoords(coords);
                this.params.raycaster.setFromCamera(normalized, this.camera);
                // If there's intersection then move globe keeping intersection point
                // else we just rotate globe
                if (this.params.raycaster.ray.intersectSphere(this.params.pickSphere, this.params.intersection)) {
                    this.params.normalizedIntersection.copy(this.params.intersection).normalize();
                    if (this.params.lastNormalizedIntersection.lengthSq() < EPS) {
                        this.params.lastNormalizedIntersection.copy(this.params.normalizedIntersection);
                    }
                    this.params.moveAroundGlobe.setFromUnitVectors(this.params.normalizedIntersection, this.params.lastNormalizedIntersection);
                    this.params.lastTimeMouseMove = Date.now();
                } else {
                    this.params.rotateDelta.subVectors(this.params.rotateEnd, this.params.rotateStart);
                    this.params.lastNormalizedIntersection.set(0, 0, 0);
                    const xaxis = (new THREE.Vector3()).fromArray(this.camera.matrix.elements, 0);
                    const yaxis = (new THREE.Vector3()).fromArray(this.camera.matrix.elements, 4);
                    const gfx = this.view.mainLoop.gfxEngine;
                    const yrot = -Math.PI * this.params.rotateDelta.x / gfx.width;
                    const xrot = -Math.PI * this.params.rotateDelta.y / gfx.height;
                    this.params.deltaRotation.setFromAxisAngle(yaxis, yrot);
                    this.params.moveAroundGlobe.multiply(this.params.deltaRotation);
                    this.params.deltaRotation.setFromAxisAngle(xaxis, xrot);
                    this.params.moveAroundGlobe.multiply(this.params.deltaRotation);
                    this.params.lastTimeMouseMove = Date.now();
                }
                this.params.rotateStart.copy(this.params.rotateEnd);
                break;
            }
            case this.states.ORBIT.finger:
            case this.states.DOLLY.finger: {
                const gfx = this.view.mainLoop.gfxEngine;

                const dx = event.touches[0].pageX - event.touches[1].pageX;
                const dy = event.touches[0].pageY - event.touches[1].pageY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                this.params.dollyEnd.set(0, distance);
                this.params.dollyDelta.subVectors(this.params.dollyEnd, this.params.dollyStart);

                const hightSpeedMove = Math.max(1, Math.abs(this.params.dollyDelta.y) / (gfx.height / 100));
                if (this.params.dollyDelta.y > 0) {
                    this.dollyOut(this.dollyScale ** hightSpeedMove);
                } else if (this.params.dollyDelta.y < 0) {
                    this.dollyIn(this.dollyScale ** hightSpeedMove);
                }

                this.params.dollyStart.copy(this.params.dollyEnd);

                break;
            }
            case this.states.PAN.finger:
                this.params.panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
                this.params.panDelta.subVectors(this.params.panEnd, this.params.panStart);

                this.mouseToPan(this.params.panDelta.x, this.params.panDelta.y);

                this.params.panStart.copy(this.params.panEnd);
                break;
            default:
                this.state = this.states.NONE;
        }

        if (this.state !== this.states.NONE) {
            this.update();
        }
    }
    */

    onContextMenuListener(event) {
        event.preventDefault();
    }

    onBlurListener() {
        this.onKeyUp();
        this.onMouseUp();
    }

    /**
     * Returns the "range": the distance in meters between the camera and the current central point on the screen.
     * @param {THREE.Vector3} [position] - The position to consider as picked on
     * the ground.
     * @return {number} number
     */
    getRange(position) {
        return CameraUtils.getTransformCameraLookingAtTarget(this.view, this.camera, position).range;
    }

    /**
     * Sets the animation enabled.
     * @param      {boolean}  enable  enable
     */
    setAnimationEnabled(enable) {
        this.params.enableAnimation = enable;
    }

    /**
     * Determines if animation enabled.
     * @return     {boolean}  True if animation enabled, False otherwise.
     */
    isAnimationEnabled() {
        return this.params.enableAnimation;
    }

    /**
     * Changes the center of the scene on screen to the specified in lat, lon. See {@linkcode Coordinates} for conversion.
     * This function allows to change the central position, the zoom, the range, the scale and the camera orientation at the same time.
     * The zoom has to be between the [getMinZoom(), getMaxZoom()].
     * Zoom parameter is ignored if range is set
     * The tilt's interval is between 4 and 89.5 degree
     *
     * @param      {CameraUtils~CameraTransformOptions}   params camera transformation to apply
     * @param      {number}   [params.zoom]   zoom
     * @param      {number}   [params.scale]   scale
     * @param      {boolean}  isAnimated  Indicates if animated
     * @return     {Promise}  A promise that resolves when transformation is oppered
     */
    lookAtCoordinate(params = {}, isAnimated = this.isAnimationEnabled()) {
        if (params.zoom) {
            params.range = this.view.tileLayer.computeDistanceCameraFromTileZoom(params.zoom, this.view.camera);
        } else if (params.scale) {
            params.range = this.view.getScaleFromDistance(params.pitch, params.scale);
            if (params.range < this.minDistance || params.range > this.maxDistance) {
                // eslint-disable-next-line no-console
                console.warn(`This scale ${params.scale} can not be reached`);
                params.range = THREE.MathUtils.clamp(params.range, this.minDistance, this.maxDistance);
            }
        }

        if (params.tilt !== undefined) {
            const minTilt = 90 - THREE.MathUtils.radToDeg(this.maxPolarAngle);
            const maxTilt = 90 - THREE.MathUtils.radToDeg(this.minPolarAngle);
            if (params.tilt < minTilt || params.tilt > maxTilt) {
                params.tilt = THREE.MathUtils.clamp(params.tilt, minTilt, maxTilt);
                // eslint-disable-next-line no-console
                console.warn('Tilt was clamped to ', params.tilt, ` the interval is between ${minTilt} and ${maxTilt} degree`);
            }
        }

        this.params.previousCameraTransform = CameraUtils.getTransformCameraLookingAtTarget(this.view, this.camera);
        if (isAnimated) {
            params.callback = r => this.params.cameraTarget.position.copy(r.targetWorldPosition);
            this.dispatchEvent({ type: 'animation-started' });
            return CameraUtils.animateCameraToLookAtTarget(this.view, this.camera, params)
                .then((result) => {
                    this.dispatchEvent({ type: 'animation-ended' });
                    this.handlingEvent(result);
                    return result;
                });
        } else {
            return CameraUtils.transformCameraToLookAtTarget(this.view, this.camera, params).then((result) => {
                this.params.cameraTarget.position.copy(result.targetWorldPosition);
                this.handlingEvent(result);
                return result;
            });
        }
    }
}

export default EarthControls;
