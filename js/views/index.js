const ipc = require("electron").ipcRenderer;
var $ = require('jquery');
global.jQuery = require('jquery');
window.$ = require('jquery');
require('bootstrap');
var d3 = require('d3');
var GraphController = require('../js/controllers/graph');
var legendController;

ipc.on('redrawGraph', function(event, message) {
  legendController.redraw();
});

$(document).ready(function() {
    $("#import-button").on('click', function(){
      ipc.send('import-files');
    });

    var legendCanvas = d3.select("#legend-container svg");
    $('#legend-container').css('display', 'block');
    legendController = new GraphController(legendCanvas, [], false);
    legendController.createLegendGraph();
    legendController.redraw();
});
