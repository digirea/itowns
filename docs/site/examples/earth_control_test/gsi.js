/**
 * Copyright (c) 2016-2018 Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * Copyright (c) 2016-2018 RIKEN Center for Computational Science. All rights reserved.
 */

/// 地理院地図(Color)を3D球体で表示する

window.onload = function () {

    // 地理院地図(Color)の読み込み
    function loadGSIColor() {
        itowns.Fetcher.json('./gsi.json').then(function (config) {
            var mapSource = new itowns.TMSSource(config.source);
            var layer = new itowns.ColorLayer(config.id, {
                source: mapSource,
                updateStrategy: {
                    type: 3
                },
            });
            view.addLayer(layer);
        });
    }

    // `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
    var viewerDiv = document.getElementById('viewerDiv');

    var placement = {
        coord: new itowns.Coordinates("EPSG:4326", 138.7539, 35.3539),
        range: 6500000 * 3
    };

    var view = new itowns.GlobeView(viewerDiv, placement, {
        noControls : true
    });
    view.camera.camera3D.far = itowns.ellipsoidSizes.x * 30;
    view.camera.resize(viewerDiv.clientWidth, viewerDiv.clientHeight);

    var controls = new itowns.EarthControls(view, placement);
    
    loadGSIColor();
};