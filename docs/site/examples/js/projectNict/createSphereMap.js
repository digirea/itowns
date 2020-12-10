

class CreateSphereMap {
  constructor(view, initBackGroundLayersFunc, GUITools = null) {
    //domの作成
    this.createDom();

    //itownsのviewerの初期化
    let initSize = 512

    this.GUITools = GUITools;

    this.view = view;

    //キューブマップのスクショを撮る用のviewの初期化
    this.initBackGroundViewer(this.view, initBackGroundLayersFunc);
    this.initView(this.backGroundView, this.view.camera.camera3D.near, view.camera.camera3D.far, initSize, initSize);

    //キューブマップ作製用の変数
    this.CUBE_MAP_IMAGE_TYPE = [
      "RIGHT",
      "LEFT",
      "TOP",
      "DOWN",
      "FRONT",
      "BACK"
    ]
    this.animationCount = 0;

    //イベントの登録
    this.setEvent(this.view, this.backGroundView);

    //スフィアマップレンダラの初期化
    this.initSphereMapRenderer();
  }

  //private
  //HTMLの作成
  createDom() {
    let body = document.body;
    let jpegEncoderBasic = document.createElement("script");
    jpegEncoderBasic.type = "text/javascript";
    jpegEncoderBasic.src = "./js/projectNict/jpeg_encoder_basic.js";
    body.appendChild(jpegEncoderBasic);

    let createSphereMapDom = document.createElement("div");
    createSphereMapDom.id = "createSphereMapDom";
    {
      let createSphereMapDom_backGroundViewerDiv = document.createElement("div");
      createSphereMapDom_backGroundViewerDiv.id = "createSphereMapDom_backGroundViewerDiv";
      {

      }
      createSphereMapDom.appendChild(createSphereMapDom_backGroundViewerDiv);

      //画像レンダリング用のdom
      let createSphereMapDom_sphereMapViewer = document.createElement("div");
      createSphereMapDom_sphereMapViewer.id = "createSphereMapDom_sphereMapViewer";
      {

      }
      createSphereMapDom.appendChild(createSphereMapDom_sphereMapViewer)

      //ボタン配置エリア
      let createSphereMapDom_buttonArea = document.createElement("div");
      createSphereMapDom_buttonArea.id = "createSphereMapDom_buttonArea";
      {
        let createSphereMapDom_ToggleShowBackGroundViewButton = document.createElement("a");
        createSphereMapDom_ToggleShowBackGroundViewButton.id = "createSphereMapDom_ToggleShowBackGroundViewButton";
        createSphereMapDom_ToggleShowBackGroundViewButton.classList.add("button");
        createSphereMapDom_ToggleShowBackGroundViewButton.innerHTML = "サブビュー表示/非表示"
        {

        }
        createSphereMapDom_buttonArea.appendChild(createSphereMapDom_ToggleShowBackGroundViewButton)

        let createSphereMapDom_CreateSphereMapButton = document.createElement("a");
        createSphereMapDom_CreateSphereMapButton.id = "createSphereMapDom_CreateSphereMapButton";
        createSphereMapDom_CreateSphereMapButton.classList.add("button");
        createSphereMapDom_CreateSphereMapButton.innerHTML = "スフィアマップ作製"
        {

        }
        createSphereMapDom_buttonArea.appendChild(createSphereMapDom_CreateSphereMapButton)

        let createSphereMapDom_SetCubeMapImageSizeButton = document.createElement("a");
        createSphereMapDom_SetCubeMapImageSizeButton.id = "createSphereMapDom_SetCubeMapImageSizeButton";
        createSphereMapDom_SetCubeMapImageSizeButton.classList.add("button")
        createSphereMapDom_SetCubeMapImageSizeButton.innerHTML = "キューブマップ画像サイズ"
        {
          let createSphereMapDom_CubeMapImageSizeInput = document.createElement("input");
          createSphereMapDom_CubeMapImageSizeInput.id = "createSphereMapDom_CubeMapImageSizeInput";
          createSphereMapDom_CubeMapImageSizeInput.classList.add("inputNum")
          {

          }
          createSphereMapDom_SetCubeMapImageSizeButton.appendChild(createSphereMapDom_CubeMapImageSizeInput)
        }
        createSphereMapDom_buttonArea.appendChild(createSphereMapDom_SetCubeMapImageSizeButton)

        let createSphereMapDom_DelayTimeButton = document.createElement("a");
        createSphereMapDom_DelayTimeButton.id = "createSphereMapDom_DelayTimeButton";
        createSphereMapDom_DelayTimeButton.classList.add("button")
        createSphereMapDom_DelayTimeButton.innerHTML = "次の処理への待ち時間(秒)"
        {
          let createSphereMapDom_DelayTimeInput = document.createElement("input");
          createSphereMapDom_DelayTimeInput.id = "createSphereMapDom_DelayTimeInput";
          createSphereMapDom_DelayTimeInput.classList.add("inputNum")
          createSphereMapDom_DelayTimeInput.value = 2;
          {

          }
          createSphereMapDom_DelayTimeButton.appendChild(createSphereMapDom_DelayTimeInput)
        }
        createSphereMapDom_buttonArea.appendChild(createSphereMapDom_DelayTimeButton)

        let createSphereMapDom_CameraTest = document.createElement("a");
        createSphereMapDom_CameraTest.id = "createSphereMapDom_CameraTest";
        createSphereMapDom_CameraTest.classList.add("button");
        createSphereMapDom_CameraTest.innerHTML = "カメラ回転Test"
        {

        }
        createSphereMapDom_buttonArea.appendChild(createSphereMapDom_CameraTest)
      }
      createSphereMapDom.appendChild(createSphereMapDom_buttonArea)

      //出来た画像保存用のdom
      let createSphereMapDom_mapImages = document.createElement("div");
      createSphereMapDom_mapImages.id = "createSphereMapDom_mapImages";
      {
        let createSphereMapDom_RIGHT = document.createElement("a");
        createSphereMapDom_RIGHT.id = "createSphereMapDom_RIGHT";
        createSphereMapDom_RIGHT.classList.add("cubeMapImages", "button")
        {

        }
        createSphereMapDom_mapImages.appendChild(createSphereMapDom_RIGHT)

        let createSphereMapDom_LEFT = document.createElement("a");
        createSphereMapDom_LEFT.id = "createSphereMapDom_LEFT";
        createSphereMapDom_LEFT.classList.add("cubeMapImages", "button")
        {

        }
        createSphereMapDom_mapImages.appendChild(createSphereMapDom_LEFT)

        let createSphereMapDom_TOP = document.createElement("a");
        createSphereMapDom_TOP.id = "createSphereMapDom_TOP";
        createSphereMapDom_TOP.classList.add("cubeMapImages", "button")
        {

        }
        createSphereMapDom_mapImages.appendChild(createSphereMapDom_TOP)

        let createSphereMapDom_DOWN = document.createElement("a");
        createSphereMapDom_DOWN.id = "createSphereMapDom_DOWN";
        createSphereMapDom_DOWN.classList.add("cubeMapImages", "button")
        {

        }
        createSphereMapDom_mapImages.appendChild(createSphereMapDom_DOWN)

        let createSphereMapDom_FRONT = document.createElement("a");
        createSphereMapDom_FRONT.id = "createSphereMapDom_FRONT";
        createSphereMapDom_FRONT.classList.add("cubeMapImages", "button")
        {

        }
        createSphereMapDom_mapImages.appendChild(createSphereMapDom_FRONT)

        let createSphereMapDom_BACK = document.createElement("a");
        createSphereMapDom_BACK.id = "createSphereMapDom_BACK";
        createSphereMapDom_BACK.classList.add("cubeMapImages", "button")
        {

        }
        createSphereMapDom_mapImages.appendChild(createSphereMapDom_BACK)

        let createSphereMapDom_SPHEREMAP = document.createElement("a");
        createSphereMapDom_SPHEREMAP.id = "createSphereMapDom_SPHEREMAP";
        createSphereMapDom_SPHEREMAP.classList.add("button")
        {

        }
        createSphereMapDom_mapImages.appendChild(createSphereMapDom_SPHEREMAP)

        let createSphereMapDom_SPHEREMAP_WITHMETA = document.createElement("a");
        createSphereMapDom_SPHEREMAP_WITHMETA.id = "createSphereMapDom_SPHEREMAP_WITHMETA";
        createSphereMapDom_SPHEREMAP_WITHMETA.classList.add("button")
        {

        }
        createSphereMapDom_mapImages.appendChild(createSphereMapDom_SPHEREMAP_WITHMETA)
      }
      createSphereMapDom.appendChild(createSphereMapDom_mapImages);
    }
    body.appendChild(createSphereMapDom);
  }

  initView(view, near, far, height, width = 0) {
    //viewの更新
    if (view.controls) {
      view.controls.enabled = false;
    }
    view.camera.camera3D.fov = 90;
    view.camera.camera3D.near = near;
    view.camera.camera3D.far = far;
    view.camera.camera3D.aspect = 1;
    view.camera.camera3D.height = height;
    view.camera.camera3D.width = width;
    view.camera.height = height;
    view.camera.width = width;
    view.mainLoop.gfxEngine.renderer.setSize(width, height);
    view.mainLoop.gfxEngine.renderer.setPixelRatio(1);

    if (view.controls) {
      view.controls.enabled = true;
    }

    //canvasの更新
    let viewerDiv = view.mainLoop.gfxEngine.renderer.domElement
    viewerDiv.height = height;
    viewerDiv.width = height;
    viewerDiv.style.height = "512px";
    viewerDiv.style.width = "512px";

    viewerDiv.style.position = "absolute";
    viewerDiv.style.left = "calc(50% - 256px)";
    viewerDiv.style.top = "calc(50% - 256px)";
    view.camera.camera3D.updateProjectionMatrix();
    if (view.controls) {
      view.controls.enabled = true;
    }
    view.notifyChange(view.camera);
  }

  //裏で描画するviewの更新
  initBackGroundViewer(mainView, initBackGroundLayersFunc) {
    this.backGroundViewerDiv = document.getElementById("createSphereMapDom_backGroundViewerDiv");
    this.backGroundView = new itowns.GlobeView(this.backGroundViewerDiv, placement, {
      noControls: true,
    });
    setupLoadingScreen(this.backGroundViewerDiv, this.backGroundView);

    //mainViewの描画後の同期
    this.updateBackgroundViewer = () => {
      let position = mainView.camera.camera3D.position;
      let normPosition = new itowns.THREE.Vector3(position.x, position.y, position.z);
      normPosition.normalize();

      let camera = this.backGroundView.camera.camera3D;
      camera.position.copy(position);
      camera.up.copy(mainView.camera.camera3D.up);
      camera.lookAt(normPosition);

      this.backGroundView.notifyChange(camera);
    }
    mainView.addFrameRequester(itowns.MAIN_LOOP_EVENTS.AFTER_RENDER, this.updateBackgroundViewer);

    initBackGroundLayersFunc(this.backGroundView);

    this.syncGUITools(mainView)

    this.backGroundView.notifyChange();
  }

  syncGUITools(mainView) {
    let layers = this.backGroundView.getLayers();
    let mainLayers = mainView.getLayers();

    this.backGroundView.addEventListener(itowns.VIEW_EVENTS.LAYER_ADDED, () => {
      layers = this.backGroundView.getLayers();
      mainLayers = mainView.getLayers();

      if (this.GUITools) {
        for (let a in this.GUITools.gui.__folders) {
          if (a === "Color Layers" || a === "Elevation Layers") {
            for (let i in this.GUITools.gui.__folders[a].__folders) {
              for (let j in layers) {
                if (layers[j].id === i) {
                  for (let k in this.GUITools.gui.__folders[a].__folders[i].__controllers) {
                    this.GUITools.gui.__folders[a].__folders[i].__controllers[k].onChange((value) => {
                      layers = this.backGroundView.getLayers();
                      mainLayers = mainView.getLayers();

                      let paramName = this.GUITools.gui.__folders[a].__folders[i].__controllers[k].property;
                      mainLayers[j][paramName] = value;
                      mainView.notifyChange(mainLayers[j]);
                      layers[j][paramName] = value;
                      this.backGroundView.notifyChange(layers[j]);
                    });
                  }
                }
              }
            }
          }
          else if (a === "Debug Tools") {
            console.log("Debug Tools");
          }
          else {
            for (let k in this.GUITools.gui.__folders[a].__controllers) {
              this.GUITools.gui.__folders[a].__controllers[k].onChange((value) => {
                layers = this.backGroundView.getLayers();
                mainLayers = mainView.getLayers();
                let idName = a.substr(6, a.length);

                let paramName = this.GUITools.gui.__folders[a].__controllers[k].property;
                for (let j in mainLayers) {
                  if (mainLayers[j].id === idName) {
                    mainLayers[j][paramName] = value;
                    mainView.notifyChange(mainLayers[a]);
                  }
                }
                for (let j in layers) {
                  if (layers[j].id === idName) {
                    layers[j][paramName] = value;
                    this.backGroundView.notifyChange(layers[a]);
                  }
                }
              });
            }
          }
        }
      }
    })
  }

  /////イベントの登録/////
  setEvent(view, backGroundView) {
    this.setToggleShowBackGroundView();
    this.setSizeChangeEvent(view, backGroundView);
    this.setCreateSphereMapEvent(view, backGroundView);
  };


  setToggleShowBackGroundView() {
    let toggleButton = document.getElementById("createSphereMapDom_ToggleShowBackGroundViewButton");

    this.showBackGroundViewFlag = false;
    toggleButton.addEventListener("click", () => {
      let backGroundViewDiv = document.getElementById("createSphereMapDom_backGroundViewerDiv");
      if (!this.showBackGroundViewFlag) {
        backGroundViewDiv.style.opacity = "1";
        this.showBackGroundViewFlag = true;
        return;
      }
      backGroundViewDiv.style.opacity = "0.00000000001";
      this.showBackGroundViewFlag = false;
    })
  };

  //画像サイズ変更時のイベント
  setSizeChangeEvent(view, backGroundView) {
    let sizeInput = document.getElementById("createSphereMapDom_CubeMapImageSizeInput");
    sizeInput.value = backGroundView.camera.height;
    sizeInput.onchange = () => {
      console.log("sizeChange")
      if (sizeInput.value > 1024) {
        sizeInput.value = 1024;
      }
      else if (sizeInput.value < 1) {
        sizeInput.value = 1;
      }

      this.initView(backGroundView, backGroundView.camera.camera3D.near, backGroundView.camera.camera3D.far, sizeInput.value, sizeInput.value);
    };
  }

  //パノラマ画像の作成イベント
  setCreateSphereMapEvent(mainView, view) {
    let createSphereMapButton = document.getElementById("createSphereMapDom_CreateSphereMapButton");
    createSphereMapButton.addEventListener("click", () => {
      console.log("createSphereMap")
      this.downloadSphereMap(mainView, view)
    });
  };

  downloadSphereMap(mainView, view) {
    let upVecX = new itowns.THREE.Vector3(
      1, 0, 0
    );
    let upVecY = new itowns.THREE.Vector3(
      0, 1, 0
    );
    if (mainView.controls) {
      mainView.controls.enabled = false;
      mainView.removeFrameRequester(itowns.MAIN_LOOP_EVENTS.AFTER_RENDER, this.updateBackgroundViewer);
    }

    let timer;

    let firstTimerCallBack = () => {
      if (this.animationCount === 0) {
        console.log("+++++++++++++++++++++++ right");
        //right
        this.rotateAngle(view, upVecX, 180);
        this.rotateAngle(view, upVecY, -180);

        this.animationCount++;
      }
    }
    this.timerCallBack = () => {
      clearTimeout(timer);
      view.mainLoop.gfxEngine.renderer.render(view.scene, view.camera.camera3D);
      this.saveImageAsDom(this.CUBE_MAP_IMAGE_TYPE[this.animationCount - 1], view.mainLoop.gfxEngine.renderer);

      if (this.animationCount === 6) {
        console.log("cube map complete");
        this.updateBackgroundViewer();

        this.animationCount = 0;
        this.createSphereMap();
        if (mainView.controls) {
          mainView.controls.enabled = true;
          mainView.addFrameRequester(itowns.MAIN_LOOP_EVENTS.AFTER_RENDER, this.updateBackgroundViewer);
        }
        view.removeFrameRequester(itowns.MAIN_LOOP_EVENTS.UPDATE_END, this.downloadSphereMap_callback);
        return;
      }

      this.createCubeMapRotateEvent(this.animationCount, view);
      let time = document.getElementById("createSphereMapDom_DelayTimeInput");
      timer = setTimeout(this.timerCallBack, Number(time.value) * 1000);
      this.animationCount++;
    }

    if (view.mainLoop.scheduler.commandsWaitingExecutionCount() === 0
      && view.mainLoop.renderingState === 0) {
      firstTimerCallBack();
    }
    else {
      let time = document.getElementById("createSphereMapDom_DelayTimeInput");
      timer = setTimeout(firstTimerCallBack, Number(time.value) * 1000);
    }
    this.downloadSphereMap_callback = () => {
      // console.log("updateend-----------------------");
      // console.log("commandsWaitingExecutionCount" + view.mainLoop.scheduler.commandsWaitingExecutionCount());
      // console.log("renderingState:" + view.mainLoop.renderingState);

      if (view.mainLoop.scheduler.commandsWaitingExecutionCount() === 0
        && view.mainLoop.renderingState === 0
      ) {
        this.timerCallBack();
      }
    }
    view.addFrameRequester(itowns.MAIN_LOOP_EVENTS.UPDATE_END, this.downloadSphereMap_callback);
  }

  createCubeMapRotateEvent(animationCount, view) {
    let upVecX = new itowns.THREE.Vector3(
      1, 0, 0
    );
    let upVecY = new itowns.THREE.Vector3(
      0, 1, 0
    );
    if (animationCount === 0) {
      console.log("+++++++++++++++++++++++ right");
      //right
      this.rotateAngle(view, upVecX, 180);
      this.rotateAngle(view, upVecY, -180);
    }
    else if (animationCount === 1) {
      console.log("+++++++++++++++++++++++ left");
      //left
      this.rotateAngle(view, upVecY, 360);
    }
    else if (this.animationCount === 2) {
      console.log("+++++++++++++++++++++++ top");
      //top
      this.rotateAngle(view, upVecY, -180);
      this.rotateAngle(view, upVecX, 180);
    }
    else if (this.animationCount === 3) {
      console.log("+++++++++++++++++++++++ down");
      //down
      this.rotateAngle(view, upVecX, -360);
    }
    else if (this.animationCount === 4) {
      console.log("+++++++++++++++++++++++ front");
      //front
      this.rotateAngle(view, upVecX, 180);
    }
    else if (this.animationCount === 5) {
      console.log("+++++++++++++++++++++++ back");
      //back
      this.rotateAngle(view, upVecY, 360);
    }
  }

  //DOMに画像を保存
  saveImageAsDom(type, renderer) {
    let dom = document.getElementById("createSphereMapDom_" + type);

    dom.href = renderer.domElement.toDataURL("image/png");
  }

  //DOMに保存された画像をダウンロード
  createScreenShot(type, fName) {
    let dom = document.getElementById("createSphereMapDom_" + type);
    dom.download = fName;
    dom.click();
  }

  //アングルを上ベクトルを軸にして回転する
  rotateAngle(view, upVec, angle) {
    let radian = angle * Math.PI / 360;
    let q = new itowns.THREE.Quaternion();
    //回転軸と角度からクォータニオンを計算
    q.setFromAxisAngle(upVec, radian);

    view.camera.camera3D.quaternion.multiply(q);
    view.camera.camera3D.updateProjectionMatrix();
    view.notifyChange(view.camera.camera3D);
  }

  /////スフィアマップを作成し、ダウンロードする/////
  createSphereMap() {
    this.initSphereMapRenderer();
    this.convertCubeMapToSphereMap();
  };

  //SM=SphereMap
  initSphereMapRenderer() {
    this.SM_width = 1;
    this.SM_height = 1;

    this.SM_renderer = new itowns.THREE.WebGLRenderer();
    //スクリーンサイズのセット
    let sphereMapWidth = this.view.camera.width * 4;
    let sphereMapHeight = sphereMapWidth / 2;
    this.SM_renderer.setSize(sphereMapWidth, sphereMapHeight);
    // 背景色の設定
    this.SM_renderer.setClearColor(0xffffff, 1); // ←追加

    let rendererDom = document.getElementById("createSphereMapDom_sphereMapViewer");
    if (rendererDom.children.length > 0) {
      rendererDom.textContent = null;
    }
    rendererDom.appendChild(this.SM_renderer.domElement);


    let vertexShader = `
attribute vec3 position;
attribute vec2 uv;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
varying vec2 vUv;
void main()  {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

    let fragmentShader = `
precision mediump float;
uniform samplerCube map;
varying vec2 vUv;
#define M_PI 3.1415926535897932384626433832795
void main()  {
	vec2 uv = vec2(vUv.x+0.25, vUv.y);
	float longitude = uv.x * 2. * M_PI - M_PI + M_PI / 2.;
	float latitude = uv.y * M_PI;
	vec3 dir = vec3(
		- sin( longitude ) * sin( latitude ),
		cos( latitude ),
		- cos( longitude ) * sin( latitude )
	);
	normalize( dir );
	gl_FragColor = textureCube( map, dir );
}
`;
    this.SM_material = new itowns.THREE.RawShaderMaterial({
      uniforms: {
        map: { type: 't', value: null }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: itowns.THREE.DoubleSide,
      transparent: true
    });
    this.SM_scene = new itowns.THREE.Scene();
    this.SM_quad = new itowns.THREE.Mesh(
      new itowns.THREE.PlaneBufferGeometry(1, 1),
      this.SM_material
    );
    this.SM_scene.add(this.SM_quad);

    this.SM_camera = new itowns.THREE.OrthographicCamera(1 / - 2, 1 / 2, 1 / 2, 1 / - 2, -10000, 10000);

    this.SM_canvas = document.createElement('canvas');

    this.setSMSize(sphereMapWidth, sphereMapHeight);
  };

  //パノラマ画像の大きさを設定
  setSMSize(width, height) {

    this.SM_width = width;
    this.SM_height = height;

    this.SM_quad.scale.set(this.SM_width, this.SM_height, 1);

    this.SM_camera.left = this.SM_width / - 2;
    this.SM_camera.right = this.SM_width / 2;
    this.SM_camera.top = this.SM_height / 2;
    this.SM_camera.bottom = this.SM_height / - 2;

    this.SM_camera.updateProjectionMatrix();

    this.SM_output = new itowns.THREE.WebGLRenderTarget(this.SM_width, this.SM_height, {
      minFilter: itowns.THREE.LinearFilter,
      magFilter: itowns.THREE.LinearFilter,
      wrapS: itowns.THREE.ClampToEdgeWrapping,
      wrapT: itowns.THREE.ClampToEdgeWrapping,
      format: itowns.THREE.RGBAFormat,
      type: itowns.THREE.UnsignedByteType
    });

    this.SM_canvas.width = this.SM_width;
    this.SM_canvas.height = this.SM_height;
  }

  //スフィアマップをキューブマップに変換
  convertCubeMapToSphereMap() {
    this.SM_renderer.getContext().getExtension('EXT_shader_texture_lod');
    let cubeLoader = new itowns.THREE.CubeTextureLoader();
    let imgPaths = [];
    for (let i = 0; i < 6; i++) {
      let cubeMapDom = document.getElementById("createSphereMapDom_" + this.CUBE_MAP_IMAGE_TYPE[i]);
      imgPaths[i] = cubeMapDom.href;
    }
    let cubeMap = cubeLoader.load(imgPaths, (loadedCubeMap) => {
      console.log("cubeMapLoaded")
      loadedCubeMap.generateMipmaps = true;
      loadedCubeMap.needsUpdate = true;
      this.SM_material.uniforms.map.value = loadedCubeMap

      this.SM_renderer.render(this.SM_scene, this.SM_camera);
      this.SM_renderer.render(this.SM_scene, this.SM_camera, this.SM_output, true);
      this.saveImageAsDom("SPHEREMAP", this.SM_renderer);

      let pixels = new Uint8Array(4 * this.SM_width * this.SM_height);
      this.SM_renderer.readRenderTargetPixels(this.SM_output, 0, 0, this.SM_width, this.SM_height, pixels);

      let imageData = new ImageData(new Uint8ClampedArray(pixels), this.SM_width, this.SM_height);
      // jpeg作成
      let jpegEnc = new JPEGEncoder();
      let jpegURI = jpegEnc.encode({
        width: this.SM_width,
        height: this.SM_height,
        data: imageData.data,
        xmp: this.createXMP(this.SM_width, this.SM_height)
      }, 70);

      let dom = document.getElementById("createSphereMapDom_SPHEREMAP_WITHMETA");
      dom.href = jpegURI;
      dom.download = "sphereMapWithMeta.jpg"
      dom.click();
    });
  };

  //メタ情報を付加
  createXMP(w, h, heading = 0, pitch = 0, roll = 0) {
    return '<?xpacket begin="ï»¿" id="W5M0MpCehiHzreSzNTczkc9d"?>' +
      '<x:xmpmeta xmlns:x="adobe:ns:meta/" xmptk="Sphere Blur">' +
      '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
      '<rdf:Description rdf:about="" xmlns:GPano="http://ns.google.com/photos/1.0/panorama/">' +
      '<GPano:ProjectionType>equirectangular</GPano:ProjectionType>' +
      '<GPano:UsePanoramaViewer>True</GPano:UsePanoramaViewer>' +
      '<GPano:CroppedAreaImageWidthPixels>' + w + '</GPano:CroppedAreaImageWidthPixels>' +
      '<GPano:CroppedAreaImageHeightPixels>' + h + '</GPano:CroppedAreaImageHeightPixels>' +
      '<GPano:FullPanoWidthPixels>' + w + '</GPano:FullPanoWidthPixels>' +
      '<GPano:FullPanoHeightPixels>' + h + '</GPano:FullPanoHeightPixels>' +
      '<GPano:CroppedAreaLeftPixels>0</GPano:CroppedAreaLeftPixels>' +
      '<GPano:CroppedAreaTopPixels>0</GPano:CroppedAreaTopPixels>' +
      '<GPano:PoseHeadingDegrees>' + heading + '</GPano:PoseHeadingDegrees>' +
      '<GPano:PosePitchDegrees>' + pitch + '</GPano:PosePitchDegrees>' +
      '<GPano:PoseRollDegrees>' + roll + '</GPano:PoseRollDegrees>' +
      '</rdf:Description>' +
      '</rdf:RDF>' +
      '</x:xmpmeta>' +
      '<?xpacket end="r"?>';
  }
}
