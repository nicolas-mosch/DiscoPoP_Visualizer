var d3 = require('d3');
var dagreD3 = require('dagre-d3');
var ipc = require("electron").ipcMain;
var xml2js = require('xml2js');
var fs = require('fs');
var graphGenerator = require('./node_modules/graphGenerator/graphGenerator');
var g;


$(function() {

  var onSampleResized = function(e) {
    var columns = $(e.currentTarget).find("td");
  };


  $("#table").colResizable();

})



function initAce() {
  var editor = ace.edit("editor");

  editor.setTheme("ace/theme/monokai");
  editor.getSession().setMode("ace/mode/c_cpp");
  editor.setReadOnly(true);
  editor.setOptions({
    maxLines: 1000
  });

}


function renderGraph(path) {
  graphGenerator.buildGraphFromXML(path);
  alert('test');
}

function loadTestGraph() {

  g = new dagreD3.graphlib.Graph({
      compound: true
    })
    .setGraph({})
    .setDefaultEdgeLabel(function() {
      return {};
    });
  // Here we're setting the nodes
  g.setNode('a', {
    label: 'A'
  });
  g.setNode('b', {
    label: 'B'
  });
  g.setNode('c', {
    label: 'C'
  });
  g.setNode('d', {
    label: 'D'
  });
  g.setNode('e', {
    label: 'E'
  });
  g.setNode('f', {
    label: 'F'
  });
  g.setNode('g', {
    label: 'G'
  });
  g.setNode('group', {
    label: 'Group',
    clusterLabelPos: 'top',
    style: 'fill: #d3d7e8'
  });
  g.setNode('top_group', {
    label: 'Top Group',
    clusterLabelPos: 'bottom',
    style: 'fill: #ffd47f'
  });
  g.setNode('bottom_group', {
    label: 'Bottom Group',
    style: 'fill: #5f9488'
  });

  // Set the parents to define which nodes belong to which cluster
  g.setParent('top_group', 'group');
  g.setParent('bottom_group', 'group');
  g.setParent('b', 'top_group');
  g.setParent('c', 'bottom_group');
  g.setParent('d', 'bottom_group');
  g.setParent('e', 'bottom_group');
  g.setParent('f', 'bottom_group');

  // Set up edges, no special attributes.
  g.setEdge('a', 'b');
  g.setEdge('b', 'c');
  g.setEdge('b', 'd');
  g.setEdge('b', 'e');
  g.setEdge('b', 'f');
  g.setEdge('b', 'g');



  g.nodes().forEach(function(v) {
    var node = g.node(v);
    // Round the corners of the nodes
    node.rx = node.ry = 5;
  });

}


function renderGraph() {
  loadTestGraph();
  var render = new dagreD3.render();

  // Set up an SVG group so that we can translate the final graph.
  var svg = d3.select("svg"),
    inner = svg.append("g");

  // Set up zoom support
  var zoom = d3.behavior.zoom().on("zoom", function() {
    inner.attr("transform", "translate(" + d3.event.translate + ")" +
      "scale(" + d3.event.scale + ")");
  });
  svg.call(zoom);


  // Run the renderer. This is what draws the final graph.
  render(inner, g);

  inner.selectAll("g.cluster").on('click', function(d) {
    alert(d);
  });


  alert('Done');
}

module.exports = {
  loadTestGraph: loadTestGraph,
  buildGraphFromXML: buildGraphFromXML
};
