

class CreateSphereMap {
  constructor(view, viewerDiv) {
    //domの作成
    this.createDom();

    //itownsのviewerの初期化
    this.view = view;
    this.targetRenderer = view.mainLoop.gfxEngine.renderer;
    this.targetCamera = view.camera;
    this.targetControls = view.controls;
    this.initViewer();

    //キューブマップ作製用の変数
    this.CUBE_MAP_IMAGE_TYPE = [
      "RIGHT",
      "LEFT",
      "TOP",
      "DOWN",
      "FRONT",
      "BACK"
    ]
    this.saveCubeMapImage_FLAG = false;
    this.animationCount = 0;

    //イベントの登録
    this.viewerDiv = viewerDiv;
    this.setEvent();

    //スフィアマップレンダラの初期化
    this.initSphereMapRenderer();
  }

  createDom() {
    let body = document.body;
    let jpegEncoderBasic = document.createElement("script");
    jpegEncoderBasic.type = "text/javascript";
    jpegEncoderBasic.src = "./js/projectNict/jpeg_encoder_basic.js";
    body.appendChild(jpegEncoderBasic);

    let createSphereMapDom = document.createElement("div");
    createSphereMapDom.id = "createSphereMapDom";
    {
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
        let createSphereMapDom_CreateSphereMapButtonTime = document.createElement("a");
        createSphereMapDom_CreateSphereMapButtonTime.id = "createSphereMapDom_CreateSphereMapButtonTime";
        createSphereMapDom_CreateSphereMapButtonTime.classList.add("button");
        createSphereMapDom_CreateSphereMapButtonTime.innerHTML = "スフィアマップ作製(時間)"
        {

        }
        createSphereMapDom_buttonArea.appendChild(createSphereMapDom_CreateSphereMapButtonTime)

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

  initViewer() {
    this.targetControls.enabled = false;
    this.targetCamera.camera3D.fov = 90;
    this.targetCamera.camera3D.aspect = 1;
    this.targetCamera.camera3D.height = 512;
    this.targetCamera.camera3D.width = 512;
    this.targetCamera.height = 512;
    this.targetCamera.width = 512;
    this.targetCamera.camera3D.updateProjectionMatrix();
    this.targetRenderer.setPixelRatio(1);

    this.targetControls.enabled = true;
    this.view.notifyChange(this.targetCamera.camera3D);
  }

  saveCubeMapImageAsDom(type, renderer) {
    let dom = document.getElementById("createSphereMapDom_" + type);

    dom.href = renderer.domElement.toDataURL("image/png");
  }

  createScreenShot(type, fName) {
    let dom = document.getElementById("createSphereMapDom_" + type);
    dom.download = fName;
    dom.click();
  }

  /////イベントの登録/////
  setEvent() {
    let upVecY = new itowns.THREE.Vector3(
      0, 1, 0
    );
    let CameraTest = document.getElementById("createSphereMapDom_CameraTest");
    CameraTest.addEventListener("click", () => {
      this.rotateAngle(upVecY, -90);
    });
    this.setSizeChangeEvent();
    this.setCreateSphereMapEvent();
    this.setCreateSphereMapEvent2();
  };

  setSizeChangeEvent() {
    let sizeInput = document.getElementById("createSphereMapDom_CubeMapImageSizeInput");
    sizeInput.value = this.targetCamera.height;
    sizeInput.onchange = () => {
      console.log("sizeChange")
      if (sizeInput.value > 1024) {
        sizeInput.value = 1024;
      }
      else if (sizeInput.value < 1) {
        sizeInput.value = 1;
      }
      //itowns側の設定を変更
      this.view.controls.enabled = false;
      this.targetCamera.camera3D.height = sizeInput.value;
      this.targetCamera.camera3D.width = sizeInput.value;
      this.targetCamera.height = sizeInput.value;
      this.targetCamera.width = sizeInput.value;
      this.targetCamera.camera3D.updateProjectionMatrix();
      this.targetRenderer.setSize(sizeInput.value, sizeInput.value);
      this.targetControls.enabled = true;
      this.view.notifyChange(this.targetCamera.camera3D);

      //html側のスタイルの変更
      let size = sizeInput.value.toString();
      let halfSize = (sizeInput.value / 2).toString();
      this.viewerDiv.style.height = size + "px";
      this.viewerDiv.style.width = size + "px";
      this.viewerDiv.style.left = "calc(50% - " + halfSize + "px)";
      this.viewerDiv.style.top = "calc(50% - " + halfSize + "px)";
      for (let i = 0; i < this.viewerDiv.children.length; i++) {
        this.viewerDiv.children[i].style.height = size + "px";
        this.viewerDiv.children[i].style.width = size + "px";
      }
    };
  }

  setCreateSphereMapEvent() {
    let createSphereMapButton = document.getElementById("createSphereMapDom_CreateSphereMapButtonTime");
    createSphereMapButton.addEventListener("click", () => {
      console.log("createSphereMap")
      this.downloadSphereMap()
    });
  };
  setCreateSphereMapEvent2() {
    let createSphereMapButton = document.getElementById("createSphereMapDom_CreateSphereMapButton");
    createSphereMapButton.addEventListener("click", () => {
      console.log("createSphereMap")
      this.downloadSphereMap2()
    });
  };

  downloadSphereMap() {
    let upVecX = new itowns.THREE.Vector3(
      1, 0, 0
    );
    let upVecY = new itowns.THREE.Vector3(
      0, 1, 0
    );
    this.targetControls.enabled = false;
    var id = setInterval(() => {
      if (this.animationCount == 0) {
        //right
        this.rotateAngle(upVecY, -90);
      }
      else if (this.animationCount == 1) {
        this.saveCubeMap(this.animationCount - 1);
        //left
        this.rotateAngle(upVecY, 180);
      }
      else if (this.animationCount == 2) {
        this.saveCubeMap(this.animationCount - 1);
        //top
        this.rotateAngle(upVecY, -90);
        this.rotateAngle(upVecX, 90);
      }
      else if (this.animationCount == 3) {
        this.saveCubeMap(this.animationCount - 1);
        //down
        this.rotateAngle(upVecX, -180);
      }
      else if (this.animationCount == 4) {
        this.saveCubeMap(this.animationCount - 1);
        //front
        this.rotateAngle(upVecX, 90);
      }
      else if (this.animationCount == 5) {
        //back
        this.saveCubeMap(this.animationCount - 1);
        this.rotateAngle(upVecY, 180);
      }
      if (this.animationCount > 5) {
        this.saveCubeMap(this.animationCount - 1);
        this.rotateAngle(upVecY, -180);

        this.animationCount = 0;
        clearInterval(id);
        this.createSphereMap();
        this.targetControls.enabled = true;
        return;
      }
      this.animationCount++;
    }, 5000);
  }

  downloadSphereMap2() {
    let upVecX = new itowns.THREE.Vector3(
      1, 0, 0
    );
    let upVecY = new itowns.THREE.Vector3(
      0, 1, 0
    );
    this.targetControls.enabled = false;
    if (this.animationCount === 0) {
      //right
      this.rotateAngle(upVecY, -90);

      this.animationCount++;
    }
    this.downloadSphereMap2_callback = () => {
      console.log("updateend-----------------------");
      console.log("commandsWaitingExecutionCount" + this.view.mainLoop.scheduler.commandsWaitingExecutionCount());
      console.log("needsredraw:" + this.view.mainLoop.needsRedraw);
      console.log("_updateLoopRestarted:" + this.view.mainLoop._updateLoopRestarted);
      console.log("renderingState:" + this.view.mainLoop.renderingState);

      if (this.view.mainLoop.scheduler.commandsWaitingExecutionCount() === 0
        // && this.view.mainLoop._updateLoopRestarted === false
        && this.view.mainLoop.renderingState === 0
      ) {
        console.log("shot")

        if (this.animationCount === 1) {
          console.log("co" + this.animationCount + "+++++++++++");
          this.saveCubeMap(this.animationCount - 1);
          //left
          this.rotateAngle(upVecY, 180);
        }
        else if (this.animationCount === 2) {
          console.log("co" + this.animationCount + "+++++++++++");
          this.saveCubeMap(this.animationCount - 1);
          //top
          this.rotateAngle(upVecY, -90);
          this.rotateAngle(upVecX, 90);
        }
        else if (this.animationCount === 3) {
          console.log("co" + this.animationCount + "+++++++++++");
          this.saveCubeMap(this.animationCount - 1);
          //down
          this.rotateAngle(upVecX, -180);
        }
        else if (this.animationCount === 4) {
          console.log("co" + this.animationCount + "+++++++++++");
          this.saveCubeMap(this.animationCount - 1);
          //front
          this.rotateAngle(upVecX, 90);
        }
        else if (this.animationCount === 5) {
          console.log("co" + this.animationCount + "+++++++++++");
          //back
          this.saveCubeMap(this.animationCount - 1);
          this.rotateAngle(upVecY, 180);
        }
        else if (this.animationCount === 6) {
          console.log("co" + this.animationCount + "+++++++++++");
          this.saveCubeMap(this.animationCount - 1);
          this.rotateAngle(upVecY, -180);

          this.animationCount = 0;
          this.createSphereMap();
          this.targetControls.enabled = true;
          this.view.removeFrameRequester(itowns.MAIN_LOOP_EVENTS.UPDATE_END, this.downloadSphereMap2_callback);
          return;
        }
        this.animationCount++;
      }
    }
    this.view.addFrameRequester(itowns.MAIN_LOOP_EVENTS.UPDATE_END, this.downloadSphereMap2_callback);
  }



  saveCubeMap(id) {
    this.targetRenderer.render(this.view.scene, this.targetCamera.camera3D);
    this.saveCubeMapImageAsDom(this.CUBE_MAP_IMAGE_TYPE[id], this.targetRenderer);

    if (this.saveCubeMapImage_FLAG) {
      this.createScreenShot(this.CUBE_MAP_IMAGE_TYPE[id], "environment" + id.toString() + ".png");
    }
  }

  //アングルを上ベクトルを軸にして回転する
  rotateAngle(upVec, angle) {
    let radian = angle * Math.PI / 360;
    let q = new itowns.THREE.Quaternion();
    //回転軸と角度からクォータニオンを計算
    q.setFromAxisAngle(upVec, radian);

    this.targetCamera.camera3D.quaternion.multiply(q);
    this.targetCamera.camera3D.updateProjectionMatrix();
    this.targetControls.camera.quaternion.multiply(q);
    this.targetControls.camera.updateProjectionMatrix();

    this.view.notifyChange(this.targetCamera.camera3D);
    this.view.notifyChange(this.targetControls.camera);
  }

  //スフィアマップを作成し、ダウンロードする
  createSphereMap() {
    this.initSphereMapRenderer();
    this.convertCubeMapToSphereMap();
    //createScreenShot();
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
	vUv = vec2( 1.- uv.x, uv.y );
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

    let fragmentShader = `
precision mediump float;
uniform samplerCube map;
varying vec2 vUv;
#define M_PI 3.1415926535897932384626433832795
void main()  {
	vec2 uv = vUv;
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
    this.SM_ctx = this.SM_canvas.getContext('2d');

    // let gl = this.SM_renderer.getContext();
    // this.cubeMapSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE)

    this.setSMSize(sphereMapWidth, sphereMapHeight);
  };

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

  convertCubeMapToSphereMap() {
    this.SM_renderer.context.getExtension('EXT_shader_texture_lod');
    let cubeLoader = new itowns.THREE.CubeTextureLoader();
    let imgPaths = [];
    for (let i = 0; i < 6; i++) {
      let cubeMapDom = document.getElementById("createSphereMapDom_" + this.CUBE_MAP_IMAGE_TYPE[i]);
      imgPaths[i] = cubeMapDom.href;
    }
    let cubeMap = cubeLoader.load(imgPaths, (loadedCubeMap) => {
      console.log("load")
      loadedCubeMap.generateMipmaps = true;
      loadedCubeMap.needsUpdate = true;
      this.SM_material.uniforms.map.value = loadedCubeMap

      this.SM_renderer.render(this.SM_scene, this.SM_camera);
      this.SM_renderer.render(this.SM_scene, this.SM_camera, this.SM_output, true);
      this.saveCubeMapImageAsDom("SPHEREMAP", this.SM_renderer);
      this.createScreenShot("SPHEREMAP", "sphereMap.png");

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