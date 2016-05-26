var d3 = require('d3');
var dagreD3 = require('./../dagre-d3');
var _ = require('lodash/core');
var configuration = require('./configuration.js');

var Graph = function(svg, canZoom) {
  clearGraph();
  var highlightedNodes = [];
  // Initialization of graph and renderer
  var render, inner, zoom;
  var graph = new dagreD3.graphlib.Graph({
      compound: true,
      directed: true,
      multigraph: true
    })
    .setGraph({})
    .setDefaultEdgeLabel(function() {
      return {};
    });

  inner = svg.append("g");
  zoom = d3.behavior.zoom().on("zoom", function() {
    inner.attr("transform", "translate(" + d3.event.translate + ")" +
      "scale(" + d3.event.scale + ")");
  });
  svg.call(zoom);
  svg.on("dblclick.zoom", null);
  // Create and configure the renderer
  render = dagreD3.render();

  /*addNode(entryNode);
  addNode(exitNode);
  graph.setEdge('entryNode', rootNode.id, {
    style: "stroke: #000; stroke-width: 1px;",
    arrowheadStyle: "fill: #000; stroke: #000;"
  });
  graph.setEdge(rootNode.id, 'exitNode', {
    style: "stroke: #000; stroke-width: 1px;",
    arrowheadStyle: "fill: #000; stroke: #000;"
  });

  /*

    Add a node to the graph

  */
  function addNode(node) {
    console.log("addNode", node);
    var label, shape, nodeClass, parentNodes;
    var labelType = 'text';
    switch (node.type) {
      case 0:
        label = '<span>Lines: ' + node.start + ' - ' + node.end + '</span><br><span>Data Read: ' + humanFileSize(node.readDataSize, true) + '</span><br><span>Data Written: ' + humanFileSize(node.writeDataSize, true) + '</span><br>';
        shape = 'rect';
        nodeClass = 'cu-node';
        break;
      case 1:
        label = '<span>' + node.name + '</span><br><span>Lines: ' + node.start + ' - ' + node.end + '</span><br>';
        labelType = 'html';
        shape = 'hexagon';
        nodeClass = 'function-node';
        break;
      case 2:
        label = '<span>Loop</span><br><span>Lines: ' + node.start + ' - ' + node.end + '<span><br>';
        shape = 'ellipse';
        nodeClass = 'loop-node';
        break;
      case 3:
        label = node.name;
        shape = 'diamond';
        nodeClass = 'library-function-node';
        break;
      default:
        label = node.name;
        nodeClass = 'default-node';
        shape = 'circle';
    }
    parentNodes = [];
    _.each(node.parentNodes, function(value) {
      parentNodes.push(value.id);
    });

    if (_.has(node, 'heatFactor') && node.type != 3) {
      var r = Math.floor(255 * node.heatFactor);
      var g = Math.floor(255 * (1 - node.heatFactor));
      label += '<br><span style="color: rgb(' + r + ', ' + g + ', 0);font-size: 26px;">&#9832;</span>';
    }

    var nodeObject = {
      id: node.id,
      parentNodes: parentNodes,
      label: label,
      labelType: 'html',
      style: "stroke: #000; stroke-width: 3px;",
      shape: shape,
      rx: 5,
      ry: 5,
      class: nodeClass,
      collapsed: true,
      depsOn: false,
      data: {
        id: node.id
      }
    };
    graph.setNode(node.id, nodeObject);
  }

  function addLegendNode(id, type) {
    var label, shape, nodeClass;
    switch (type) {
      case 0:
        label = 'Computational-Unit';
        shape = 'rect';
        nodeClass = 'cu-node';
        break;
      case 1:
        label = 'Function';
        shape = 'hexagon';
        nodeClass = 'function-node';
        break;
      case 2:
        label = 'Loop';
        shape = 'ellipse';
        nodeClass = 'loop-node';
        break;
      case 3:
        label = 'Library-Function';
        shape = 'diamond';
        nodeClass = 'library-function-node';
        break;
      default:
        label = 'Other';
        nodeClass = 'default-node';
        shape = 'circle';
    }

    graph.setNode(id, {
      label: label,
      shape: shape,
      rx: 5,
      ry: 5,
      class: nodeClass,
      style: "stroke: #000; stroke-width: 3px;"
    });
  }



  /*

    Toggle the dependency edges for the given node

  */
  function toggleDependencyEdges(node) {
    console.log("toggleDependencyEdges", node);
    var graphNode = graph.node(node.id);
    if (node.type == 0 || ((node.type == 1 || node.type == 2) && graphNode.collapsed)) {
      var visibleCuParent;

      if (!graphNode.depsOn) {
        // Show dependency nodes
        var style = "stroke: #000; stroke-width: 1px;";
        var arrowheadStyle = "fill: #000; stroke: #000;";
        var i, dependency;
        for (i = 0; i < node.RAWDepsOn.length; i++) {
          dependency = node.RAWDepsOn[i];
          visibleCuParent = dependency.CU;
          while (!graph.hasNode(visibleCuParent.id)) {
            visibleCuParent = visibleCuParent.parentNodes[0];
          }
          graph.setEdge(node.id, visibleCuParent.id, {
            labelId: node.id + '-RAWDepsOn-' + i,
            labelClass: 'dependency-edge-label',
            class: 'dependency-edge',
            lineInterpolate: 'basis',
            label: 'RaW: ' + dependency.varName
          }, "DependencyEdge");
        }
        for (i = 0; i < node.WARDepsOn.length; i++) {
          dependency = node.WARDepsOn[i];
          visibleCuParent = dependency.CU;
          while (!graph.hasNode(visibleCuParent.id)) {
            visibleCuParent = visibleCuParent.parentNodes[0];
          }
          graph.setEdge(node.id, visibleCuParent.id, {
            labelId: node.id + '-WARDepsOn-' + i,
            labelClass: 'dependency-edge-label',
            class: 'dependency-edge',
            lineInterpolate: 'basis',
            label: 'WaR:' + dependency.varName
          }, "DependencyEdge");
        }
        for (i = 0; i < node.WAWDepsOn.length; i++) {
          dependency = node.WAWDepsOn[i];
          visibleCuParent = dependency.CU;
          while (!graph.hasNode(visibleCuParent.id)) {
            visibleCuParent = visibleCuParent.parentNodes[0];
          }
          graph.setEdge(node.id, visibleCuParent.id, {
            labelId: node.id + '-WAWDepsOn-' + i,
            labelClass: 'dependency-edge-label',
            class: 'dependency-edge',
            lineInterpolate: 'basis',
            label: 'WaW: ' + dependency.varName
          }, "DependencyEdge");
        }
        graphNode.depsOn = true;
      } else {
        // Hide dependency nodes
        _.each(graph.outEdges(node.id), function(edge) {
          if (_.has(edge, 'name') && edge.name == "DependencyEdge") {
            graph.removeEdge(edge);
          }
        });
        graphNode.depsOn = false;
      }
    } else if ((node.type == 1 || node.type == 2) && !graphNode.collapsed) {
      _.each(node.childrenNodes, function(childNode) {
        toggleDependencyEdges(childNode);
      });
    }
  }


  /*

    Redraw the graph

  */
  function redraw() {
    console.log("redraw");

    // Set margins, if not present
    if (!graph.graph().hasOwnProperty("marginx") &&
      !graph.graph().hasOwnProperty("marginy")) {
      graph.graph().marginx = 20;
      graph.graph().marginy = 20;
    }

    graph.graph().transition = function(selection) {
      return selection.transition().duration(300);
    };

    // Render the graph into svg g
    inner.call(render, graph);

    // Set colors from settings
    inner.selectAll('g.cu-node:not(.selected-node)').style("fill", configuration.readSetting('cuColorFill'));
    inner.selectAll('g.cu-node:not(.selected-node) g.label').style("fill", configuration.readSetting('cuColorLabel'));

    inner.selectAll('g.function-node:not(.selected-node)').style("fill", configuration.readSetting('functionColorFill'));
    inner.selectAll('g.function-node:not(.selected-node) g.label').style("fill", configuration.readSetting('functionColorLabel'));

    inner.selectAll('g.loop-node:not(.selected-node)').style("fill", configuration.readSetting('loopColorFill'));
    inner.selectAll('g.loop-node:not(.selected-node) g.label').style("fill", configuration.readSetting('loopColorLabel'));

    inner.selectAll('g.library-function-node:not(.selected-node)').style("fill", configuration.readSetting('libraryFunctionColorFill'));
    inner.selectAll('g.library-function-node:not(.selected-node) g.label').style("fill", configuration.readSetting('libraryFunctionColorLabel'));

    inner.selectAll('g.default-node:not(.selected-node)').style("fill", configuration.readSetting('defaultColorFill'));
    inner.selectAll('g.default-node:not(.selected-node) g.label').style("fill", configuration.readSetting('defaultColorLabel'));

    inner.selectAll('g.selected-node').style("fill", configuration.readSetting('selectedNodeColorFill'));
    inner.selectAll('g.selected-node g.label').style("fill", configuration.readSetting('selectedNodeColorLabel'));

    // Edges

    console.log('flowEdgeFill', configuration.readSetting('flowEdgeFill'));
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

  function expandNode(node) {
    console.log("expandNode", node);
    if (_.has(node, 'childrenNodes') && node.childrenNodes.length && node.type > 0) {
      var graphNode, sourceNodeID, sinkNodeID;

      // Add children nodes to graph
      _.each(node.childrenNodes, function(childNode) {
        if (childNode.type == 0) {
          _.each(childNode.functionCall, function(functionCall){
              addNode(functionCall.functionNode);
              graph.setEdge(childNode.id, functionCall.funcId, {
                label: '<span style="font-size: 20px">&#8618;</span>',
                labelType: 'html',
                labelId: functionCall.atLine,
                labelClass: 'function-call-edge-label',
                lineInterpolate: 'basis',
                class: "function-call-edge",
                style: "stroke: #000; stroke-width: 2px; stroke-dasharray: 5, 5;"
              });
          });
        }
        addNode(childNode);
      });

      graphNode = graph.node(node.id);
      graphNode.clusterLabelPos = 'bottom';
      graphNode.collapsed = false;
      graphNode.depsOn = false;
      graph.setNode(node.id, graphNode);

      // remove edges from expanded node
      _.each(graph.nodeEdges(node.id), function(edge) {
        graph.removeEdge(edge);
      });

      // add edges to children of expanded nodes and set their parentNode
      _.each(node.childrenNodes, function(childNode) {
        graph.setParent(childNode.id, node.id);
        _.each(childNode.successorCUs, function(successorCU) {
          sinkNodeID = graph.hasNode(successorCU.id) ? successorCU.id : successorCU.parentNodes[0].id;
          if(!graph.hasNode(sinkNodeID)){
            console.warn(sourceNodeID + ' has not been added to the graph (successor)');
          }
          graph.setEdge(childNode.id, sinkNodeID, {
            lineInterpolate: 'basis',
            class: 'flow-edge'
          });
        });

        _.each(childNode.predecessorCUs, function(predecessorCU) {
          var fromNode;
          if (predecessorCU.parentNodes[0] != node.id) {
            sourceNodeID = graph.hasNode(predecessorCU.id) ? predecessorCU.id : predecessorCU.parentNodes[0].id;
            // Correctness check
            if(!graph.hasNode(sourceNodeID)){
              console.warn(sourceNodeID + ' has not been added to the graph (predecessor)');
            }
            graph.setEdge(sourceNodeID, childNode.id, {
              lineInterpolate: 'basis',
              class: 'flow-edge'
            });
          }
        });
      });

      if (node.type == 1) {
        _.each(node.childrenNodes, function(childNode) {
          if (!graph.inEdges(childNode.id).length) {
            _.each(node.parentNodes, function(parentCU) {
              _.each(parentCU.functionCall, function(functionCall){
                if(functionCall.funcId == node.id){
                  graph.setEdge(parentCU.id, childNode.id, {
                    label: '<span style="font-size: 20px">&#8618;</span>',
                    labelType: 'html',
                    labelId: functionCall.atLine,
                    labelClass: 'function-call-edge-label',
                    lineInterpolate: 'basis',
                    class: "function-call-edge",
                    style: "stroke: #000; stroke-width: 2px; stroke-dasharray: 5, 5;"
                  });
                }
              });
            });
          }
        });
      }
    }
  }

  function collapseNode(node) {
    console.log("collapseNode", node);
    graph.node(node.id).collapsed = true;
    _.each(node.childrenNodes, function(childNode) {
      _.each(graph.inEdges(childNode.id), function(edge) {
        if (graph.node(edge.v).parentNodes.indexOf(node.id) == -1) {
          graph.setEdge(edge.v, node.id, graph.edge(edge));
        }
      });
      _.each(graph.outEdges(childNode.id), function(edge) {
        if (graph.node(edge.w).parentNodes.indexOf(node.id) == -1) {
          graph.setEdge(node.id, edge.w, graph.edge(edge));
        }
      });
      if (childNode.type == 0 && childNode.childrenNodes.length) {
        _.each(childNode.childrenNodes, function(functionNode) {
          if (!graph.node(functionNode.id).collapsed) {
            collapseNode(functionNode);
          }
          graph.removeNode(functionNode.id);
        });
      } else if (!graph.node(childNode.id).collapsed) {
        collapseNode(childNode);
      }
      graph.removeNode(childNode.id);
    });
  }

  function expandAll(node) {
    console.log("expandAll", node);
    var stack = [];
    stack.push(node);
    do {
      node = stack.pop();
      expandNode(node);
      _.each(node.childrenNodes, function(childNode) {
        if (_.has(childNode, 'childrenNodes') && childNode.childrenNodes.length) {
          stack.push(childNode);
        }
      });
    }
    while (stack.length);
  }

  function expandTo(node) {
    var currentNode = node;
    var queue = [];
    while (!graph.hasNode(currentNode.id)) {
      queue.push(currentNode.parentNodes[0]);
      currentNode = currentNode.parentNodes[0];
    }
    while (queue.length) {
      expandNode(queue.pop());
    }
  }

  function panToNode(node) {
    console.log("panToNode", node);
    var graphNode = graph.node(node.id);
    var height = parseInt(svg.style("height"));
    var width = parseInt(svg.style("width"));
    var x = -(graphNode.x - width / 2);
    var y = -(graphNode.y - height / 2);
    svg.transition()
      .duration(500)
      .call(zoom.translate([x, y]).scale(1).event);
  }

  function highlightNode(node) {
    console.log("highlightNode", node);
    if (highlightedNodes.indexOf(node) == -1 && node.type >= 0 && node.type <= 2) {
      var graphNode = graph.node(node.id);
      var svgNode = svg.select('[data-id="' + node.id + '"]');
      var svgShape = svgNode.select('.node-shape');
      var svgLabel = svgNode.select('g.label');
      graphNode.class = graphNode.class + " selected-node";
      svgNode.attr("class", svgNode.attr("class") + " selected-node");
      svgShape.style('fill', configuration.readSetting('selectedNodeColorFill'))
        .style('stroke-width', 5);
      svgLabel.style('fill', configuration.readSetting('selectedNodeColorLabel'))
        .style('stroke-width', 5);
      highlightedNodes.push(node);

      return true;

    }
    return false;
  }

  function unhighlightNodes() {
    console.log("unhighlightNodes");
    var graphNode;
    var svgNode;
    var svgShape, svgLabel;
    var fillColor, labelColor;
    var node;
    while (highlightedNodes.length) {
      node = highlightedNodes.pop();
      if (graph.hasNode(node.id)) {
        switch (node.type) {
          case 0:
            fillColor = configuration.readSetting('cuColorFill');
            labelColor = configuration.readSetting('cuColorLabel');
            break;
          case 1:
            fillColor = configuration.readSetting('functionColorFill');
            labelColor = configuration.readSetting('functionColorLabel');
            break;
          case 2:
            fillColor = configuration.readSetting('loopColorFill');
            labelColor = configuration.readSetting('loopColorLabel');
            break;
          case 3:
            fillColor = configuration.readSetting('LibraryFunctionColorFill');
            labelColor = configuration.readSetting('LibraryFunctionColorLabel');
            break;
          default:
            console.error('Tried to unhighlight a special node', node);
        }
        graphNode = graph.node(node.id);
        svgNode = svg.select('[data-id="' + node.id + '"]');
        svgShape = svgNode.select('.node-shape');
        svgLabel = svgNode.select('g.label');

        graphNode.class = graphNode.class.replace(" selected-node", "");
        svgNode.classed('selected-node', false);
        svgShape.style('fill', fillColor)
          .style('stroke-width', 3);
        svgLabel.style('fill', labelColor)
          .style('stroke-width', 3);
      }
    }
  }

  function resetView() {
    console.log("resetView");
    svg.transition()
      .duration(0)
      .call(zoom.translate([0, 0]).scale(1).event);
  }

  function clearGraph() {
    svg.selectAll('*').remove();
  }

  // Necessary for correct display of html labels
  function resetViewAndChange(callback) {
    console.log("resetViewAndChange");
    svg.transition()
      .duration(0)
      .call(zoom.scale(1).event)
      .each("end", callback);
    console.log('DONE');
  }



  return {
    addNode: addNode,
    addLegendNode: addLegendNode,
    collapseNode: collapseNode,
    expandNode: expandNode,
    expandAll: expandAll,
    toggleDependencyEdges: toggleDependencyEdges,
    expandTo: expandTo,
    highlightNode: highlightNode,
    unhighlightNodes: unhighlightNodes,
    panToNode: panToNode,
    resetView: resetView,
    redraw: redraw,
    resetViewAndChange: resetViewAndChange
  }
};


module.exports = Graph;


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
