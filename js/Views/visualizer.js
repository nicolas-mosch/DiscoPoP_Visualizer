const ipc = require("electron").ipcRenderer;
var _ = require('lodash/core');
var d3 = require('d3');
var GraphController = require('../js/Controllers/graph.js');
var EditorController = require('../js/Controllers/editor.js');
var $ = require('jquery');
global.jQuery = require('jquery');
window.$ = require('jquery');
require('bootstrap');
var dataInitializer = require('../js/Controllers/data-initializer.js');
var sizeof = require('sizeof');
var BootstrapMenu = require('bootstrap-menu');
var Handlebars = require('handlebars');
var generalFunctions = require('../js/generalFunctions.js');


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
  graphController.resetViewAndChange(function() {
    graphController.redraw();
  });
});

ipc.on('init', function(event, data) {
  var canvas = d3.select("#flow-graph-container svg");
  canvas.selectAll("*").remove();
  fileNodeIntervalTrees = dataInitializer.prepareData(data);

  nodeData = data.nodeData;
  fileMaps = data.fileMapping;

  graphController = new GraphController(canvas, data.rootNodes, true);

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

// initialize the event-listeners
function initEventListeners() {

  /**
   * Misc click behavior
   */
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
  $("#reset-graph-button").on('click', function() {
    graphController.resetGraph();
  });

  // Legend
  $("#show-legend-button").on('click', function() {
    $("#legend-table").slideToggle("medium", function() {
      var legendCanvas = d3.select("#legend-container svg");
      legendCanvas.selectAll("*").remove();
      legendController = new GraphController(legendCanvas, [], false);
      legendController.createLegendGraph();
      legendController.redraw();
    });
  });


  // Select a file from file-tree
  $('#file-select-container').on("changed.jstree", function(e, data) {
    if (data.node.type == "file") {
      editorController.displayFile(data.node.id);
      $('#code-container-tab').trigger('click');
      editorController.unhighlight();
    }
  });

  // Unhighlight editor on click
  /*
  var editor = $('#ace-editor');
  editor.on('mousedown', function() {
    editorController.unhighlight();
  });
  */

  /**
   *  Graph click behavior
   */
  var graphContainer = $("#graph-container");

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
      file: fileMaps[node.fileId].fileName,
      lines: node.startLine + ' - ' + node.endLine,
      type: type
    }

    var cuDependencies = [];

    if (!node.type) {
      data.read = generalFunctions.humanFileSize(node.readDataSize, true);
      data.write = generalFunctions.humanFileSize(node.writeDataSize, true);

      // add dependencies to template (true: read, false: write)
      _.each(node.dependencies, function(dependency) {
        cuDependencies.push({
          sourceRead: dependency.isRaW(),
          sinkRead: dependency.isWaR(),
          sourceFile: node.fileId,
          sinkFile: dependency.cuNode.fileId,
          varName: dependency.variableName,
          sourceLine: dependency.sourceLine,
          sinkLine: dependency.sinkLine
        });
      });
    }

    if (_.has(node, 'funcArguments')) {
      data.arguments = "";
      _.each(node.functionArguments, function(variable) {
        data.arguments += variable.name + ' (' + variable.type + '), ';
      });
    }

    if (node.type == 1 || node.type == 3) {
      data.name = node.name;
    }

    if (node.type == 2) {
      data.Loop_Level = node.level;
    }


    // update node info table
    $("#node-info-available-icon").css('color', '	#00FF00');
    var template = Handlebars.compile(document.getElementById('cuInfoTableTemplate').innerHTML);
    var nodeInfoData = {
      nodeData: data,
      dependencies: cuDependencies,
      localVariables: node.localVariables,
      globalVariables: node.globalVariables,
      hasVariables: !node.type
    };
    var nodeDataTable = template(nodeInfoData);

    $("#node-info-container").html(nodeDataTable);
    $('#code-container-tab').trigger('click');
  });

  // Click on variable-links
  graphContainer.delegate('.link-to-line', 'click', function() {
    var line = $(this).data('file-line');
    var fileId = $(this).data('file-id');
    $('#code-container-tab').trigger('click');
    editorController.displayFile(fileId);
    editorController.unhighlight();
    editorController.highlightLine(line);
  });



  // Double click events
  graphContainer.delegate('g.node', 'dblclick', function(event) {
    event.stopImmediatePropagation();
    var node = nodeData[this.id];
    var cuNodes, loopNodes, functionNodes;

    if (!node.type && node.dependencies.length) {
      graphController.resetViewAndChange(function() {
        graphController.toggleDependencyEdges(node);
        graphController.redraw();
        graphController.panToNode(node);
      });
    } else if (node.children.length) {
      graphController.resetViewAndChange(function() {
        graphController.expandNode(node);
        graphController.hideAncestors();
        graphController.redraw();
        graphController.panToNode(node);
      });
    }
  });

  graphContainer.delegate('g.cluster', 'click', function() {
    editorController.unhighlight();
    editorController.highlightNodeInCode(nodeData[this.id]);
  });

  // tooltip (hover) events
  var tooltip = d3.select('#tooltip-container');
  var node, file;
  graphContainer.delegate('g.cluster', 'mouseover', function() {
    node = nodeData[this.id];
    file = fileMaps[node.fileId].fileName;
    if (node.type == 1) {
      $('#tooltip-container').html('&#8618; ' + node.name + '<br>' + file);
    } else if (node.type == 2) {
      $('#tooltip-container').html('&#8635; (' + node.startLine + '-' + node.endLine + ')<br>' + file + '<br>Level: ' + node.level);
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

  /**
   * Graph right-click (contextmenu) behavior
   */

  // Function for fetching the node being right-clicked on
  function fetchNodeData($nodeElem) {
    var nodeId = $nodeElem[0].id;
    return nodeData[nodeId];
  };

  // Contextmenu for CU-nodes
  var cuNodeMenu = new BootstrapMenu('.node.cu-node', {
    fetchElementData: fetchNodeData,
    actions: [{
      name: function(node) {
        if (node.type == 0) {
          var dependencyCount = node.dependencies.length;
          if (dependencyCount > 0) {
            return 'Toggle Dependencies  <span class="badge">' + dependencyCount + '</span>';
          } else {
            return '<i>Toggle Dependencies  <span class="badge">0</span></i>';
          }
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
        var hasDependencies = node.type == 0 && (node.dependencies.length > 0);
        return {
          'action-success': hasDependencies
        };
      },
      isEnabled: function(node) {
        var hasDependencies = node.type == 0 && (node.dependencies.length > 0);
        return hasDependencies;
      }
    }, {
      name: function(node) {
        if (node.children.length) {
          return 'Toggle Called Functions <span class="badge">' + node.children.length + '</span>';
        } else {
          return '<i>Toggle Called Functions</i> <span class="badge">0</span></i>';
        }
      },
      iconClass: 'glyphicon glyphicon-expand',
      onClick: function(node) {
        graphController.resetViewAndChange(function() {
          graphController.toggleFunctionCalls(node);
          graphController.redraw();
          graphController.panToNode(node);
        });
      },
      classNames: function(node) {
        return {
          'action-success': (node.children.length > 0)
        };
      },
      isEnabled: function(node) {
        return (node.children.length > 0);
      }
    }]
  });

  // Contextmenu object for non-expanded function and loop nodes
  var clusterNodeMenu = {
    fetchElementData: fetchNodeData,
    actions: [{
      name: function(node) {
        if (node.children.length) {
          return 'Expand';
        } else {
          return '<i>Expand</i>';
        }
      },
      iconClass: 'glyphicon glyphicon-expand',
      onClick: function(node) {
        graphController.resetViewAndChange(function() {
          graphController.expandNode(node);
          graphController.hideAncestors();
          graphController.redraw();
          graphController.panToNode(node);
        });
      },
      classNames: function(node) {
        return {
          'action-success': (node.children.length > 0)
        };
      },
      isEnabled: function(node) {
        return (node.children.length > 0);
      }
    }, {
      name: function(node) {
        if (node.children.length) {
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
          'action-success': (node.children.length > 0)
        };
      },
      isEnabled: function(node) {
        return (node.children.length > 0);
      }
    }]
  };


  var loopNodeMenu = new BootstrapMenu('.loop-node', clusterNodeMenu);
  var functionNodeMenu = new BootstrapMenu('.function-node', clusterNodeMenu);

  // Contextmenu for expanded function and loop nodes
  var expandedNodeMenu = new BootstrapMenu('.cluster', {
    fetchElementData: fetchNodeData,
    actions: [{
      name: 'Collapse',
      iconClass: 'glyphicon glyphicon-collapse-up',
      onClick: function(node) {
        graphController.resetViewAndChange(function() {
          graphController.collapseNode(node);
          graphController.hideAncestors();
          graphController.redraw();
          graphController.panToNode(node);
        });
      }
    }, ]
  });

  // Contextmenu for the code-viewer
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

// Helper-function: unhighlights nodes and lines in the code-viewer.
function unhighlightNodes() {
  editorController.unhighlight();
  graphController.unhighlightNodes();
  $("#node-info-container").html('');
  $("#node-info-available-icon").css('color', '	#FFFFFF');
}
