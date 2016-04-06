var d3 = require('d3');
var ipc = require("electron").ipcRenderer;
var _ = require('lodash/core');
var hljs = require('highlight.js');
var dagreD3 = require('dagre-d3');
var data = null;
var fileMaps = null;
var editors = {};
var ranges = [];
var vis = require('vis');
var codeSnippets = null;

$(document).ready(function() {
  $("#legendButton").click(function() {
    ipc.send('showLegend', 'test');
  });
});


ipc.on('alert', function(event, message) {
  alert(message);
});

ipc.on('setData', function(event, dat) {
  if (fileMaps == null){
    alert('Import FileMapping first');
    return;
  }
  else {
    data = {};
    codeSnippets = {};
    _.forEach(dat, function(value, key) {
      data[value.id] = value;
      /*var Range = ace.require('ace/range').Range;
      var start = info.start.split(':');
      var end = info.end.split(':');
      range = new Range(start[1] - 1, start[0] - 1, end[1], end[0] - 1);
      ranges.push(range);
      editors[4].addSelectionMarker(
        range
      );
      data[value.id].code = ""*/
    });
  }
});

ipc.on('setFileMapping', function(event, dat) {
  fileMaps = dat;
  _.each(fileMaps, function(value, key){
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
      maxLines: 1000
    });
    document.getElementById("code-container").appendChild(codeElement);
  });

});

ipc.on('renderGraph0', function(event, message) {
  var nodes = [];
  var edges = [];
  var nodeCount = message.nodes;
  var edgeCount = message.edges;
  for (i = 0; i < nodeCount; i++) {
    var rand = Math.floor((Math.random() * 4));
    var fillColor;
    switch (rand) {
      case 0:
        fillColor = "#00FF00";
        break;
      case 1:
        fillColor = "#00FFFF";
        break;
      case 2:
        fillColor = "#FF6633";
        break;
      case 3:
        fillColor = "#FFFF33";
        break;
      default:
        fillColor = "";
    }
    var node = {
      id: i,
      label: i,
      color: fillColor,
    };
    nodes.push(node);
  }

  for (i = 0; i < edgeCount; i++) {
    var rand1 = Math.floor((Math.random() * nodeCount));
    var rand2 = Math.floor((Math.random() * nodeCount));
    var edge = {
      from: rand1,
      to: rand2,
      arrows: 'to',
      width: 3
    };
    edges.push(edge);
  }
  var container = document.getElementById('graph-container');
  var graphData = {
    nodes: nodes,
    edges: edges,
  };
  var options = {
    width: '100%',
    height: '100%',

    interaction: {
      navigationButtons: true,
      keyboard: true
    },
    physics: {
      enabled: false
    },
    configure: {
      filter: function(option, path) {
        if (path.indexOf('hierarchical') !== -1) {
          return true;
        }
        return false;
      },
      showButton: false,
      container: document.getElementById("layoutConfigContainer")
    }

  };

  var network = new vis.Network(container, graphData, options);


  alert('Done');
});




ipc.on('renderGraph1', function(event, message) {
  var nodes = [];
  var edges = [];
  var clusterIndex = 0;
  var clusters = [];
  var lastClusterZoomLevel = 0;
  var clusterFactor = 0.9;

  // add Nodes
  _.forEach(data, function(value, key) {
    var fillColor;
    switch (value.type) {
      case 0:
        fillColor = "#00FF00";
        break;
      case 1:
        fillColor = "#00FFFF";
        break;
      case 2:
        fillColor = "#FF6633";
        break;
      case 3:
        fillColor = "#FFFF33";
        break;
      default:
        fillColor = "";
    }
    var node = {
      id: value.id,
      label: value.id,
      color: fillColor,
      type: value.type,
      childrenNodes: value.childrenNodes,
      value: value.type
    };
    if (value.type != 3)
      nodes.push(node);

  });

  // add Edges
  _.forEach(data, function(value1, key1) {
    _.forEach(value1.RAWDepsOn, function(value2, key2) {
      var edge = {
        from: value1.id,
        to: value2,
        arrows: 'to',
        color: "#FFFF33",
        label: "RAW",
        width: 1
      };
      edges.push(edge);
    });/*
    _.forEach(value1.WARDepsOn, function(value2, key2) {
      var edge = {
        from: value1.id,
        to: value2,
        arrows: 'to',
        color: "#00FF00",
        label: "WAR",
        width: 1
      };
      edges.push(edge);
    });
    _.forEach(value1.WAWDepsOn, function(value2, key2) {
      var edge = {
        from: value1.id,
        to: value2,
        arrows: 'to',
        color: "#00FF00",
        label: "WAW",
        width: 1
      };
      edges.push(edge);
    });*/

    _.forEach(value1.childrenNodes, function(value2, key2) {
      if (data[value2].type != 3) {
        var edge = {
          from: value1.id,
          to: value2,
          color: "#000000",
          dashes: true
        };
        edges.push(edge);
      }
    });

    _.forEach(value1.successorCUs, function(value2, key2) {
      var edge = {
        from: value1.id,
        to: value2,
        arrows: 'to',
        color: "#00FF00",
        width: 3
      };
      edges.push(edge);
    });
  });

  var container = document.getElementById('graph-container');
  var graphData = {
    nodes: nodes,
    edges: edges,
  };
  var options = {
    width: '100%',
    height: '100%',
    interaction: {
      navigationButtons: true,
      keyboard: true
    },
    /*layout: {
      hierarchical: {
        direction: "UD",
        sortMethod: "hubsize"
      }
    },*/
    physics: {
      enabled: true
    },
    /*configure: {
      filter: function(option, path) {
        if (path.indexOf('hierarchical') !== -1) {
          return true;
        }
        return false;
      },
      showButton: false,
      container: document.getElementById("layoutConfigContainer")
    }*/
  };

  var network = new vis.Network(container, graphData, options);

  network.on("selectNode", function(params) {
    if (params.nodes.length == 1) {
      if (network.isCluster(params.nodes[0]) == true) {
        unhighlight();
        _.forEach(network.getNodesInCluster(params.nodes), function(value) {
          highlightNodeInCode(data[value]);
        });
      } else {
        displayNodeInfo(data[params.nodes]);
        unhighlight();
        highlightNodeInCode(data[params.nodes]);
      }
    }
  });
  network.on("deselectNode", function(params) {
    unhighlight();
    removeNodeInfo();
  });



  network.on("oncontext", function(params) {
    if (network.isCluster(params.nodes[0]) == true) {
      network.openCluster(params.nodes[0]);
    } else {

      var clusterIDs = [];
      var childrenNodes = data[params.nodes[0]].childrenNodes.slice();
      while (childrenNodes.length > 0) {
        var nodeID = childrenNodes.pop();
        clusterIDs.push(nodeID);
        _.forEach(data[nodeID].childrenNodes, function(value) {
          childrenNodes.push(value);
        });
      }

      network.cluster({
        joinCondition: function(nodeOptions) {

          if (nodeOptions.id == params.nodes[0] || clusterIDs.indexOf(nodeOptions.id) != -1) {
            //alert("Clustering " + nodeOptions.id);
            return true;
          }
          return false;
        },
        clusterNodeProperties: {
          id: 'cluster:' + params.nodes[0],
          borderWidth: 3,
          shape: 'database',
          label: params.nodes[0]
        }
      });

      network.stabilize(2000);
    }
  });


  _.forEach(nodes, function(node, key) {

    if (node.type == 0) {
      var clusterIDs = [];
      var childrenNodes = data[node.id].childrenNodes.slice();
      while (childrenNodes.length > 0) {
        var nodeID = childrenNodes.pop();
        clusterIDs.push(nodeID);
        _.forEach(data[nodeID].childrenNodes, function(value) {
          childrenNodes.push(value);
        });
      }
      network.cluster({
        joinCondition: function(nodeOptions) {
          if (nodeOptions.id == node.id || clusterIDs.indexOf(nodeOptions.id) != -1) {
            //alert("Clustering " + nodeOptions.id);
            return true;
          }
          return false;
        },
        clusterNodeProperties: {
          id: 'cluster:' + node.id,
          borderWidth: 3,
          shape: 'database',
          label: node.id,
          color: "#00FF00"
        }
      });
    }
  });



  network.stabilize(2000);

  alert('Done');

});


function highlightNodeInCode(info) {
  var Range = ace.require('ace/range').Range;
  var fileID = info.id.split(':')[0];
  var start = info.start.split(':');
  var end = info.end.split(':');
  var range = new Range(start[1] - 1, 0, end[1], 0);
  ranges.push(range);
  console.log('Robin', editors);
  console.log('ID', fileID);
  console.log('Joker', editors[fileID]);
  editors[fileID].addSelectionMarker(
    range
  );
}

function unhighlight() {
  console.log('Batman', editors);
  _.forEach(ranges, function(range) {
    _.forEach(editors, function(editor, key){
      console.log('key: ', key);
      console.log('editor: ', editor);
      console.log('range: ', range);
      editors[key].removeSelectionMarker(range);
    });
  });
  ranges = [];
}

function displayNodeInfo(info) {
  var infoTable = document.getElementById('node-info');
  $("#node-info tr").remove();
  _.forEach(info, function(value, key) {
    var row = infoTable.insertRow();
    var cell = row.insertCell();
    cell.innerHTML = key;
    cell = row.insertCell();
    cell.innerHTML = "<pre>" + JSON.stringify(value, null, 2) + "</pre>";
  });
}

function removeNodeInfo(){
  var infoTable = document.getElementById('node-info');
  $("#node-info tr").remove();
}






$(function() {
  var onSampleResized = function(e) {
    var columns = $(e.currentTarget).find("td");
  };
  $("#table").colResizable();
})


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
