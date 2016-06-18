var _ = require('lodash');
var graphlib = require('graphlib');
var configuration = require('../general/configuration');
var generalFunctions = require('../general/generalFunctions');
var Viz = require('../../node_modules/viz.js/viz.js');
const ipc = require("electron").ipcMain;


module.exports = {
  controller: function controller(nodes, rootNodes) {
    function findFirstVisibleAncestor(node) {
      if (!node.parents.length)
        return false;
      var i, res;
      for (i = 0; i < node.parents.length; i++) {
        if (node.parents[i].expanded) {
          return node;
        }
      }
      for (i = 0; i < node.parents.length; i++) {
        res = findFirstVisibleAncestor(node.parents[i]);
        if (res) {
          return res;
        }
      }
      return false;
    }

    /**
     * Shows/Hides the function-nodes and function-call-edges of the given node
     * @param  {CuNode} node The node for which to toggle function-calls
     */
    ipc.on('toggleFunctionCalls', function(event, nodeId) {
      if (nodes[nodeId].collapsed) {
        this.expandNode(nodes[nodeId]);
      } else {
        this.collapseNode(nodes[nodeId]);
      }
      event.sender.send('update-graph', generateSvgGraph());
    });

    /**
     * Toggle the visibility of the dependencies-edges for a given CU node
     * @param  {CuNode} node The CU node for which to toggle the dependencies
     */
    ipc.on('toggleDependencyEdges', function(event, nodeId) {
      var node = nodes[nodeId];
      if (node.type == 0) {
        nodes[nodeId].toggleDependencyVisibility();
        event.sender.send('update-graph', generateSvgGraph());
      }/* else if (node.type < 3) {
        var recursiveCall = this;
        _.each(node.children, function(child) {
          recursiveCall(child);
        });
      }*/
    });

    ipc.on('expandNode', function(event, nodeId) {
      console.log('expandNode', nodeId);
      var node = nodes[nodeId];
      if (node.type >= 0 && node.type < 3) {
        node.expand();
        event.sender.send('update-graph', generateSvgGraph());
      }
    });

    ipc.on('collapseNode', function(event, nodeId) {
      nodes[nodeId].collapse;
      event.sender.send('update-graph', generateSvgGraph());
    });

    ipc.on('expandAll', function(event, nodeId) {
      var node = nodes[nodeId];
      var stack = [];
      var seen = [];
      stack.push(node);
      do {
        node = stack.pop();
        if (seen.indexOf(node.id) == -1) {
          seen.push(node.id);
          node.expand();
          _.each(node.children, function(childNode) {
            if (childNode.children.length) {
              stack.push(childNode);
            }
          });
        }
      }
      while (stack.length);
      event.sender.send('update-graph', generateSvgGraph());
    });

    ipc.on('expandTo', function(event, nodeId) {
      var currentNode = nodes[nodeId];
      var queue = [];
      // Find nearest visible ancestor of the given node to start expanding from
      while (currentNode.parents.length && currentNode.parents[0].collapsed) {
        queue.push(currentNode.parents[0]);
        currentNode = currentNode.parents[0];
      }
      while (queue.length) {
        queue.pop().expand();
      }
      event.sender.send('update-graph', generateSvgGraph());
    });

    /**
     * Resets the graph to its root-nodes
     */
    ipc.on('resetGraph', function(event) {
      _.each(nodes, function(node) {
        node.collapse();
      });
      event.sender.send('update-graph', generateSvgGraph());
    });

    ipc.on('nodeInfo', function(nodeId) {
      var node = nodes[nodeId];
    });

    /**
     * [generateSvgGraph description]
     * @return {[type]} [description]
     */
    function generateSvgGraph() {
      var digraph;
      var checkedNodes = [];
      var functionNodes = [];
      var functionCallEdges = [];
      _.each(rootNodes, function(root) {
        functionNodes.push(root);
      });

      function addSubgraph(node) {
        if (checkedNodes.indexOf(node.id) > -1) {
          return;
        }
        checkedNodes.push(node.id);
        if (node.expanded) {
          digraph += "\nsubgraph cluster" + node.id + " {"
          var addedFlowEdges = [];
          var edge;
          _.each(node.children, function(child) {
            if (child.type == 2) {
              addSubgraph(child);
            } else if (child.type == 0) {
              checkedNodes.push(child.id);
              digraph += '\n' + child.id + ' [id=' + child.id + ', shape=rect;label=' + createLabel(node) + ', style="filled"];';
              var visibleAncestor;
              _.each(child.successors, function(successor) {
                visibleSuccessor = findFirstVisibleAncestor(successor);
                edge = child.id + " -> " + visibleSuccessor.id;
                if (addedFlowEdges.indexOf(edge) == -1) {
                  digraph += "\n" + edge + ";";
                  addedFlowEdges.push(edge);
                }
              });
              _.each(child.predecessors, function(predecessor) {
                visiblePredecessor = findFirstVisibleAncestor(predecessor);
                edge = visiblePredecessor.id + " -> " + child.id;
                if (addedFlowEdges.indexOf(edge) == -1) {
                  digraph += "\n" + edge + ";";
                }
              });
              if (child.expanded) {
                _.each(child.children, function(functionCall) {
                  if (functionCall.expanded) {
                    functionCallEdges.push('\n' + child.id + ' -> ' + functionCall.entry.id + ' [style=dotted];');
                  } else {
                    functionCallEdges.push('\n' + child.id + " -> " + functionCall.id + ' [style=dotted];');
                  }
                  functionNodes.push(functionCall);
                });
              }
            }
          });
          digraph += '\nlabel=' + createLabel(node) + ';';
          digraph += '\nstyle="filled"';
          digraph += '\nid='+node.id;
          digraph += "\n}";
        } else {
          var shape;
          switch (node.type) {
            case 1:
              shape = "hexagon";
              break;
            case 2:
              shape = "ellipse";
              break;
            case 3:
              shape = "diamond";
              break;
          }
          digraph += "\n" + node.id + ' [id=' + node.id + ', shape="' + shape + '", label=' + createLabel(node) + ', style="filled"];';
        }
      }

      digraph = "digraph G {";
      while (functionNodes.length) {
        addSubgraph(functionNodes.pop());
      };
      _.each(functionCallEdges, function(edge) {
        digraph += edge;
      });
      digraph += "\n}";
      var svg;
      try {
        var start = new Date().getTime();
        svg = Viz(digraph, {
          engine: "dot",
          format: "svg"
        });
        var end = new Date().getTime();
        console.log('Execution-Time of Layout: ', end - start);
      } catch (err) {
        console.error(err);
        console.log('\n---------------------------\n' + digraph + '\n---------------------------\n');
      }

      // Hack for adding classes to svg elements (not supported by graphviz)
      var node, nodeClass;
      _.each(checkedNodes, function(nodeId) {
        node = nodes[nodeId];
        switch (node.type) {
          case 0: nodeClass = 'cu-node';
          break;
          case 1: nodeClass = 'function-node';
          break;
          case 2: nodeClass = 'loop-node';
          break;
          case 3: nodeClass = 'function-call-node';
          break;
          default: nodeClass = "default-node";
        }

        svg = svg.replace('<g id="' + nodeId + '" class="node"', '<g id="' + nodeId + '" class="node ' + nodeClass + '"');
        svg = svg.replace('<g id="' + nodeId + '" class="cluster"', '<g id="' + nodeId + '" class="cluster ' + nodeClass + '"');
      });

      return svg;
    }


    function createLabel(node) {
      var label = "<<TABLE BORDER=\"0\">";
      switch (node.type) {
        case 0:
          label += "\n<TR><TD>[" + node.startLine + "-" + node.endLine + "]</TD></TR>";
          label += "\n<TR><TD>Data-Read" + generalFunctions.humanFileSize(node.readDataSize, true) + "</TD></TR>";
          label += "\n<TR><TD>Data-Written" + generalFunctions.humanFileSize(node.writeDataSize, true) + "</TD></TR>";
          label += "\n<TR><TD>Data-Read" + generalFunctions.humanFileSize(node.readDataSize, true) + "</TD></TR>";
          break;
        case 1:
          label += "\n<TR><TD>" + node.name + "</TD></TR>";
          label += "\n<TR><TD>[" + node.startLine + "-" + node.endLine + "]</TD></TR>";
          break;
        case 2:
          label += "\n<TR><TD>Loop</TD></TR>";
          label += "\n<TR><TD>[" + node.startLine + "-" + node.endLine + "]</TD></TR>";
          break;
        default:
          label = '"' + node.name + '"';
      }

      if (node.type >= 0 && node.type <= 2) {
        var r = Math.floor(255 * node.heatFactor);
        var b = Math.floor(255 * (1 - node.heatFactor));
        label += "\n<TR><TD><FONT COLOR=\"" + generalFunctions.rgbToHex(r, 0, b) + "\" POINT-SIZE=\"20\">&#xf06d;</FONT></TD></TR>";
        label += "\n</TABLE>>";
      }
      return label;
    }


    return {
      generateSvgGraph: generateSvgGraph
    }
  }
}
