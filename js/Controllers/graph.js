'use strict';

var d3 = require('d3');
var dagreD3 = require('./../dagre-d3');
var _ = require('lodash');
var configuration = require('./configuration.js');
var generalFunctions = require('../generalFunctions.js');

/**
 * Class for keeping track of the node-expansions done by the user.
 */
class ExpansionPath {
  constructor() {
    this._expandedNodesPerLevel = [];
    this._expansionLevelsPerNode = {};
  }

  /**
   * Add a node to the expansion paths
   * @param {Node} node The node to be added
   */
  addNode(node) {
    if (!_.has(this._expansionLevelsPerNode, node.id)) {
      var that = this;
      var parentLevel = -1;
      _.each(node.parents, function(parentNode) {
        if (_.has(that._expansionLevelsPerNode, parentNode.id) && that._expansionLevelsPerNode[parentNode.id] > parentLevel) {
          parentLevel = that._expansionLevelsPerNode[parentNode.id];
        }
      });
      parentLevel++;
      if (this._expandedNodesPerLevel.length <= parentLevel) {
        this._expandedNodesPerLevel[parentLevel] = [];
      }
      this._expandedNodesPerLevel[parentLevel].push(node);
      this._expansionLevelsPerNode[node.id] = parentLevel;
    }
  }

  /**
   * Remove a node from the expansion paths
   * @param  {Node} node The node to be removed
   */
  removeNode(node) {
    if (_.has(this._expansionLevelsPerNode, node.id)) {
      console.log('removing', node.id);
      var level = this._expansionLevelsPerNode[node.id];
      console.log('level', level);
      var levelNodes = this._expandedNodesPerLevel[level];
      console.log('levelNodes', levelNodes);
      var index = levelNodes.indexOf(node);
      console.log('index', index);
      this._expandedNodesPerLevel[level].splice(index, 1);
      console.log('levelNodes', levelNodes);
      if(!levelNodes.length){
        console.log('A')
        for(var i = this._expandedNodesPerLevel.length - 1; i >= level ; i--){
          if(this._expandedNodesPerLevel[i].length){
            break;
          }else{
            this._expandedNodesPerLevel.splice(i);
          }
        }
      }
      delete this._expansionLevelsPerNode[node.id];
      console.log('this._expansionLevelsPerNode', this._expansionLevelsPerNode)
    }
  }

  /**
   * Check whether there are any other expanded nodes at the same level as the given node
   * @param  {Node}  node The node to check for
   * @return {Boolean}      The result
   */
  hasSiblings(node) {
    var level = this._expandedNodesPerLevel[this._expansionLevelsPerNode[node.id]];
    return level.length > 1;
  }

  /**
   * True if the given node is in an expansion-path (has been expanded)
   * @param  {Node}  node The node to check for
   * @return {Boolean}    The result
   */
  hasNode(node) {
    return _.has(this._expansionLevelsPerNode, node.id);
  }

  getLevel(node) {
    return this._expansionLevelsPerNode[node.id];
  }

  get expandedNodesPerLevel() {
    return this._expandedNodesPerLevel;
  }
}


/**
 * Class for controlling the graph in the visualzier
 */
class GraphController {
  /**
   * Constructs a GraphController
   * @param   {Object}          svg         A JQuery reference to the DOM's svg container for the graph
   * @param   {FunctionNode[]}  rootNodes   The root nodes of the graph
   * @param   {Boolean}         canZoom     Set to true to activate zoom and pan functionalities
   */
  constructor(svg, rootNodes, canZoom) {
    this._expansionPath = new ExpansionPath();
    this._highlightedNodes = [];
    this._svg = svg;
    this._rootNodes = rootNodes;

    // Initialization of graph and renderer
    this._graph = new dagreD3.graphlib.Graph({
        compound: true,
        directed: true,
        multigraph: true
      })
      .setGraph({})
      .setDefaultEdgeLabel(function() {
        return {};
      });
    this._inner = svg.append("g");
    var inner = this._inner;

    // Init zoom
    if (canZoom) {
      this._zoom = d3.behavior.zoom().on("zoom", function() {
        inner.attr(
          "transform",
          "translate(" + d3.event.translate + ")" + "scale(" + d3.event.scale + ")"
        );
      });
      svg.call(this._zoom);
      // Remove native doubleclick zoom
      svg.on("dblclick.zoom", null);
    }

    // Create and configure the renderer
    this._render = dagreD3.render();
    this.clearGraph();
    if (typeof rootNodes !== "undefined") {
      for (var i = 0; i < rootNodes.length; i++) {
        this.addNode(rootNodes[i]);
      }
    }
  }


  /**
   * Adds the necessary nodes and edges to create a legend
   */
  createLegendGraph() {
    this._graph.setNode(0, {
      label: "Computational-Unit",
      shape: "rect",
      class: "cu-node",
      rx: 5,
      ry: 5,
      style: "stroke: #000; stroke-width: 3px;"
    });
    this._graph.setNode(1, {
      label: "Function",
      shape: "hexagon",
      class: "function-node",
      rx: 5,
      ry: 5,
      style: "stroke: #000; stroke-width: 3px;"
    });
    this._graph.setNode(2, {
      label: "Loop",
      shape: "ellipse",
      class: "loop-node",
      rx: 5,
      ry: 5,
      style: "stroke: #000; stroke-width: 3px;"
    });
    this._graph.setNode(3, {
      label: "Library Function",
      shape: "diamond",
      class: "library-function-node",
      rx: 5,
      ry: 5,
      style: "stroke: #000; stroke-width: 3px;"
    });

    this._graph.setEdge(0, 0, {
      labelClass: 'dependency-edge-label',
      labelType: 'html',
      class: 'dependency-edge',
      lineInterpolate: 'basis',
      label: 'Dependency'
    });
    this._graph.setEdge(0, 1, {
      label: 'Function-Call',
      labelType: 'html',
      lineInterpolate: 'basis',
      class: "function-call-edge",
      style: "stroke: #000; stroke-width: 2px; stroke-dasharray: 5, 5;"
    });
    this._graph.setEdge(0, 2, {
      lineInterpolate: 'basis',
      class: 'flow-edge',
      label: 'Flow-Edge'
    });
  }


  /**
   * Adds the given node to the graph
   * @param {Node} node The node to be added
   */
  addNode(node) {
    var label, shape, nodeClass, parentNodes, labelType;
    switch (node.type) {
      case 0:
        label = '<span>Lines: ' + node.startLine + ' - ' + node.endLine + '</span>' + '<br><span>Data Read: ' + generalFunctions.humanFileSize(node.readDataSize, true) + '</span>' + '<br><span>Data Written: ' + generalFunctions.humanFileSize(node.writeDataSize, true) + '</span>' + ((node.children.length) ? '<br><span style="font-size: 20px">&#8618;</span>' : '');
        shape = 'rect';
        nodeClass = 'cu-node';
        break;
      case 1:
        label = '<span>' + node.name + '</span><br><span>Lines: ' + node.startLine + ' - ' + node.endLine + '</span><br>';
        labelType = 'html';
        shape = 'hexagon';
        nodeClass = 'function-node';
        break;
      case 2:
        label = '<span>Loop</span><br><span>Lines: ' + node.startLine + ' - ' + node.endLine + '<span><br>';
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
    _.each(node.parents, function(value) {
      parentNodes.push(value.id);
    });

    if (node.type >= 0 && node.type <= 2) {
      var r = Math.floor(255 * node.heatFactor);
      var b = Math.floor(255 * (1 - node.heatFactor));
      label += '<br><span style="color: rgb(' + r + ', 0, ' + b + ');font-size: 26px; font-family: font-awesome">&#xf06d;</span>';
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
    this._graph.setNode(node.id, nodeObject);
  }

  /**
   * Shows/Hides the function-nodes and function-call-edges of the given node
   * @param  {CuNode} node The node for which to toggle function-calls
   */
  toggleFunctionCalls(node) {
    if (this._graph.node(node.id).collapsed) {
      this.expandNodeAndHideAncestors(node);
    } else {
      this.collapseNodeAndHideAncestors(node);
    }
  }

  /**
   * Toggle the visibility of the dependencies-edges for a given CU node
   * @param  {CuNode} node The CU node for which to toggle the dependencies
   */
  toggleDependencyEdges(node) {
    var graphNode = this._graph.node(node.id);
    var that = this;
    var visibleCuParent;
    if (node.type == 0 && !graphNode.depsOn) {
      // Show dependency nodes
      var style = "stroke: #000; stroke-width: 1px;";
      var arrowheadStyle = "fill: #000; stroke: #000;";
      var i, dependency;
      for (i = 0; i < node.dependencies.length; i++) {
        // Find the closest visible ancestor of the dependcy-cu (if not the CU itself)
        dependency = node.dependencies[i];
        visibleCuParent = dependency.cuNode;
        while (!this._graph.hasNode(visibleCuParent.id)) {
          visibleCuParent = visibleCuParent.parentNodes[0];
        }
        this._graph.setEdge(node.id, visibleCuParent.id, {
          labelClass: 'dependency-edge-label',
          labelType: 'html',
          class: 'dependency-edge',
          lineInterpolate: 'basis',
          label: '<a class="link-to-line" data-file-line="' + dependency.sourceLine + '" data-file-id="' + node.fileId + '">' + (dependency.isRaW() ? '&#xf019;' : '&#xf093;') + '</a>' +
            '<label style="font-weight: bold">&rarr; ' + dependency.variableName + ' &rarr;</label>' +
            '<a class="link-to-line" data-file-line="' + dependency.sourceLine + '" data-file-id="' + dependency.cuNode.fileId + '">' + (dependency.isWaR() ? '&#xf019;' : '&#xf093;') + '</a>'
        }, "DependencyEdge");
      }
      graphNode.depsOn = true;
    } else {
      // Hide dependency nodes
      _.each(this._graph.outEdges(node.id), function(edge) {
        if (_.has(edge, 'name') && edge.name == "DependencyEdge") {
          that._graph.removeEdge(edge);
        }
      });
      graphNode.depsOn = false;
    }
  }




  /**
   * Redraws the graph in the svg
   */
  redraw() {
    var start = new Date().getTime();
    // Set margins, if not present
    if (!this._graph.graph().hasOwnProperty("marginx") &&
      !this._graph.graph().hasOwnProperty("marginy")) {
      this._graph.graph().marginx = 20;
      this._graph.graph().marginy = 20;
    }

    this._graph.graph().transition = function(selection) {
      return selection.transition().duration(300);
    };

    // Render the graph into svg g
    this._inner.call(this._render, this._graph);

    // --- Set colors from settings ---
    //  Nodes
    this._inner.selectAll('g.cu-node:not(.selected-node)').style("fill", configuration.readSetting('cuColorFill'));
    this._inner.selectAll('g.cu-node:not(.selected-node) g.label').style("fill", configuration.readSetting('cuColorLabel'));

    this._inner.selectAll('g.function-node:not(.selected-node)').style("fill", configuration.readSetting('functionColorFill'));
    this._inner.selectAll('g.function-node:not(.selected-node) g.label').style("fill", configuration.readSetting('functionColorLabel'));

    this._inner.selectAll('g.loop-node:not(.selected-node)').style("fill", configuration.readSetting('loopColorFill'));
    this._inner.selectAll('g.loop-node:not(.selected-node) g.label').style("fill", configuration.readSetting('loopColorLabel'));

    this._inner.selectAll('g.library-function-node:not(.selected-node)').style("fill", configuration.readSetting('libraryFunctionColorFill'));
    this._inner.selectAll('g.library-function-node:not(.selected-node) g.label').style("fill", configuration.readSetting('libraryFunctionColorLabel'));

    this._inner.selectAll('g.default-node:not(.selected-node)').style("fill", configuration.readSetting('defaultColorFill'));
    this._inner.selectAll('g.default-node:not(.selected-node) g.label').style("fill", configuration.readSetting('defaultColorLabel'));

    this._inner.selectAll('g.selected-node').style("fill", configuration.readSetting('selectedNodeColorFill'));
    this._inner.selectAll('g.selected-node g.label').style("fill", configuration.readSetting('selectedNodeColorLabel'));

    //  Edges
    this._inner.selectAll('g.flow-edge path')
      .style("stroke", configuration.readSetting('flowEdgeFill'))
      .style("stroke-width", configuration.readSetting('flowEdgeWidth'));
    this._inner.selectAll('g.dependency-edge path')
      .style("stroke", configuration.readSetting('dependencyEdgeFill'))
      .style("stroke-width", configuration.readSetting('dependencyEdgeWidth'));
    this._inner.selectAll('g.function-call-edge path')
      .style("stroke", configuration.readSetting('functionCallEdgeFill'))
      .style("stroke-width", configuration.readSetting('functionCallEdgeWidth'));

    var end = new Date().getTime();
    var time = end - start;
  }

  /**
   * Hides the ancestor-nodes at a level higher than the maximum setting
   */
  hideAncestors() {
    var i, j, startLevel, endLevel, levelNodes;

    var visibleParents = configuration.readSetting('visibleParents');

    endLevel = this._expansionPath.expandedNodesPerLevel.length;
    startLevel = endLevel - visibleParents;
    this.clearGraph();
    if (startLevel <= 0) {
      startLevel = 0;
      for (i = 0; i < this._rootNodes.length; i++) {
        this.addNode(this._rootNodes[i]);
      }
    } else {
      levelNodes = this._expansionPath.expandedNodesPerLevel[startLevel];
      for (i = 0; i < levelNodes.length; i++) {
        this.addNode(levelNodes[i]);
      }
    }
    // Expand all of the found paths
    for (i = startLevel; i < endLevel; i++) {
      levelNodes = this._expansionPath.expandedNodesPerLevel[i];
      for (j = 0; j < levelNodes.length; j++) {
        this.expandNode(levelNodes[j]);
      }
    }
  }

  /**
   * Expand a single node of the graph
   * @param  {Node} node  The node to be expanded
   */
  expandNode(node) {
    console.log('expandNode', node);
    if (node.type >= 0 && node.type <= 2 && node.children.length) {
      var graphNode, sourceNodeID, sinkNodeID;
      var that = this;

      // Add to expandedNodePaths
      this._expansionPath.addNode(node);
      this._graph.node(node.id).collapsed = false;

      if (node.type == 0) {
        // Add CU's function-call-edges and the function-nodes to graph
        _.each(node.functionCalls, function(functionCall) {
          if (!that._graph.hasNode(functionCall.functionNode.id)) {
            that.addNode(functionCall.functionNode);
          }
          graphNode = that._graph.node(functionCall.functionNode.id);
          that._graph.setEdge(node.id, graphNode.collapsed ? functionCall.functionNode.id : graphNode.firstChild, {
            label: '<a class="link-to-line" data-file-line="' + functionCall.lineNumber + '" data-file-id="' + node.fileId + '" style="font-size: 20px">&#8618;</a>',
            labelType: 'html',
            lineInterpolate: 'basis',
            class: "function-call-edge",
            style: "stroke: #000; stroke-width: 2px; stroke-dasharray: 5, 5;"
          });
        });
      } else {
        // Add children nodes to graph
        _.each(node.children, function(childNode) {
          if (!that._graph.hasNode(childNode.id)) {
            that.addNode(childNode);
          }
        });
        graphNode = this._graph.node(node.id);
        graphNode.clusterLabelPos = 'bottom';
        graphNode.depsOn = false;

        if (node.type == 1) {
          // If expanding a function, change the incoming/outgoing edges to the first/last child-CU
          _.each(node.children, function(childNode) {
            if (!that._graph.inEdges(childNode.id).length) {
              _.each(that._graph.inEdges(node.id), function(edge) {
                that._graph.setEdge(edge.v, childNode.id, that._graph.edge(edge));
              });
              // Add entry/exit tags if it is a root-node
              if (childNode.type == 0 && !childNode.predecessors.length) {
                that._graph.node(node.id).firstChild = childNode.id;
                if (!node.parents.length) {
                  that._graph.setNode('entry-' + node.id, {
                    shape: 'circle',
                    label: 'entry',
                    class: 'default-node',
                    remove: true
                  });
                  that._graph.setEdge('entry-' + node.id, childNode.id);
                }
              }
              if (childNode.type == 0 && !childNode.successors.length) {
                that._graph.node(node.id).lastChild = childNode.id;
                if (!node.parents.length) {
                  that._graph.setNode('exit-' + node.id, {
                    shape: 'circle',
                    label: 'exit',
                    class: 'default-node',
                    remove: true
                  });
                  that._graph.setEdge(childNode.id, 'exit-' + node.id);
                }
              }
            }
          });
        }
        // remove edges from expanded node
        _.each(this._graph.nodeEdges(node.id), function(edge) {
          that._graph.removeEdge(edge);
        });
        // add flow-edges between the children of the expanded node, and from/to nodes outside of the expanded node
        _.each(node.children, function(childNode) {
          that._graph.setParent(childNode.id, node.id);
          // Find the first visible successor's ancestor (non-trivial if outside of the expanded node)
          _.each(childNode.successors, function(successorCU) {
            while (!that._graph.hasNode(successorCU.id) && successorCU.parents.length) {
              successorCU = successorCU.parents[0];
            }
            if (!that._graph.hasNode(successorCU.id)) {
              that.addNode({
                id: successorCU.id,
                name: "",
                type: 4,
                parents: []
              });
            }
            that._graph.setEdge(childNode.id, successorCU.id, {
              lineInterpolate: 'basis',
              class: 'flow-edge'
            });
          });

          _.each(childNode.predecessors, function(predecessorCU) {
            var fromNode;
            if (predecessorCU.parents[0] != node.id) {
              // Find the first visible predecessor's ancestor
              while (!that._graph.hasNode(predecessorCU.id) && predecessorCU.parents.length) {
                predecessorCU = predecessorCU.parents[0];
              }
              if (!that._graph.hasNode(predecessorCU.id)) {
                that.addNode({
                  id: predecessorCU.id,
                  name: "",
                  type: 4,
                  parents: []
                });
              }
              that._graph.setEdge(predecessorCU.id, childNode.id, {
                lineInterpolate: 'basis',
                class: 'flow-edge'
              });
            }
          });
        });
      }
    }
  }

  /**
   * Collapse a single node in the graph
   * @param  {Node} node  The node to be collapsed
   */
  collapseNode(node) {
    if (this._expansionPath.hasNode(node)) {
      var that = this;
      var graphNode = this._graph.node(node.id);
      this._expansionPath.removeNode(node);
      graphNode.collapsed = true;

      _.each(node.children, function(childNode) {
        if (node.type > 0 && node.type <= 2) {
          // Remove the collapsing node's children, and reset its edges
          _.each(that._graph.inEdges(childNode.id), function(edge) {
            graphNode = that._graph.node(edge.v);
            if (graphNode.remove) {
              that._graph.removeNode(edge.v);
            } else if (graphNode.parentNodes.indexOf(node.id) == -1) {
              that._graph.setEdge(edge.v, node.id, that._graph.edge(edge));
            }
          });
          if (childNode.type > 0) {
            // Reset the collapsing-node's flow-edges
            _.each(that._graph.outEdges(childNode.id), function(edge) {
              if (that._graph.node(edge.w).parentNodes.indexOf(node.id) == -1) {
                that._graph.setEdge(node.id, edge.w, that._graph.edge(edge));
              }
            });
          }
          // Recursively collapse any expanded children
          if (!that._graph.node(childNode.id).collapsed) {
            that.collapseNode(childNode);
          }
          that._graph.removeNode(childNode.id);
        } else {
          // For collapsing CU-nodes, only collapase and remove the function-call function-nodes if they are not being pointed at by other CU-nodes
          graphNode = that._graph.node(childNode.id);
          if (!graphNode.collapsed && that._graph.inEdges(graphNode.firstChild).length == 1) {
            that.collapseNode(childNode);
          }
          if (that._graph.inEdges(childNode.id).length == 1) {
            that._graph.removeNode(childNode.id);
          } else {
            that._graph.removeEdge(node.id, childNode.id);
          }
        }
      });
    }
  }

  /**
   * Expand the given node and all of its descendants
   * @param  {Node} node The node to be expanded
   */
  expandAll(node) {
    var start = new Date().getTime();
    var stack = [];
    stack.push(node);
    do {
      node = stack.pop();
      this.expandNode(node);
      _.each(node.children, function(childNode) {
        if (childNode.children.length) {
          stack.push(childNode);
        }
      });
    }
    while (stack.length);
    var end = new Date().getTime();
    var time = end - start;
    console.log('Execution time ExpandAll: ' + time);
  }

  /**
   * Expands the graph's nodes until the given node is visible
   * @param  {Node} node The node to be expanded to
   */
  expandTo(node) {
    var currentNode = node;
    var queue = [];
    // Find nearest visible ancestor of the given node to start expanding from
    while (!this._graph.hasNode(currentNode.id)) {
      queue.push(currentnode.parents[0]);
      currentNode = currentnode.parents[0];
    }
    while (queue.length) {
      this.expandNode(queue.pop());
    }
  }

  /**
   * Pan the graphs view to the given node
   * @param  {Node} node The node to be panned to
   */
  panToNode(node) {
    var graphNode = this._graph.node(node.id);
    var height = parseInt(this._svg.style("height"));
    var width = parseInt(this._svg.style("width"));
    var x = -(graphNode.x - width / 2);
    var y = -(graphNode.y - height / 2);
    this._svg.transition()
      .duration(500)
      .call(this._zoom.translate([x, y]).scale(1).event);
  }

  /**
   * Highlight a node
   * @param   {Node}    node The node to be highlighted
   * @return  {Boolean} true if the node was highlighted, false otherwise
   */
  highlightNode(node) {
    console.log("highlightNode", node);
    if (this._highlightedNodes.indexOf(node) == -1 && node.type >= 0 && node.type <= 2) {
      var graphNode = this._graph.node(node.id);
      var svgNode = this._inner.select('[data-id="' + node.id + '"]');
      var svgShape = svgNode.select('.node-shape');
      var svgLabel = svgNode.select('g.label');
      graphNode.class = graphNode.class + " selected-node";
      svgNode.attr("class", svgNode.attr("class") + " selected-node");
      svgShape.style('fill', configuration.readSetting('selectedNodeColorFill'))
        .style('stroke-width', 5);
      svgLabel.style('fill', configuration.readSetting('selectedNodeColorLabel'))
        .style('stroke-width', 5);
      this._highlightedNodes.push(node);
      return true;
    }
    return false;
  }

  /**
   * Unhighlight all highlighted nodes
   */
  unhighlightNodes() {
    var graphNode;
    var svgNode;
    var svgShape, svgLabel;
    var fillColor, labelColor;
    var node;
    while (this._highlightedNodes.length) {
      node = this._highlightedNodes.pop();
      if (this._graph.hasNode(node.id)) {
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
        graphNode = this._graph.node(node.id);
        svgNode = this._inner.select('[data-id="' + node.id + '"]');
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

  /**
   * Resets the graph to its root-nodes
   */
  resetGraph() {
    this.clearGraph();
    var that = this;
    _.each(this._rootNodes, function(root) {
      that.addNode(root);
    });
    this.redraw();
    this._svg.transition()
      .duration(0)
      .call(this._zoom.translate([0, 0]).scale(1).event);
    this._expansionPath = new ExpansionPath();
  }

  /**
   * Resets the pan and zoom of the graph
   */
  resetView() {
    this._svg.transition()
      .duration(0)
      .call(this._zoom.translate([0, 0]).scale(1).event);
  }

  /**
   * Clears the graph
   */
  clearGraph() {
    this._inner.selectAll("*").remove();
    var that = this;
    _.each(this._graph.nodes(), function(graphNodeID) {
      that._graph.removeNode(graphNodeID);
    });

  }

  /**
   * Resets the graph's zoom and pan before performing the given callback (Fix for problem when redrawing html-labels in Dagre-D3)
   * @param {Callback} callback The function to be called after the zoom and pan of the graph has been reset
   */
  resetViewAndChange(callback) {
    this._svg.transition()
      .duration(0)
      .call(this._zoom.scale(1).event)
      .each("end", callback);
  }
}

module.exports = GraphController;
