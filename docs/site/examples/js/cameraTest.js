

class CameraTest {
    constructor(view) {
        this.view = view;
        this.mainLoopEventsCallbacks = {
            UPDATE_START: [],
            BEFORE_CAMERA_UPDATE: [],
            AFTER_CAMERA_UPDATE: [],
            BEFORE_LAYER_UPDATE: [],
            AFTER_LAYER_UPDATE: [],
            BEFORE_RENDER: [],
            AFTER_RENDER: [],
            UPDATE_END: [],
        }

        this.mainLoopEventsFlag = true;
        this.MAIN_LOOP_EVENTS = {
            UPDATE_START: itowns.MAIN_LOOP_EVENTS.UPDATE_START,
            BEFORE_CAMERA_UPDATE: itowns.MAIN_LOOP_EVENTS.BEFORE_CAMERA_UPDATE,
            AFTER_CAMERA_UPDATE: itowns.MAIN_LOOP_EVENTS.AFTER_CAMERA_UPDATE,
            BEFORE_LAYER_UPDATE: itowns.MAIN_LOOP_EVENTS.BEFORE_LAYER_UPDATE,
            AFTER_LAYER_UPDATE: itowns.MAIN_LOOP_EVENTS.AFTER_LAYER_UPDATE,
            BEFORE_RENDER: itowns.MAIN_LOOP_EVENTS.BEFORE_RENDER,
            AFTER_RENDER: itowns.MAIN_LOOP_EVENTS.AFTER_RENDER,
            UPDATE_END: itowns.MAIN_LOOP_EVENTS.UPDATE_END,
        }
        //もしくは
        // this.MAIN_LOOP_EVENTS=[
        //     UPDATE_START:'update_start',
        //     BEFORE_CAMERA_UPDATE:'before_camera_update',
        //     AFTER_CAMERA_UPDATE:'after_camera_update',
        //     BEFORE_LAYER_UPDATE:'before_layer_update',
        //     AFTER_LAYER_UPDATE:'after_layer_update',
        //     BEFORE_RENDER:'before_render',
        //     AFTER_RENDER:'after_render',
        //     UPDATE_END:'update_end',
        // ]

        this.VIEW_EVENTS = {
            LAYERS_INITIALIZED: itowns.VIEW_EVENTS.LAYERS_INITIALIZED,
            LAYER_REMOVED: itowns.VIEW_EVENTS.LAYER_REMOVED,
            LAYER_ADDED: itowns.VIEW_EVENTS.LAYER_ADDED,
            INITIALIZED: itowns.VIEW_EVENTS.INITIALIZED,
            COLOR_LAYERS_ORDER_CHANGED: itowns.VIEW_EVENTS.COLOR_LAYERS_ORDER_CHANGED
        }
        //もしくは
        // this.VIEW_EVENTS={
        //     LAYERS_INITIALIZED: 'layers-initialized',
        //     LAYER_REMOVED:'layer-removed',
        //     LAYER_ADDED: 'layer-added',
        //     INITIALIZED:'initialized',
        //     COLOR_LAYERS_ORDER_CHANGED:itowns.VIEW_EVENTS.COLOR_LAYERS_ORDER_CHANGED
        // }
    }

    //callback関数を登録
    events_MAINLOOP_add(key, func) {
        this.view.addFrameRequester(this.MAIN_LOOP_EVENTS[key], func);

        let addFlag = true;
        //リストの更新。探索して、なければ、追加。
        for (let i in this.mainLoopEventsCallbacks[key]) {
            if (this.mainLoopEventsCallbacks[key][i] === func) {
                addFlag = false;
            };
        }
        if (addFlag) {
            this.mainLoopEventsCallbacks[key][this.mainLoopEventsCallbacks[key].length] = func;
        }
    }
    //登録したcallback関数を削除
    events_MAINLOOP_remove(key, func) {
        this.view.removeFrameRequester(this.MAIN_LOOP_EVENTS[key], func);
        //リストの更新。消して、前詰め
        for (let i in this.mainLoopEventsCallbacks[key]) {
            if (this.mainLoopEventsCallbacks[key][i] === func) {
                //callbacksから目的の関数を抜く
                this.mainLoopEventsCallbacks[key][i] = null;
                this.mainLoopEventsCallbacks[key].filter(v => v);
            };
        }

    }

    toggleAllMainLoopCallBacks() {
        //登録したcallbackをすべて有効化
        if (!this.mainLoopEventsFlag) {
            for (let i in this.mainLoopEventsCallbacks) {
                for (let j in this.mainLoopEventsCallbacks[i]) {
                    this.view.addFrameRequester(this.MAIN_LOOP_EVENTS[i], this.mainLoopEventsCallbacks[i][j]);
                }
            }
            this.mainLoopEventsFlag = true;
            return;
        }
        //登録したcallbackをすべて無効化
        for (let i in this.mainLoopEventsCallbacks) {
            for (let j in this.mainLoopEventsCallbacks[i]) {
                this.view.removeFrameRequester(this.MAIN_LOOP_EVENTS[i], this.mainLoopEventsCallbacks[i][j]);
            }
        }
        this.mainLoopEventsFlag = false;
    }

    //viewイベントの追加、削除
    events_VIEW_add(key, func) {
        this.view.addEventListener(this.VIEW_EVENTS[key], func);
    }
    events_VIEW_remove(key, func) {
        this.view.removeEventListener(this.VIEW_EVENTS[key], func);
    }

    //カメラ変更時に必ず行う処理
    changeCamera(func) {
        //controlsカメラの無効化
        this.view.controls.enabled = false;
        //登録したmainLoopCallBackをすべて無効化
        this.toggleAllMainLoopCallBacks()

        func();

        this.view.camera.camera3D.updateProjectionMatrix();
        this.view.notifyChange(this.view.camera.camera3D);
        //登録したmainLoopCallBackをすべて有効化
        this.toggleAllMainLoopCallBacks()
        //controlsカメラの有効化
        this.view.controls.enabled = true;
    }

    //カメラの初期化
    initCameraView(far, near, fov, aspect, height, width) {
        this.view.camera.camera3D.far = far;
        this.view.camera.camera3D.near = near;
        this.view.camera.camera3D.fov = fov;
        this.view.camera.camera3D.aspect = aspect;
        this.view.camera.camera3D.height = height;
        this.view.camera.camera3D.width = width;
        this.view.camera.height = height;
        this.view.camera.width = width;
        this.view.mainLoop.gfxEngine.renderer.setSize(width, height);
        this.view.mainLoop.gfxEngine.renderer.setPixelRatio(1);
    }

    //球の方向を向く
    initAngle() {
        let position = this.view.camera.camera3D.position;
        let normPosition = new itowns.THREE.Vector3(position.x, position.y, position.z);
        normPosition.normalize();
        this.view.camera.camera3D.lookAt(normPosition);
    }

    //アングルの回転
    rotateAngle(upVec, angle) {
        let radian = angle * Math.PI / 360;
        let q = new itowns.THREE.Quaternion();
        //回転軸と角度からクォータニオンを計算
        q.setFromAxisAngle(upVec, radian);

        this.view.camera.camera3D.quaternion.multiply(q);
        let loader = new itowns.THREE.TextureLoader();
        console.log(loader);
        let url = "https://wxs.ign.fr/3ht7xcw6f7nciopo16etuqp2/geoportail/wmts";
        let name = "ELEVATION.ELEVATIONGRIDCOVERAGE.SRTM3";
        let format = "image/x-bil;bits=32";
        let version = '1.0.0';
        let style = 'normal';
        let tileMatrixSet = "WGS84G";
        let newurl = url +
            `?LAYER=${name}` +
            `&FORMAT=${format}` +
            '&SERVICE=WMTS' +
            `&VERSION=${version || '1.0.0'}` +
            '&REQUEST=GetTile' +
            `&STYLE=${style || 'normal'}` +
            `&TILEMATRIXSET=${tileMatrixSet}` +
            '&TILEMATRIX=%TILEMATRIX&TILEROW=%ROW&TILECOL=%COL';

        //let url1 = "https://wxs.ign.fr/3ht7xcw6f7nciopo16etuqp2/geoportail/wmts?LAYER=ORTHOIMAGERY.ORTHOPHOTOS&FORMAT=image/jpeg&SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX=%TILEMATRIX&TILEROW=%ROW&TILECOL=%COL"
        //let url2 = "https://wxs.ign.fr/3ht7xcw6f7nciopo16etuqp2/geoportail/wmts?LAYER=ELEVATION.ELEVATIONGRIDCOVERAGE.SRTM3&FORMAT=image/x-bil;bits=32&SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&STYLE=normal&TILEMATRIXSET=WGS84G&TILEMATRIX=%TILEMATRIX&TILEROW=%ROW&TILECOL=%COL"
        
        loader.load(newurl, function (texture) {
            console.log("loader");
            console.log(texture.image);
        })
    }

    //中心との距離を変える
    setDistance(distance) {
        this.view.camera.camera3D.position.setLength(distance);
        //positionを変えると、注視点も一緒に変更されるため、注視点をもとに戻す
        this.view.camera.camera3D.lookAt(this.view.controls.getCameraTargetPosition());
    }

    //移動
    translate(x, y, z) {

        //視点位置の単位ベクトル
        let vec = new itowns.THREE.Vector3(x, y, z);
        this.view.camera.camera3D.position.add(vec);
    }

    //視線を基にカメラ移動
    translateBasedOnView(x, y, z) {

        //視点位置の単位ベクトル
        let normPos = new itowns.THREE.Vector3;
        normPos.copy(this.view.camera.camera3D.position);
        normPos.normalize();

        //上方向のベクトル（y方向）
        let normUp = new itowns.THREE.Vector3;
        normUp.copy(this.view.camera.camera3D.up);
        normUp.normalize();

        //視点の横方向のベクトル（x方向）
        let sideVec = new itowns.THREE.Vector3;
        sideVec.copy(normPos);
        sideVec.cross(normUp);
        sideVec.normalize();

        //視線方向（z方向）
        let viewVec = new itowns.THREE.Vector3;
        viewVec.copy(this.view.controls.getCameraTargetPosition());
        viewVec.sub(this.view.camera.camera3D.position);
        viewVec.normalize();

        normUp.multiplyScalar(y);
        sideVec.multiplyScalar(x);
        viewVec.multiplyScalar(z);

        this.view.camera.camera3D.position.add(normUp);
        this.view.camera.camera3D.position.add(sideVec);
        this.view.camera.camera3D.position.add(viewVec);

        this.view.camera.camera3D.lookAt(this.view.controls.getCameraTargetPosition());

    }

    //カメラ位置を基に左右に移動
    rightLeft(angle) {
        //視点位置の単位ベクトル
        let normPos = new itowns.THREE.Vector3;
        normPos.copy(this.view.camera.camera3D.position);
        normPos.normalize();

        //上方向のベクトル
        let normUp = new itowns.THREE.Vector3;
        normUp.copy(this.view.camera.camera3D.up);

        //視点の横方向のベクトル
        let sideVec = new itowns.THREE.Vector3;
        sideVec.copy(normPos);
        sideVec.cross(normUp);
        sideVec.normalize();

        //視点位置（視線方向ではなく）を基にした、上方向のベクトル
        let axis = new itowns.THREE.Vector3;
        axis.copy(sideVec);
        axis.cross(normPos);
        axis.normalize();

        //軸と角度から行列を作成
        let mat = new itowns.THREE.Matrix4();
        let radian = angle / 180 * Math.PI;
        mat.makeRotationAxis(axis, radian);


        //位置、焦点、上方向のベクトルに行列を適用
        this.view.camera.camera3D.position.applyMatrix4(mat);
        this.view.camera.camera3D.lookAt(this.view.controls.getCameraTargetPosition().applyMatrix4(mat));
        this.view.camera.camera3D.up.applyMatrix4(mat);
    }

    //カメラ位置を基に前後に移動
    forwardBackward(angle) {
        //視点位置の単位ベクトル
        let normPos = new itowns.THREE.Vector3;
        normPos.copy(this.view.camera.camera3D.position);
        normPos.normalize();

        //上方向のベクトル
        let normUp = new itowns.THREE.Vector3;
        normUp.copy(this.view.camera.camera3D.up);

        //視点の横方向のベクトル
        let sideVec = new itowns.THREE.Vector3;
        sideVec.copy(normPos);
        sideVec.cross(normUp);
        sideVec.normalize();

        //軸と角度から行列を作成
        let mat = new itowns.THREE.Matrix4();
        let radian = angle / 180 * Math.PI;
        mat.makeRotationAxis(sideVec, radian);


        //位置、焦点、上方向のベクトルに行列を適用
        this.view.camera.camera3D.position.applyMatrix4(mat);
        this.view.camera.camera3D.lookAt(this.view.controls.getCameraTargetPosition().applyMatrix4(mat));
        this.view.camera.camera3D.up.applyMatrix4(mat);
    }

    //縮尺の調整
    scale(ratio) {
        this.view.camera.camera3D.scale.x = ratio
        this.view.camera.camera3D.scale.y = ratio
        this.view.camera.camera3D.scale.z = ratio;
    }
}