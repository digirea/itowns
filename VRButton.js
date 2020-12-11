class VRButton {
    static createButton(renderer, options) {
        if (options) {
            console.error(
                'THREE.VRButton: The "options" parameter has been removed. Please set the reference space type via renderer.xr.setReferenceSpaceType() instead.'
            );
        }
        const button = document.createElement("button");

        window.currentSession = null;
        button.firstRun = true;

        window.vrEnabled = false;
        window.frameData = null;
        window.vrDisplay = null;
        window.firstCamFOV = view.camera.camera3D.fov;

        view.BeforeVRQ = null;
        view.BeforeVRP = null;
        view.StartVRQ = null;

        view.setFirstParam = false;

        view.addingCamHeight = 0;

        function setFirstVRPos() {
            // window.BeforeVRQ.copy(view.camera.camera3D.quaternion);
            view.BeforeVRQ = view.camera.camera3D.quaternion.clone();
            view.BeforeVRP = view.camera.camera3D.position.clone();

            //地表近くへ移動。地球は完全な球体ではなく潰れているため、その補正値がview.camera.camera3D.scaleに入っている。
            view.camera.camera3D.position.setLength(
                window.defaultVRCamHeight + window.fixCamLonPos()
            );
            window.setCamLookHorizon();
            view.notifyChange(view.camera);
            view.StartVRQ = view.camera.camera3D.quaternion.clone();
            view.setFirstParam = true;
        }

        function showEnterVR(/*device*/) {
            window.log("run showEnterVR ");

            function onSessionStarted(session) {
                window.log("run onSessionStarted ");

                session.addEventListener("end", onSessionEnded);

                view.xrEnabled = true;
                view.addingCamHeight = 0;

                renderer.xr.setSession(session);
                button.textContent = "EXIT VR";

                window.currentSession = session;

                button.firstRun = false;

                view.camera.camera3D.fov = 75;
                if (view.controls) {
                    view.controls.enabled = false;
                }
                view.notifyChange(view.camera);

                log("run onSessionStarted ");
            }

            function onSessionEnded(/*event*/) {
                window.log("run OnSessionEnd ");

                currentSession.removeEventListener("end", onSessionEnded);
                renderer.xr.setSession(null);
                // renderer.xr.enabled = false;
                view.xrEnabled = false;
                button.textContent = "ENTER VR";

                window.currentSession = null;

                view.mainLoop.needsRedraw = true;
                view.camera.camera3D.fov = view.firstCamFOV;

                view.camera.camera3D.position.copy(view.BeforeVRP);
                view.camera.camera3D.quaternion.copy(view.BeforeVRQ);
                view.camera.camera3D.position.setLength(
                    window.defaultVRCamHeight + 950000
                );

                let position = view.camera.camera3D.position;
                let normPosition = new itowns.THREE.Vector3(
                    position.x,
                    position.y,
                    position.z
                );
                normPosition.normalize();
                view.camera.camera3D.updateMatrix();
                view.camera.camera3D.lookAt(normPosition);

                view.camera.camera3D.updateProjectionMatrix();

                if (view.controls) {
                    view.controls.enabled = true;
                }

                view.notifyChange(view.camera);
                view.setFirstParam = false;

                log("run OnSessionEnd ");
            }

            //

            button.style.display = "";

            button.style.cursor = "pointer";
            button.style.left = "calc(50% - 50px)";
            button.style.width = "100px";

            button.textContent = "ENTER VR";

            button.onmouseenter = function () {
                button.style.opacity = "1.0";
            };

            button.onmouseleave = function () {
                button.style.opacity = "0.5";
            };

            button.onclick = function () {
                if (currentSession === null) {
                    setFirstVRPos();

                    // WebXR's requestReferenceSpace only works if the corresponding feature
                    // was requested at session creation time. For simplicity, just ask for
                    // the interesting ones as optional features, but be aware that the
                    // requestReferenceSpace call will fail if it turns out to be unavailable.
                    // ('local' is always available for immersive sessions and doesn't need to
                    // be requested separately.)

                    const sessionInit = {
                        optionalFeatures: [
                            "local-floor",
                            //"bounded-floor",
                            //"hand-tracking",
                        ],
                    };
                    navigator.xr
                        .requestSession("immersive-vr", sessionInit)
                        .then(onSessionStarted);
                } else {
                    currentSession.end();
                    log("run OnSessionEnd 2 ");
                }
            };
        }

        function disableButton() {
            button.style.display = "";

            button.style.cursor = "auto";
            button.style.left = "calc(50% - 75px)";
            button.style.width = "150px";

            button.onmouseenter = null;
            button.onmouseleave = null;

            button.onclick = null;
        }

        function showWebXRNotFound() {
            disableButton();

            button.textContent = "VR NOT SUPPORTED";
        }

        function stylizeElement(element) {
            element.style.position = "absolute";
            element.style.bottom = "20px";
            element.style.padding = "12px 6px";
            element.style.border = "1px solid #fff";
            element.style.borderRadius = "4px";
            element.style.background = "rgba(0,0,0,0.1)";
            element.style.color = "#fff";
            element.style.font = "normal 13px sans-serif";
            element.style.textAlign = "center";
            element.style.opacity = "0.5";
            element.style.outline = "none";
            element.style.zIndex = "999";
        }

        if ("xr" in navigator) {
            button.id = "VRButton";
            button.style.display = "none";

            stylizeElement(button);

            navigator.xr
                .isSessionSupported("immersive-vr")
                .then(function (supported) {
                    supported ? showEnterVR() : showWebXRNotFound();
                });

            log("return createButton");
            return button;
        } else {
            const message = document.createElement("a");

            if (window.isSecureContext === false) {
                message.href = document.location.href.replace(
                    /^http:/,
                    "https:"
                );
                message.innerHTML = "WEBXR NEEDS HTTPS"; // TODO Improve message
            } else {
                message.href = "https://immersiveweb.dev/";
                message.innerHTML = "WEBXR NOT AVAILABLE";
            }

            message.style.left = "calc(50% - 90px)";
            message.style.width = "180px";
            message.style.textDecoration = "none";

            stylizeElement(message);

            return message;
        }
    }
}

log = function (text) {
    return;
    const txtArea = document.getElementById("infobox");
    txtArea.value = text + "\r\n" + txtArea.value;
};

// 地図表示の更新スキップフレーム。60/この値 が、１秒間に地図が更新される最大の回数となる。
window.frameSkipBase = 10;
window.nowCamMoveFactor = 1;
window.defaultVRCamHeight = 6380000;
window.maxVRCamHeight = 6500000;
window.maxVRCamHeight = 6378140; //一番長い地表半径（赤道
window.minVRCamHeight = 6356800; //6356760; //一番短い地表半径（極

window.fixCamLonPos = function () {
    // ホントはこれは直線補完にしかなっていないから、時間の許すときに要見直し
    const tmpVec3 = new itowns.THREE.Vector3()
        .copy(view.camera.camera3D.position)
        .normalize();
    return (
        Math.sin((1.0 - Math.abs(tmpVec3.z)) * Math.PI * 0.5) *
            (window.maxVRCamHeight - window.minVRCamHeight) +
        2000
    );
};

/// カメラを水平線方向に向ける
window.setCamLookHorizon = function () {
    let position = view.camera.camera3D.position;
    let normPosition = new itowns.THREE.Vector3(
        position.x,
        position.y,
        position.z
    );

    normPosition.normalize();
    let upVector = new itowns.THREE.Vector3().copy(normPosition);
    // カメラを地球の中心に向けてから
    // カメラを水平線に向ける
    const q = new itowns.THREE.Quaternion();
    const axis = new itowns.THREE.Vector3(1, 0, 0);
    q.setFromAxisAngle(axis, Math.PI / 2);
    upVector
        .applyQuaternion(view.camera.camera3D.quaternion)
        .applyQuaternion(q);

    view.camera.camera3D.up.copy(upVector);
    view.camera.camera3D.lookAt(normPosition);
    view.camera.camera3D.updateMatrix();

    view.camera.camera3D.quaternion.multiply(q);
    view.camera.camera3D.updateMatrix();

    /*
    let mx = new itowns.THREE.Matrix4().copy(view.camera.camera3D.matrix);
    const obj = new itowns.THREE.Object3D();
    obj.applyMatrix4(mx);
    obj.translateY(10000);
    view.camera.camera3D.lookAt(obj.position);
    view.camera.camera3D.updateMatrix();
    view.camera.camera3D.updateMatrixWorld();
    view.camera.camera3D.updateProjectionMatrix();
*/

    // view.notifyChange(view.camera); //動作に影響がないようなら、コメントアウトのまま（重い
};

function checkDevice() {
    window.log("run checkDevice ");

    window.positionBox = new itowns.THREE.Object3D();
    view.scene.add(window.positionBox);

    window.vrCam = new itowns.THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        655300
    );
    window.tmpCam = new itowns.THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        655300
    );
    window.positionBox.add(window.vrCam);

    var g = view.mainLoop.gfxEngine;
    var r = g.renderer;

    view.xrEnabled = false;
    r.xr.enabled = true;

    window.frameSkip = 0;

    window.befCamQ = new itowns.THREE.Quaternion();
    window.addedRollY = 0;

    // r.xr.setReferenceSpaceType( 'local' );
    r.setAnimationLoop((timestamp) => {
        const tmpV = new itowns.THREE.Vector3()
            .copy(view.camera.camera3D.position)
            .multiplyScalar(1);
        // const q = new itowns.THREE.Quaternion().copy(view.camera.camera3D.quaternion);
        view.controls.enabled = !r.xr.isPresenting;
        const camQ = new itowns.THREE.Quaternion();
        const camBaseQ = new itowns.THREE.Quaternion();
        const addRollQ = new itowns.THREE.Quaternion();

        if (r.xr.isPresenting /*view.xrEnabled*/) {
            window.frameSkip++;

            //前回の移動量を戻す
            if (view.setFirstParam) {
                view.camera.camera3D.quaternion.copy(view.StartVRQ);
            } else {
                window.befCamQ.inverse();
                view.camera.camera3D.quaternion.multiply(window.befCamQ);
            }

            // XRデバイスのカメラ状態を取得
            window.tmpCam = r.xr.getCamera(window.tmpCam);
            camBaseQ.copy(window.tmpCam.quaternion);

            let inputValue = 0.1;

            // コントローラーからの入力
            if (window.currentSession) {
                //only if we are in a webXR session
                for (const sourceXR of window.currentSession.inputSources) {
                    if (!sourceXR.gamepad) continue;

                    const vectUp = sourceXR.gamepad.axes[3];
                    const vectR = sourceXR.gamepad.axes[2];

                    inputValue = Math.max(inputValue, Math.abs(vectR));
                    inputValue = Math.max(inputValue, Math.abs(vectUp));

                    if (sourceXR.handedness == "left") {
                        //左手コントローラー
                        //console.log("left");

                        //端末の回転が入る前のquaternionが必要
                        const mx = new itowns.THREE.Matrix4().copy(
                            view.camera.camera3D.matrix
                        );

                        // 移動させる
                        const obj = new itowns.THREE.Object3D();
                        obj.applyMatrix4(mx);
                        obj.translateZ(vectUp * 50 * window.nowCamMoveFactor);
                        obj.translateX(vectR * 50 * window.nowCamMoveFactor);
                        const lastCamHeight = view.camera.camera3D.position.length();
                        obj.updateMatrix();

                        view.camera.camera3D.position.add(
                            obj.position.sub(view.camera.camera3D.position)
                        );

                        view.camera.camera3D.position.setLength(lastCamHeight);
                        window.setCamLookHorizon();
                    } else if (sourceXR.handedness == "right") {
                        //右手コントローラー
                        //console.log("right");

                        // 回転   回転は視点の兼ね合いがあるので毎フレーム計算
                        /*   回転がピーキーなので、一度コメントアウト                           
                        window.addedRollY += vectR * -0.1;
                        const axis = new itowns.THREE.Vector3(0, 1, 0);
                        addRollQ.setFromAxisAngle(axis, window.addedRollY);
                        window.tmpCam.quaternion.multiply(addRollQ);
                        */

                        //高さ移動
                        // 視点から原点に向かうベクトルを作成。これをもとに移動ベクトルを計算する
                        let normPos = new itowns.THREE.Vector3()
                            .copy(view.camera.camera3D.position)
                            .normalize();
                        if (vectUp != 0) {
                            const moveH = 100 * vectUp;
                            normPos.negate().multiplyScalar(moveH);
                            view.camera.camera3D.position.add(normPos);
                        }
                    }
                }
            }

            //めり込まないように調整する
            const minLength = window.minVRCamHeight + window.fixCamLonPos();
            if (view.camera.camera3D.position.length() < minLength) {
                view.camera.camera3D.position.setLength(minLength);
            }
            window.nowCamMoveFactor =
                1.0 +
                (view.camera.camera3D.position.length() - minLength) * 0.001;

            // window.nowCamMoveFactor = 10; //明日決め
            let nowTargetFrameSkip = window.frameSkipBase;
            if (inputValue > 0.1) {
                nowTargetFrameSkip *= 10;
            }

            camQ.copy(window.tmpCam.quaternion);
            view.camera.camera3D.quaternion.multiply(window.tmpCam.quaternion);

            if (window.frameSkip > nowTargetFrameSkip) {
                // view.camera.camera3D.updateMatrixWorld();
                view.camera.camera3D.updateProjectionMatrix();
                view.notifyChange(view.camera);
                window.frameSkip = 0;
            }
        }

        view.mainLoop._step(view, timestamp);

        if (r.xr.isPresenting) {
            window.positionBox.position.copy(tmpV);
            window.positionBox.quaternion.copy(view.camera.camera3D.quaternion);
            // レンダリング時に強制的にヘッドセットの回転がVrCamに入るため、このままでは２倍掛けになってしまう。
            // ので、ヘッドセットの回転部分のみを打ち消す?場合がある？
            window.positionBox.quaternion.multiply(camBaseQ.inverse());
            window.positionBox.updateMatrixWorld();

            window.vrCam.updateMatrixWorld();
            window.vrCam.updateProjectionMatrix();

            r.clear();
            r.render(view.scene, window.vrCam);

            // カメラに乗算したQを戻す用に、このフレームのquaternionを保持
            window.befCamQ.copy(camQ);
        } else {
            //view.mainLoop._renderView(view);
        }
    });

    if ("xr" in navigator) {
        navigator.xr
            .isSessionSupported("immersive-vr")
            .then(function (supported) {
                if (supported) {
                    document.body.appendChild(VRButton.createButton(r));
                } else {
                }
            });
    } else {
        // navigator.xr.enabled = false;
    }

    window.log("end checkDevice ");
}

window.view = view;
checkDevice();
