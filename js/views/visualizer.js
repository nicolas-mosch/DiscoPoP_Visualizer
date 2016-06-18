const ipc = require("electron").ipcRenderer;
var _ = require('lodash/core');
var d3 = require('d3');
var $ = require('jquery');
global.jQuery = require('jquery');
window.$ = require('jquery');
require('bootstrap');
var BootstrapMenu = require('bootstrap-menu');
var sizeof = require('sizeof');
var Handlebars = require('handlebars');
var GraphController = require('../js/controllers/graph');
var EditorController = require('../js/controllers/editor');
var dataInitializer = require('../js/general/data-initializer');
var generalFunctions = require('../js/general/generalFunctions');
var dotGenerator = require('../js/general/dotGenerator');
var Viz = require('../node_modules/viz.js/viz.js');
var configuration = require('../js/general/configuration');

var nodeData;
var highlightedNode;
var editorController;
var legendController;

ipc.on('alert', function(event, message) {
  alert(message);
});

ipc.on('clearGraph', function(event, message) {
  clearGraph();
});

ipc.on('load-data', function(event, data) {
  nodeData = data;
  console.log(nodeData);
});

ipc.on('update-graph', function(event, svg) {
  $("#flow-graph-container").html(svg);
  var svg = d3.select("#flow-graph-container svg");
  var inner = d3.select("#graph0");

  var zoom = d3.behavior.zoom().on("zoom", function() {
    inner.attr(
      "transform",
      "translate(" + d3.event.translate + ")" + "scale(" + d3.event.scale + ")"
    );
  });
  svg.call(zoom);
  // Remove native doubleclick zoom
  svg.on("dblclick.zoom", null);

  colorGraph();
});


function colorGraph() {
  var inner = d3.select("#graph0");

  inner.selectAll('g.cu-node:not(.selected-node) polygon').style("fill", configuration.readSetting('cuColorFill'));
    $(".cu-node-label").css("color", configuration.readSetting('cuColorLabel'));

    inner.selectAll('g.function-node:not(.selected-node) polygon').style("fill", configuration.readSetting('functionColorFill'));
    $(".function-node-label").css("color", configuration.readSetting('functionColorLabel'));

    inner.selectAll('g.loop-node:not(.selected-node) ellipse').style("fill", configuration.readSetting('loopColorFill'));
    inner.selectAll('g.loop-node:not(.selected-node) polygon').style("fill", configuration.readSetting('loopColorFill'));
    $(".loop-node-label").css("color", configuration.readSetting('loopColorLabel'));

    inner.selectAll('g.library-function-node:not(.selected-node) polygon').style("fill", configuration.readSetting('libraryFunctionColorFill'));
    $(".library-function-node-label").css("color", configuration.readSetting('libraryFunctionColorLabel'));

    inner.selectAll('g.default-node:not(.selected-node) polygon').style("fill", configuration.readSetting('defaultColorFill'));
    $(".default-node-label").css("color", configuration.readSetting('defaultColorLabel'));

    inner.selectAll('g.selected-node polygon').style("fill", configuration.readSetting('selectedNodeColorFill'));
    $(".selected-node-label").css("color", configuration.readSetting('selectedNodeColorLabel'));

    //  Edges
    inner.selectAll('g.flow-edge path')
      .style("stroke", configuration.readSetting('flowEdgeFill'))
      .style("stroke-width", configuration.readSetting('flowEdgeWidth'));
    inner.selectAll('g.dependency-edge path')
      .style("stroke", configuration.readSetting('dependencyEdgeFill'))
      .style("stroke-width", configuration.readSetting('dependencyEdgeWidth'));
    inner.selectAll('g.function-call-edge path')
      .style("stroke", configuration.readSetting('functionCallEdgeFill'))
      .style("stroke-width", configuration.readSetting('functionCallEdgeWidth'));


}



// initialize the event-listeners
ipc.on('init-listeners', function(event) {
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
    ipc.send('resetGraph');
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

  /**
   *  Graph click behavior
   */
  var graphContainer = $("#graph-container");

  // Node selection
  graphContainer.delegate('g.node, g.cluster', 'click', function(e) {
    e.stopImmediatePropagation();
    var node = nodeData[this.id];
    if ($(this).hasClass('selected-node')) {
      highlightedNodeId = null;
      return;
    }
    editorController.unhighlight();
    editorController.highlightNodeInCode(node);
    highlightedNodeId = node.id;

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

    if (node.children.length) {
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
      $('#tooltip-container').html('&#8618; <label style="font-weight: bold;>"' + node.name + '</label><br>' + file);
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

  function toggleGraphDependencies(node) {
    graphController.resetViewAndChange(function() {
      graphController.toggleDependencyEdges(node);
      graphController.redraw();
    });
  }

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
      onClick: toggleGraphDependencies,
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
    }, {
      name: 'Toggle Dependencies',
      iconClass: 'glyphicon glyphicon-retweet',
      onClick: toggleGraphDependencies
    }]
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
          ipc.send('expandTo', node.id);
          $('g.node#' + node.id).trigger('click');
        });
      }
    }]
  });
});

function unhighlightNode(){

  highlightedNode = null;
}

function highlightNode(){

}
