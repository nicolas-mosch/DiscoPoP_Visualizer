var d3 = require('d3');
var ipc = require("electron").ipcRenderer;
var _ = require('lodash/core');
var hljs = require('highlight.js');
var dagreD3 = require('dagre-d3');
var data = null;
var editors = [];
var ranges = [];
var vis = require('vis');

$(document).ready(function() {
  $("#legendButton").click(function() {
    ipc.send('showLegend', 'test');
  });



});


ipc.on('alert', function(event, message) {
  alert(message);
});

ipc.on('setData', function(event, dat) {
  data = {};
  _.forEach(dat, function(value, key) {
    data[value.id] = value;
  });
});




ipc.on('renderGraph0', function(event, message) {
  var nodes = [];
  var edges = [];
  var nodeCount = message.nodes;
  var edgeCount = message.edges;
  alert('a');
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
  alert('b');
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
  alert('c');
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
    keyboard: true,
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
      childrenNodes: value.childrenNodes
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
        color: "#00FF00",
        label: "RAW",
        width: 3
      };
      edges.push(edge);
    });
    /*_.forEach(value1.WARDepsOn, function(value2, key2) {
      var edge = {
        from: value1.id,
        to: value2,
        arrows: 'to',
        color: "#00FF00",
        label: "WAR",
        width: 3
      };
      edges.push(edge);
    });*/
    _.forEach(value1.WAWDepsOn, function(value2, key2) {
      var edge = {
        from: value1.id,
        to: value2,
        arrows: 'to',
        color: "#00FF00",
        label: "WAW",
        width: 3
      };
      edges.push(edge);
    });

    _.forEach(value1.childrenNodes, function(value2, key2) {
      var edge = {
        from: value1.id,
        to: value2,
        color: "#000000"
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
    layout: {
      hierarchical: {
        direction: "UD",
        sortMethod: "hubsize"
      }
    },
    interaction: {
      navigationButtons: true,
      keyboard: true
    },
    physics: {
      enabled: false
    },
    keyboard: true,
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

  network.on("selectNode", function(params) {
    if (params.nodes.length == 1) {
      if (network.isCluster(params.nodes[0]) == true) {
        unhighlight();
        _.forEach(network.getNodesInCluster(params.nodes), function(value) {
          highlightNodeInCode(data[value]);
        });
      } else {
        unhighlight();
        highlightNodeInCode(data[params.nodes]);
        displayNodeInfo(data[params.nodes]);
      }
    }
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
    }
  });
  alert('Done');

});


function highlightNodeInCode(info) {
  var Range = ace.require('ace/range').Range;
  var start = info.start.split(':');
  var end = info.end.split(':');
  range = new Range(start[1] - 1, start[0] - 1, end[1], end[0] - 1);
  ranges.push(range);
  editors[4].addSelectionMarker(
    range
  );
}

function unhighlight() {
  _.forEach(ranges, function(value) {
    editors[4].removeSelectionMarker(value);
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






$(function() {
  var onSampleResized = function(e) {
    var columns = $(e.currentTarget).find("td");
  };
  $("#table").colResizable();
})

function initAce() {
  var i = 0;
  $('code-element').each(function(i, obj) {
    var container = obj.querySelector('div');
    var editor = ace.edit(container);
    editors[i] = editor;
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/c_cpp");
    editor.setReadOnly(true);
    editor.setHighlightActiveLine(false);
    editor.setOptions({
      maxLines: 1000
    });
    i++;
  });
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









// Zoom clustering
/*
  graph.once('initRedraw', function() {
    if (lastClusterZoomLevel === 0) {
      lastClusterZoomLevel = graph.getScale();
    }
  });

  graph.on('zoom', function(params) {
    if (params.direction == '-') {
      if (params.scale < lastClusterZoomLevel * clusterFactor) {
        makeClusters(params.scale);
        lastClusterZoomLevel = params.scale;
      }
    } else {
      openClusters(params.scale);
    }
  });

  function makeClusters(scale) {
    var clusterOptionsByData = {
      processProperties: function(clusterOptions, childNodes) {
        clusterIndex = clusterIndex + 1;
        var childrenCount = 0;
        for (var i = 0; i < childNodes.length; i++) {
          childrenCount += childNodes[i].childrenCount || 1;
        }
        clusterOptions.childrenCount = childrenCount;
        clusterOptions.label = "# " + childrenCount + "";
        clusterOptions.font = {
          size: childrenCount * 5 + 30
        }
        clusterOptions.id = 'cluster:' + clusterIndex;
        clusters.push({
          id: 'cluster:' + clusterIndex,
          scale: scale
        });
        return clusterOptions;
      },
      clusterNodeProperties: {
        borderWidth: 3,
        shape: 'database',
        font: {
          size: 30
        }
      }
    }

    graph.clusterOutliers(clusterOptionsByData);
    if (document.getElementById('stabilizeCheckbox').checked === true) {
      // since we use the scale as a unique identifier, we do NOT want to fit after the stabilization
      graph.setOptions({
        physics: {
          stabilization: {
            fit: false
          }
        }
      });
      graph.stabilize();
    }
  }

  function openClusters(scale) {
    var newClusters = [];
    var declustered = false;
    for (var i = 0; i < clusters.length; i++) {
      if (clusters[i].scale < scale) {
        graph.openCluster(clusters[i].id);
        lastClusterZoomLevel = scale;
        declustered = true;
      } else {
        newClusters.push(clusters[i])
      }
    }
    clusters = newClusters;
    if (declustered === true && document.getElementById('stabilizeCheckbox').checked === true) {
      // since we use the scale as a unique identifier, we do NOT want to fit after the stabilization
      graph.setOptions({
        physics: {
          stabilization: {
            fit: false
          }
        }
      });
      graph.stabilize();
    }
  }

*/
