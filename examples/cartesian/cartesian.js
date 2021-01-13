/**
 * Copyright (c) 2016-2018 Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * Copyright (c) 2016-2018 RIKEN Center for Computational Science. All rights reserved.
 */

/// Display Geographical Survey Map (Color) as a 3D sphere
import { OBJLoader } from "./three/OBJLoader.js";

function hideAllLayers(view) {
    var layers = view.getLayers();
    for (var i = 0; i < layers.length; ++i) {
        layers[i].visible = false;
    }
}


// Loading Geographical Survey Map (Color)
function loadGSIColor(view, callback) {
    itowns.Fetcher.json('./gsi.json').then(function (config) {
        var mapSource = new itowns.TMSSource(config.source);
        var layer = new itowns.ColorLayer(config.id, {
            source: mapSource,
            updateStrategy: {
                type: 3
            },
        });
        view.addLayer(layer);
        if (callback) { callback(); }
    });
}

function loadObjLayer(view, callback) {
    var manager = new itowns.THREE.LoadingManager();
    var objLoader = new OBJLoader(manager);
    objLoader.load('minimam3.obj', function (object) {
        var material = new THREE.MeshBasicMaterial({ color: 0x6699FF })
        for (var i = 0; i < object.children.length; ++i) {
            object.children[i].rotation.z = 90 * Math.PI / 180;
            object.children[i].rotation.y = 90 * Math.PI / 180;
            object.children[i].updateMatrixWorld();

            object.children[i].geometry.scale(100000, 100000, 100000);
            object.children[i].material = material;
        }
        view.scene.add(object);
        view.notifyChange();
    });
}

window.onload = function () {
    // `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
    var viewerDiv = document.getElementById('viewerDiv');

    var placement = {
        coord: new itowns.Coordinates('EPSG:4326', 0, 0),
        range: 25e6
    };
    var view = new itowns.GlobeView(viewerDiv, placement, {
        noControls: true
    });

    loadGSIColor(view, function () {
        hideAllLayers(view);
        view.notifyChange();
    });

    var grid = new itowns.THREE.GridHelper(10000000, 10);
    grid.geometry.rotateX(Math.PI / 2);
    view.scene.add(grid);

    var axes = new itowns.THREE.AxesHelper(10000000 * 2);
    view.scene.add(axes);

    var controls = new itowns.OrbitControls(view);

    // view obj
    loadObjLayer(view);

    // Generate a mesh bounding box and send it to the controller
    var button = document.createElement('button');
    button.style.position = 'fixed'
    button.style.left = '10px'
    button.style.top = '10px'
    button.style.zIndex = 1;
    button.textContent = 'Fit Camera'
    button.onclick = function () {
        var obj = view.scene.children[view.scene.children.length - 1];
        for (var i = 0; i < obj.children.length; ++i) {
            var child = obj.children[i];
            if (child.type === 'Mesh') {
                child.geometry.computeBoundingBox();
                controls.fitCamera((new itowns.THREE.Box3()).copy(child.geometry.boundingBox).applyMatrix4(child.matrixWorld));
            }
        }
    }
    document.body.appendChild(button);    

    var resetButton = document.createElement('button');
    resetButton.style.position = 'fixed'
    resetButton.style.left = '10px'
    resetButton.style.top = '35px'
    resetButton.style.zIndex = 1;
    resetButton.textContent = 'Reset Camera'
    resetButton.onclick = function () {
        controls.resetCamera();
    }

    document.body.appendChild(resetButton);

    /*
    var sideButton = document.createElement('button');
    sideButton.style.position = 'fixed'
    sideButton.style.left = '10px'
    sideButton.style.top = '60px'
    sideButton.style.zIndex = 1;
    sideButton.textContent = 'side'
    sideButton.onclick = function () {
        var obj = view.scene.children[view.scene.children.length - 1];
        for (var i = 0; i < obj.children.length; ++i) {
            var child = obj.children[i];
            if (child.type === 'Mesh') {
                child.geometry.computeBoundingBox();
                controls.sideCamera((new itowns.THREE.Box3()).copy(child.geometry.boundingBox).applyMatrix4(child.matrixWorld));
            }
        }
    }

    document.body.appendChild(sideButton);

    var overLookButton = document.createElement('button');
    overLookButton.style.position = 'fixed'
    overLookButton.style.left = '10px'
    overLookButton.style.top = '85px'
    overLookButton.style.zIndex = 1;
    overLookButton.textContent = 'overLook'
    overLookButton.onclick = function () {
        var obj = view.scene.children[view.scene.children.length - 1];
        for (var i = 0; i < obj.children.length; ++i) {
            var child = obj.children[i];
            if (child.type === 'Mesh') {
                child.geometry.computeBoundingBox();
                controls.overLookCamera((new itowns.THREE.Box3()).copy(child.geometry.boundingBox).applyMatrix4(child.matrixWorld));
            }
        }
    }

    document.body.appendChild(overLookButton);
    */

    // let para = document.createElement('div');
    // para.style.position = 'fixed'
    // para.style.left = '10px'
    // para.style.top = '35px'
    // para.style.zIndex = 1;
    // para.id = "para";
    // this.document.body.appendChild(para);

    // let xp = document.createElement('input');

    // xp.style.position = 'fixed'
    // xp.style.left = '10px'
    // xp.style.top = '35px'
    // xp.style.color = "red"
    // xp.style.zIndex = 1;
    // xp.id = "positionx";

    // para.appendChild(xp);

    // let yp = document.createElement('input');

    // yp.style.position = 'fixed'
    // yp.style.left = '10px'
    // yp.style.top = '60px'
    // yp.style.color = "red"
    // yp.style.zIndex = 1;
    // yp.id = "positiony";

    // para.appendChild(yp);

    // let zp = document.createElement('input');

    // zp.style.position = 'fixed'
    // zp.style.left = '10px'
    // zp.style.top = '85px'
    // zp.style.color = "red"
    // zp.style.zIndex = 1;
    // zp.id = "positionz";

    // para.appendChild(zp);

    //injectChOWDER(view, viewerDiv);
};