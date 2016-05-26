const ipc = require("electron").ipcRenderer;
var _ = require('lodash/core');
var d3 = require('d3');
var GraphController = require('../js/Controllers/graph.js');
var EditorController = require('../js/Controllers/editor.js');
var $ = require('jquery');
global.jQuery = require('jquery');
window.$ = require('jquery');
require('bootstrap');
var DataImporter = require('../js/Controllers/data-importer.js');
var sizeof = require('sizeof');
var BootstrapMenu = require('bootstrap-menu');
var Handlebars = require('handlebars');



var graphController;
var editorController;
var legendController;

var nodeData;
var fileMaps;
var fileNodeIntervalTrees;

ipc.on('alert', function(event, message) {
  alert(message);
});

ipc.on('clearGraph', function(event, message) {
  clearGraph();
});

ipc.on('redrawGraph', function(event, message) {
  graphController.redraw();
});

ipc.on('init', function(event, mappingPath, nodesPath) {
  var canvas = d3.select("#flow-graph-container svg");
  var legendCanvas = d3.select("#legend-container svg");
  var data = DataImporter.buildFromFile(mappingPath, nodesPath);
  nodeData = data.nodeData;
  fileMaps = data.fileMapping;
  fileNodeIntervalTrees = data.fileNodeIntervalTrees;

  graphController = new GraphController(canvas);
  _.each(data.rootNodes, function(node) {
    graphController.addNode(node);
  });

  legendController = new GraphController(legendCanvas);
  legendController.addLegendNode(0, 0);
  legendController.addLegendNode(1, 1);
  legendController.addLegendNode(2, 2);
  legendController.addLegendNode(3, 3);
  legendController.redraw();



  editorController = new EditorController(data.fileMapping);
  $('#file-select-tab').trigger('click');
  initEventListeners();
  graphController.redraw();
  //Graph
});

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

function initEventListeners() {
  // Misc click behavior
  //  Node-Info
  $("#node-info-button").on('click', function() {
    $("#node-info-container").slideToggle("medium", function() {
      if ($("#node-info-container").is(":hidden")) {
        $('#node-info-collapse-icon').removeClass('glyphicon-collapse-up');
        $('#node-info-collapse-icon').addClass('glyphicon-collapse-down');
      } else {
        $('#node-info-collapse-icon').removeClass('glyphicon-collapse-down');
        $('#node-info-collapse-icon').addClass('glyphicon-collapse-up');
      }
    });

  });
  //  Reset-View
  $("#reset-view-button").on('click', function() {
    graphController.resetView();
  });

  // Legend
  $("#show-legend-button").on('click', function() {
    $("#legend-container").slideToggle("medium", function() {
      legendController.resetView();
      legendController.redraw();
    });
  });


  // File selector click behavior
  $('#file-select-container').on("changed.jstree", function(e, data) {
    if (data.node.type == "file") {
      editorController.displayFile(data.node.id);
      $('#code-container-tab').trigger('click');
      editorController.unhighlight();
    }
  });

  // Unhighlight editor on click
  var editor = $('#ace-editor');
  editor.on('mousedown', function() {
    editorController.unhighlight();
  });

  // Graph click behavior
  var graphContainer = $("#flow-graph-container");

  // Dependency edges
  graphContainer.delegate('.dependency-edge-label', 'click', function() {
    unhighlightNodes();
    var parts = this.id.split('-');
    var dependency = nodeData[parts[0]][parts[1]][parts[2]];
    editorController.displayFile(parts[0].split(':')[0]);
    editorController.highlightDependencyInCode(dependency, parts[1]);
  });

  // Function-call edges
  graphContainer.delegate('.function-call-edge-label', 'click', function() {
    var fileID = this.id.split(':')[0];
    var lineNumber = this.id.split(':')[1];
    editorController.displayFile(fileID);
    editorController.unhighlight();
    console.log('LINE NUMBER', lineNumber);
    editorController.highlightLine(lineNumber);
  });

  // Node selection
  graphContainer.delegate('g.node, g.cluster', 'click', function(e) {
    e.stopImmediatePropagation();
    var node = nodeData[this.id];
    if ($(this).hasClass('selected-node')) {
      unhighlightNodes();
      return;
    }
    editorController.unhighlight();
    editorController.highlightNodeInCode(node);
    graphController.unhighlightNodes();
    graphController.highlightNode(node);

    var type;
    switch (node.type) {
      case 0:
        type = "Computational-Unit";
        break;
      case 1:
        type = "Function";
        break;
      case 2:
        type = "Loop";
        break;
      case 3:
        type = "Library-Function";
        break;
      default:
        type = "undefined";
    }

    var data = {
      name: node.name,
      file: fileMaps[node.id.split(':')[0]].path.split('/').slice(-1)[0],
      lines: node.start.split(':')[1] + ' - ' + node.end.split(':')[1],
      type: type
    }

    if (!node.type) {
      data.read = humanFileSize(node.readDataSize, true);
      data.write = humanFileSize(node.writeDataSize, true);
      if (node.localVariableNames.length) {
        data.local_variables = "";
        _.each(node.localVariableNames, function(variable) {
          data.local_variables += variable.name + ' (' + variable.type + '), ';
        });
      } else {
        data.local_variables = " - ";
      }

      if (node.globalVariableNames.length) {
        data.global_variables = "";
        _.each(node.globalVariableNames, function(variable) {
          data.global_variables += variable.name + ' (' + variable.type + '), ';
        });
      } else {
        data.global_variables = " - ";
      }

      data.local_variables = data.local_variables.replace(/,(\s+)?$/, '');
      data.global_variables = data.global_variables.replace(/,(\s+)?$/, '');
    }
    if (_.has(node, 'funcArguments')) {
      data.arguments = "";
      _.each(node.funcArguments, function(variable) {
        data.arguments += variable.name + ' (' + variable.type + '), ';
      });
    }


    // update node info table
    $("#node-info-available-icon").css('color', '	#00FF00');
    var template = Handlebars.compile(document.getElementById('cuInfoTableTemplate').innerHTML);
    var cuDataTable = template({
      cuData: data
    });
    $("#node-info-container").html(cuDataTable);
  });

  // Double click events
  graphContainer.delegate('g.node', 'dblclick', function(event) {
    event.stopImmediatePropagation();
    var node = nodeData[this.id];
    var cuNodes, loopNodes, functionNodes;

    if (!node.type && (node.RAWDepsOn.length || node.WARDepsOn.length || node.WAWDepsOn.length)) {
      graphController.resetViewAndChange(function() {
        graphController.toggleDependencyEdges(node);
        graphController.redraw();
        graphController.panToNode(node);
      });
    } else if (node.childrenNodes.length) {
      graphController.resetViewAndChange(function() {
        graphController.expandNode(node);
        graphController.redraw();
        graphController.panToNode(node);
      });
    }
  });

  graphContainer.delegate('g.cluster', 'click', function() {
    //d3.event.stopPropagation();
    editorController.unhighlight();
    editorController.highlightNodeInCode(nodeData[this.id]);
  });




  // tooltip events
  var tooltip = d3.select('#tooltip-container');
  var node, file;
  graphContainer.delegate('g.cluster', 'mouseover', function() {
    node = nodeData[this.id];
    file = fileMaps[node.id.split(':')[0]].path.split('/').slice(-1)[0];
    if (node.type == 1) {
      $('#tooltip-container').html('&#8618; ' + node.name + '<br>' + file);
    } else if (node.type == 2) {
      $('#tooltip-container').html('&#8635; (' + node.start.split(':')[1] + '-' + node.end.split(':')[1] + ')<br>' + file);
    } else {
      return;
    }
    return tooltip.style("visibility", "visible");
  });
  graphContainer.delegate('g.cluster', 'mousemove', function(event) {
    return tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 20) + "px");
  });
  graphContainer.delegate('g.cluster', 'mouseout', function() {
    return tooltip.style("visibility", "hidden");
  });



  // Graph right-click behavior
  function fetchNodeData($nodeElem) {
    var nodeId = $nodeElem[0].id;
    return nodeData[nodeId];
  };

  var menu1 = new BootstrapMenu('.node.cu-node', {
    fetchElementData: fetchNodeData,
    actions: [{
      name: function(node) {
        var hasDependencies = node.type == 0 && (node.RAWDepsOn.length > 0 || node.WARDepsOn.length > 0 || node.WAWDepsOn.length > 0);
        if (hasDependencies) {
          return 'Toggle Dependencies';
        } else {
          return '<i>Show Dependencies</i>';
        }
      },
      iconClass: 'glyphicon glyphicon-retweet',
      onClick: function(node) {
        graphController.resetViewAndChange(function() {
          graphController.toggleDependencyEdges(node);
          graphController.redraw();
        });
      },
      classNames: function(node) {
        var hasDependencies = node.type == 0 && (node.RAWDepsOn.length > 0 || node.WARDepsOn.length > 0 || node.WAWDepsOn.length > 0);
        return {
          'action-success': hasDependencies
        };
      },
      isEnabled: function(node) {
        var hasDependencies = node.type == 0 && (node.RAWDepsOn.length > 0 || node.WARDepsOn.length > 0 || node.WAWDepsOn.length > 0);
        return hasDependencies;
      }
    }, {
      name: 'Node-Info',
      iconClass: 'glyphicon glyphicon-info-sign',
      onClick: function(node) {
        ipc.send('showCuInfo', node);
      }
    }]
  });

  var clusterNodeMenu = {
    fetchElementData: fetchNodeData,
    actions: [{
      name: function(node) {
        if (_.has(node, 'childrenNodes') && node.childrenNodes.length) {
          return 'Expand';
        } else {
          return '<i>Expand</i>';
        }
      },
      iconClass: 'glyphicon glyphicon-expand',
      onClick: function(node) {
        graphController.resetViewAndChange(function() {
          graphController.expandNode(node);
          graphController.redraw();
          graphController.panToNode(node);
        });
      },
      classNames: function(node) {
        return {
          'action-success': (_.has(node, 'childrenNodes') && node.childrenNodes.length > 0)
        };
      },
      isEnabled: function(node) {
        return (_.has(node, 'childrenNodes') && node.childrenNodes.length > 0);
      }
    }, {
      name: function(node) {
        if (_.has(node, 'childrenNodes') && node.childrenNodes.length) {
          return 'Expand All  <span class="badge">' + node.descendantNodeCount + '</span>';
        } else {
          return '<i>Expand All</i>';
        }
      },
      iconClass: 'glyphicon glyphicon-expand',
      onClick: function(node) {
        graphController.resetViewAndChange(function() {
          graphController.expandAll(node);
          graphController.redraw();
        });
      },
      classNames: function(node) {
        return {
          'action-success': (_.has(node, 'childrenNodes') && node.childrenNodes.length > 0)
        };
      },
      isEnabled: function(node) {
        return (_.has(node, 'childrenNodes') && node.childrenNodes.length > 0);
      }
    }, {
      name: 'Node-Info',
      iconClass: 'glyphicon glyphicon-info-sign',
      onClick: function(node) {
        ipc.send('showCuInfo', node);
      }
    }]
  };

  var menu2 = new BootstrapMenu('.loop-node', clusterNodeMenu);
  var menu3 = new BootstrapMenu('.function-node', clusterNodeMenu);

  var menu4 = new BootstrapMenu('.cluster', {
    fetchElementData: fetchNodeData,
    actions: [{
      name: 'Collapse',
      iconClass: 'glyphicon glyphicon-collapse-up',
      onClick: function(node) {
        graphController.resetViewAndChange(function() {
          graphController.collapseNode(node);
          graphController.redraw();
          graphController.panToNode(node);
        });
      }
    }, {
      name: 'Toggle Dependencies',
      iconClass: 'glyphicon glyphicon-retweet',
      onClick: function(node) {
        graphController.resetViewAndChange(function() {
          graphController.toggleDependencyEdges(node);
          graphController.redraw();
        });
      },
      classNames: function(node) {
        var hasDependencies = node.type == 0 && (node.RAWDepsOn.length > 0 || node.WARDepsOn.length > 0 || node.WAWDepsOn.length > 0);
        return {
          'action-success': hasDependencies
        };
      },
      isEnabled: function(node) {
        var childNode;
        for (var i = 0; i < node.childrenNodes.length; i++) {
          childNode = node.childrenNodes[i];
          if (childNode.type == 0 && childNode.RAWDepsOn.length > 0 || childNode.WARDepsOn.length > 0 || childNode.WAWDepsOn.length > 0) {
            return true;
          }
        }
        return false;
      }
    }, {
      name: 'Node-Info',
      iconClass: 'glyphicon glyphicon-info-sign',
      onClick: function(node) {
        ipc.send('showCuInfo', node);
      }
    }]
  });

  var codeMenu = new BootstrapMenu('#code-container #ace-editor', {
    //menuEvent: 'click',
    fetchElementData: function() {
      var node = fileNodeIntervalTrees[editorController.getCurrentFileID()]
        .findOne([editorController.getCursorRow() + 1, editorController.getCursorRow() + 1]);
      return node;
    },
    actions: [{
      name: 'Show CU',
      isEnabled: function(node) {
        return (node != null);
      },
      onClick: function(node) {
        graphController.resetViewAndChange(function() {
          graphController.expandTo(node);
          graphController.redraw();
          graphController.panToNode(node);
        });
        $('#' + node.id.replace(':', '\\:')).trigger('click');
      }
    }]
  });
}


function humanFileSize(bytes, si) {
  var thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }
  var units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  var u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + ' ' + units[u];
}

function unhighlightNodes() {
  editorController.unhighlight();
  graphController.unhighlightNodes();
  $("#node-info-container").html('');
  $("#node-info-available-icon").css('color', '	#FFFFFF');
}
