var d3 = require('d3');
var dagreD3 = require('./../dagre-d3');
var _ = require('lodash/core');
var configuration = require('./configuration.js');

var Graph = function(svg, rootNode, entryNode, exitNode) {
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

  // Initialize starting graph (rootNode and entry/exit)

  addNode(rootNode);


  addNode(entryNode);
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
    var label, shape, nodeClass, parentNodes;
    switch (node.type) {
      case 0:
        label = 'CU (' + node.id + ')\nlines: ' + node.start + ' - ' + node.end + '\nData Read: ' + node.readDataSize + '\nData Written: ' + node.writeDataSize;
        shape = 'rect';
        nodeClass = 'cu-node';
        break;
      case 1:
        label = ' function (' + node.name + ')\nlines: ' + node.start + ' - ' + node.end + '\n ';
        shape = 'hexagon';
        nodeClass = 'function-node';
        break;
      case 2:
        label = ' loop (' + node.id + ')\nlines: ' + node.start + ' - ' + node.end + '\n ';
        shape = 'ellipse';
        nodeClass = 'loop-node';
        break;
      default:
        label = node.name;
        nodeClass = 'default-node';
        shape = 'circle';
    }
    parentNodes = [];
    _.each(node.parentNodes, function(parentNode) {
      parentNodes.push(parentNode.id);
    });

    var nodeObject = {
      id: node.id,
      parentNodes: parentNodes,
      label: label,
      style: "stroke: #000; stroke-width: 3px;",
      shape: shape,
      rx: 5,
      ry: 5,
      class: nodeClass,
      collapsed: true,
      data: {
        id: node.id
      },
      heatFactor: node.heatFactor
    };

    if (_.has(node, 'heatFactor')) {
      nodeObject.heatFactor = node.heatFactor;
    }

    graph.setNode(node.id, nodeObject);

  }



  /*

    Toggle the dependency edges for the given node

  */
  function toggleDependencyEdges(node) {
    console.log('Dependencies for ', node);
    var graphNode = graph.node(node.id);
    if (graphNode.collapsed) {
      var style = "stroke: #000; stroke-width: 1px;";
      var arrowheadStyle = "fill: #000; stroke: #000;";
      _.each(node.RAWDepsOn, function(dependencyID) {
        graph.setEdge(node.id, dependencyID, {
          style: style,
          label: "RaW",
          arrowheadStyle: arrowheadStyle,
          lineInterpolate: 'basis'
        }, "RaW");
      });
      _.each(node.WARDepsOn, function(dependencyID) {
        graph.setEdge(node.id, dependencyID, {
          style: style,
          label: "WaR",
          arrowheadStyle: arrowheadStyle,
          lineInterpolate: 'basis'
        }, "WaR");
      });
      _.each(node.WAWDepsOn, function(dependencyID) {
        graph.setEdge(node.id, dependencyID, {
          style: style,
          label: "WaW",
          arrowheadStyle: arrowheadStyle,
          lineInterpolate: 'basis'
        }, "WaW");
      });
      graphNode.collapsed = false;
    } else {
      _.each(node.RAWDepsOn, function(dependencyID) {
        graph.removeEdge({
          v: node.id,
          w: dependencyID,
          name: "RaW"
        });
      });
      _.each(node.WARDepsOn, function(dependencyID) {
        graph.removeEdge({
          v: node.id,
          w: dependencyID,
          name: "WaR"
        });
      });
      _.each(node.WAWDepsOn, function(dependencyID) {
        graph.removeEdge({
          v: node.id,
          w: dependencyID,
          name: "WaW"
        });
      });
      graphNode.collapsed = true;
    }
  }

  /*

    Redraw the graph

  */
  function redraw() {
    console.log('redraw');
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
    inner.selectAll('g.cu-node:not(.selected-node)').style("fill", configuration.readSetting('cuColor'));
    inner.selectAll('g.function-node:not(.selected-node)').style("fill", configuration.readSetting('functionColor'));
    inner.selectAll('g.loop-node:not(.selected-node)').style("fill", configuration.readSetting('loopColor'));
    inner.selectAll('g.default-node:not(.selected-node)').style("fill", configuration.readSetting('defaultColor'));
    inner.selectAll('g.label').style("fill", configuration.readSetting('labelColor'));
    inner.selectAll('g.selected-node').style("fill", configuration.readSetting('selectedNodeColor'));
  }

  function expandNode(node) {
    if (_.has(node, 'childrenNodes') && node.childrenNodes.length && node.type > 0) {
      console.log('expanding', node);
      var graphNode, sourceNodeID, sinkNodeID;
      var flowEdgeStyle = {
        style: "stroke: " + configuration.readSetting('cuColor') + "; stroke-width: 3px;",
        arrowheadStyle: "fill: " + configuration.readSetting('cuColor') + "; stroke: " + configuration.readSetting('cuColor')
      };
      // Add children nodes to graph
      _.each(node.childrenNodes, function(childNode) {
        if (childNode.type == 0) {
          _.each(childNode.childrenNodes, function(functionNode) {
            addNode(functionNode);
            graph.setEdge(childNode.id, functionNode.id, {
              style: "stroke: #000; stroke-width: 1px; stroke-dasharray: 5, 5;"
            });
          });
        }
        addNode(childNode);
      });

      graphNode = graph.node(node.id);
      graphNode.clusterLabelPos = 'top';
      graphNode.collapsed = false;
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
          graph.setEdge(childNode.id, sinkNodeID, {
            style: "stroke: " + configuration.readSetting('cuColor') + "; stroke-width: 2px;",
            arrowheadStyle: "fill: " + configuration.readSetting('cuColor') + "; stroke: " + configuration.readSetting('cuColor')
          });
        });

        _.each(childNode.predecessorCUs, function(predecessorCU) {
          var fromNode;
          if (predecessorCU.parentNodes[0] != node.id) {
            sourceNodeID = graph.hasNode(predecessorCU.id) ? predecessorCU.id : predecessorCU.parentNodes[0].id;
            graph.setEdge(sourceNodeID, childNode.id, {
              style: "stroke: " + configuration.readSetting('cuColor') + "; stroke-width: 2px;",
              arrowheadStyle: "fill: " + configuration.readSetting('cuColor') + "; stroke: " + configuration.readSetting('cuColor')
            });
          }
        });
      });

      if (node.type == 1) {
        _.each(node.childrenNodes, function(childNode) {
          if (!graph.inEdges(childNode.id).length) {
            _.each(node.parentNodes, function(parentCU) {
              graph.setEdge(parentCU.id, childNode.id, {
                style: "stroke: #000; stroke-width: 1px; stroke-dasharray: 5, 5;"
              });
            });
          }
        });
      }
    }
  }

  function collapseNode(node) {
    console.log('collapsing', node);
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
    console.log(graph);
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
    if (highlightedNodes.indexOf(node) == -1 && node.type >= 0 && node.type <= 2) {
      var graphNode = graph.node(node.id);
      var svgNode = svg.select('[data-id="' + node.id + '"]');
      var svgShape = svgNode.select('.node-shape');
      graphNode.class = graphNode.class + " selected-node";
      svgShape.style('fill', configuration.readSetting('selectedNodeColor'))
        .style('stroke-width', 5);
      highlightedNodes.push(node);
      return true;
    }
    return false;
  }

  function unhighlightNodes() {
    var graphNode;
    var svgNode;
    var svgRect;
    var fillColor;
    var node;
    while (highlightedNodes.length) {
      node = highlightedNodes.pop();
      if (graph.hasNode(node.id)) {
        graphNode = graph.node(node.id);
        svgNode = svg.select('[data-id="' + node.id + '"]');
        svgShape = svgNode.select('.node-shape');
        switch (node.type) {
          case 0:
            fillColor = configuration.readSetting('cuColor');
            break;
          case 1:
            fillColor = configuration.readSetting('functionColor');
            break;
          case 2:
            fillColor = configuration.readSetting('loopColor');
            break;
          default:
            console.error('Tried to unhighlight a special node', node);
        }
        graphNode.class = graphNode.class.replace(" selected-node", "");
        svgNode.classed('selected-node', false);
        svgShape.style('fill', fillColor)
          .style('stroke-width', 3);
        //svgNode.style('stroke-width', 3);
      }
    }
  }

  function resetView() {
    svg.transition()
      .duration(750)
      .call(zoom.translate([0, 0]).scale(1).event);
  }



  return {
    addNode: addNode,
    collapseNode: collapseNode,
    expandNode: expandNode,
    expandAll: expandAll,
    toggleDependencyEdges: toggleDependencyEdges,
    expandTo: expandTo,
    highlightNode: highlightNode,
    unhighlightNodes: unhighlightNodes,
    panToNode: panToNode,
    resetView: resetView,
    redraw: redraw
  }
};


module.exports = Graph;
