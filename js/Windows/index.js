const ipc = require("electron").ipcRenderer;
var $ = require('jquery');
global.jQuery = require('jquery');
window.$ = require('jquery');
require('bootstrap');
var d3 = require('d3');
var GraphController = require('../js/Controllers/graph.js');


var legendController;
$(document).ready(function() {
    $("#import-button").on('click', function(){
      ipc.send('import-files');
    });

    var legendCanvas = d3.select("#legend-container svg");
    $('#legend-container').css('display', 'block');
    legendController = new GraphController(legendCanvas);
    legendController.addLegendNode(0, 0);
    legendController.addLegendNode(1, 1);
    legendController.addLegendNode(2, 2);
    legendController.addLegendNode(3, 3);
    legendController.redraw();
});
