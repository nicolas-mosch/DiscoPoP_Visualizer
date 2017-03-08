const ipc = require("electron").ipcRenderer;
var $ = require('jquery');
global.jQuery = require('jquery');
window.$ = require('jquery');
require('bootstrap');
var d3 = require('d3');
var configuration = require('../js/general/configuration');

ipc.on('redrawGraph', function(event, message) {
  colorLegendGraph();
});

ipc.on('alert', function(event, message) {
	alert(message);
});

$(document).ready(function() {
    $("#import-button").on('click', function(){
      ipc.send('import-files');
    });
    colorLegendGraph();
});

function colorLegendGraph(){
  var inner = d3.select("#legend-graph");

  inner.selectAll('g.cu-node polygon').style("fill", configuration.readSetting('cuColorFill'));
  $(".cu-node-label").css("color", configuration.readSetting('cuColorLabel'));

  inner.selectAll('g.function-node polygon').style("fill", configuration.readSetting('functionColorFill'));
  $(".function-node-label").css("color", configuration.readSetting('functionColorLabel'));

  inner.selectAll('g.loop-node ellipse').style("fill", configuration.readSetting('loopColorFill'));
  $(".loop-node-label").css("color", configuration.readSetting('loopColorLabel'));

  inner.selectAll('g.library-function-node polygon').style("fill", configuration.readSetting('libraryFunctionColorFill'));
  $(".library-function-node-label").css("color", configuration.readSetting('libraryFunctionColorLabel'));

  inner.selectAll('g.default-node polygon').style("fill", configuration.readSetting('defaultColorFill'));
  $(".default-node-label").css("color", configuration.readSetting('defaultColorLabel'));

  //  Edges
  inner.selectAll('g.flow-edge path')
    .style("stroke", configuration.readSetting('flowEdgeFill'))
    .style("stroke-width", configuration.readSetting('flowEdgeWidth'));
  inner.selectAll('g.flow-edge polygon')
    .style("stroke", configuration.readSetting('flowEdgeFill'))
    .style("fill", configuration.readSetting('flowEdgeWidth'));
  inner.selectAll('g.dependency-edge path')
    .style("stroke", configuration.readSetting('dependencyEdgeFill'))
    .style("stroke-width", configuration.readSetting('dependencyEdgeWidth'));
  inner.selectAll('g.dependency-edge polygon')
    .style("stroke", configuration.readSetting('dependencyEdgeFill'))
    .style("fill", configuration.readSetting('dependencyEdgeWidth'));
  inner.selectAll('g.function-call-edge path')
    .style("stroke", configuration.readSetting('functionCallEdgeFill'))
    .style("stroke-width", configuration.readSetting('functionCallEdgeWidth'));
  inner.selectAll('g.function-call-edge polygon')
    .style("stroke", configuration.readSetting('functionCallEdgeFill'))
    .style("fill", configuration.readSetting('functionCallEdgeWidth'));
}
