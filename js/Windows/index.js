var ipc = require("electron").ipcRenderer;
var _ = require('lodash/core');
var d3 = require('d3');
var dagreD3 = require('dagre-d3');
var $ = require('jquery');
global.jQuery = require('jquery');
window.$ = $;
require('bootstrap');
//require("colresizable");
var BootstrapMenu = require('bootstrap-menu');
var configuration = require('../js/Controllers/configuration.js');

var data = null;
var displayedData = null;

var fileMaps = null;
var editors = {};
var ranges = [];
var codeSnippets = null;
var tempSettings = null;

$(document).ready(function() {
  $("#legendButton").click(function() {
    ipc.send('showLegend', 'test');
  });
});


ipc.on('alert', function(event, message) {
  alert(message);
});

ipc.on('clearGraph', function(event, message){
  clearGraph();
});

ipc.on('setData', function(event, dat) {
  if (fileMaps == null) {
    alert('Import FileMapping first');
    return;
  } else {
    data = {};
    displayedData = {};
    codeSnippets = {};
    _.forEach(dat, function(node) {
      node.successorCUs = node.successorCUs || [];
      node.predecessorCUs = [];
      node.parentNode = '';
      data[node.id] = node;

    });


/*
    // Add parentNode and predecessorCUs properties to CU-nodes
    _.forEach(dat, function(node) {
      // parentNode
      for (var i = 0; i < node.childrenNodes.length; i++) {
        data[node.childrenNodes[i]].parentNode = node.id;
      }

      // predecessorCUs
      if (node.type == 0) {
        for (var i = 0; i < node.successorCUs.length; i++) {
          data[node.successorCUs[i]].predecessorCUs.push(node.id);
        }
      }
    });

    // Add successor and predecessor CUs to clusters
    _.forEach(data, function(node) {
      if (node.type == 1 || node.type == 2) {
        node.successorCUs = [];
        node.predecessorCUs = [];
        var childNode;
        for (var i = 0; i < node.childrenNodes.length; i++) {
          childNode = data[node.childrenNodes[i]];
          var successorNodeID;
          for (var j = 0; j < childNode.successorCUs.length; j++) {
            successorNodeID = childNode.successorCUs[j];
            if (node.childrenNodes.indexOf(successorNodeID) > -1) {
              node.successorCUs.push(successorNodeID);
            }
          }
          var predecessorNodeID;
          for (var j = 0; j < childNode.predecessorCUs.length; j++) {
            predecessorNodeID = childNode.predecessorCUs[j];
            if (node.childrenNodes.indexOf(predecessorNodeID) > -1) {
              node.predecessorCUs.push(predecessorNodeID);
            }
          }

          node.collapsed = true;
        }
      }
    });

*/

    console.log('Imported Node-Data', data);

  }
});

ipc.on('setFileMapping', function(event, dat) {
  fileMaps = dat;
  _.each(fileMaps, function(value, key) {
    var codeElement = document.createElement('div');
    codeElement.setAttribute('class', 'editor');
    codeElement.setAttribute('id', 'editor_' + key);
    codeElement.setAttribute('editor_id', key);
    var codeText = document.createTextNode(value.content);
    codeElement.appendChild(codeText);

    // Ace
    var editor = ace.edit(codeElement);
    editors[key] = editor;
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/c_cpp");
    editor.setReadOnly(true);
    editor.setHighlightActiveLine(false);
    editor.setOptions({
      maxLines: 1000,
      fontSize: "14pt"
    });
    document.getElementById("code-container").appendChild(codeElement);
  });

});

function display() {

}

ipc.on('renderGraph1', function(event, message) {
  // check which nodes to render

  var g = new dagreD3.graphlib.Graph({
      compound: true
    })
    .setGraph({})
    .setDefaultEdgeLabel(function() {
      return {};
    });

  // add Nodes
  _.forEach(data, function(value, key) {
    var fillColor, label;
    switch (value.type) {
      case 0:
        fillColor = configuration.readSetting('cuColor');
        label = value.id;
        break;
      case 1:
        fillColor = configuration.readSetting('functionColor');
        label = 'function (' + value.name + ')';
        break;
      case 2:
        fillColor = configuration.readSetting('loopColor');
        label = 'loop (' + value.id + ')';
        break;
      default:
        fillColor = configuration.readSetting('defaultColor');
        label = value.name;
    }
    var node = {
      id: value.id,
      label: label,
      style: 'fill: ' + fillColor,
      type: value.type,
      childrenNodes: value.childrenNodes,
      rx: 5,
      ry: 5
    };

    if (value.type != 0) {
      node.clusterLabelPos = 'bottom';
    }

    g.setNode(value.id, node);

  });

  // add Edges and children
  _.forEach(data, function(currentNode, key) {
    // add CU successor edges
    _.forEach(currentNode.successorCUs, function(successorNodeID) {
      g.setEdge(currentNode.id, successorNodeID, {
        style: "stroke: " + configuration.readSetting('cuColor') + "; stroke-width: 3px;",
        arrowheadStyle: "fill: " + configuration.readSetting('cuColor') + "; stroke: " + configuration.readSetting('cuColor')
      });
    });

    if (currentNode.type != 0) {
      _.forEach(currentNode.childrenNodes, function(childNodeID) {
        g.setParent(childNodeID, currentNode.id);
      });
    } else {
      _.forEach(currentNode.childrenNodes, function(childNodeID) {
        _.forEach(data[childNodeID].childrenNodes, function(grandChildNodeID) {
          g.setEdge(currentNode.id, grandChildNodeID, {
            style: "stroke: #000000; stroke-width: 1px; stroke-dasharray: 5, 5;",
            arrowheadStyle: "fill: #000000"
          });
        });
      });
    }
  });


  // Create the renderer
  var render = new dagreD3.render();

  // Set up an SVG group so that we can translate the final graph.
  var svg = d3.select("svg"),
    inner = svg.append("g");

  // Run the renderer. This is what draws the final graph.
  render(d3.select("svg g"), g);

  // Set up zoom support
  var zoom = d3.behavior.zoom().on("zoom", function() {
    inner.attr("transform", "translate(" + d3.event.translate + ")" +
      "scale(" + d3.event.scale + ")");
  });
  svg.call(zoom);

  // Center the graph
  var xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
  inner.attr("transform", "translate(" + xCenterOffset + ", 20)");
  svg.attr("height", g.graph().height + 40);


  // Set click behavior
  var nodes = inner.selectAll("g.node");
  nodes.on('click', function(d) {
    ipc.send('showCuInfo', data[d]);
    unhighlight();
    highlightNodeInCode(data[d]);
  });

  var clusters = inner.selectAll("g.cluster");
  clusters.on('click', function(d) {
    ipc.send('showCuInfo', data[d]);
    unhighlight();
    highlightNodeInCode(data[d]);
  });
  initContextMenus();
});

function expand(node) {
  g.graph().transition = function(selection) {
    return selection.transition().duration(500);
  };
  d3.select("svg g").call(render, g);
}


function highlightNodeInCode(info) {
  var Range = ace.require('ace/range').Range;
  var fileID = info.id.split(':')[0];
  var start = info.start.split(':');
  var end = info.end.split(':');
  var range = new Range(start[1] - 1, 0, end[1], 0);
  ranges.push(range);
  editors[fileID].addSelectionMarker(
    range
  );
}

function unhighlight() {
  console.log('Batman', editors);
  _.forEach(ranges, function(range) {
    _.forEach(editors, function(editor, key) {
      editors[key].removeSelectionMarker(range);
    });
  });
  ranges = [];
}

function displayNodeInfo(info) {
  /*var infoTable = document.getElementById('node-info');
  $("#node-info tr").remove();
  _.forEach(info, function(value, key) {
    var row = infoTable.insertRow();
    var cell = row.insertCell();
    cell.innerHTML = key;
    cell = row.insertCell();
    cell.innerHTML = "<pre>" + JSON.stringify(value, null, 2) + "</pre>";
  });*/
}

function removeNodeInfo() {
  var infoTable = document.getElementById('node-info');
  $("#node-info tr").remove();
}




function testProgressBar() {
  var elem = document.getElementById("progress-bar");

  var width = 0;
  var id = setInterval(frame, 70);

  function frame() {
    if (width == 100) {
      clearInterval(id);
      elem.style.display = "none";
    } else {
      width++;
      elem.style.width = width + '%';
      elem.innerHTML = width + "%";
    }
  }
  //$('#progress-bar').css("display", "none");
}

function initContextMenus() {
  var menu = new BootstrapMenu('.node', {
    actions: [{
      name: 'Action',
      onClick: function() {
        alert("'Action' clicked!");
      }
    }, {
      name: 'Another action',
      onClick: function() {
        alert("'Another action' clicked!");
      }
    }, {
      name: 'A third action',
      onClick: function() {
        alert("'A third action' clicked!");
      }
    }]
  });
}

function clearGraph(){
    $("svg").empty();
}
