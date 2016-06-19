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
        nodes[nodeId].expand();
      } else {
        nodes[nodeId].collapse();
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
      }
      /* else if (node.type < 3) {
              var recursiveCall = this;
              _.each(node.children, function(child) {
                recursiveCall(child);
              });
            }*/
    });

    ipc.on('expandNode', function(event, nodeId) {
      var node = nodes[nodeId];
      if (node.type >= 0 && node.type < 3) {
        node.expand();
        event.sender.send('update-graph', generateSvgGraph());
      }
    });

    ipc.on('collapseNode', function(event, nodeId) {
      nodes[nodeId].collapse();
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
     * Generates the svg HTML-Markup for the full displayed graph
     * @return {String} the string containing the HTML-Markup for the svg
     */
    function generateSvgGraph() {
      /*
        digraph in DOT format. Used as input for Viz.js
       */
      var digraph;

      var checkedNodes = [];
      var functionNodes = [];
      var functionCallEdges = [];
      var addedFlowEdges = [];
      var dependencyEdges = [];
      var visibleAncestor;

      _.each(rootNodes, function(root) {
        functionNodes.push(root);
      });

      /**
       * Recursively adds a subgraph to the digraph.
       * @param {[type]} node [description]
       */
      function addSubgraph(node) {
        // Avoid endless-loops for recursive-functions
        if (checkedNodes.indexOf(node.id) > -1) {
          return;
        }
        checkedNodes.push(node.id);

        // Continue with new subgraph only if node is expanded, otherwise add as node (bottom)
        if (node.expanded) {
          digraph += "\nsubgraph cluster" + node.id + " {"
          var edge;
          _.each(node.children, function(child) {
            if (child.type == 2) {
              addSubgraph(child);
            } else if (child.type == 0) {
              checkedNodes.push(child.id);
              digraph += '\n' + child.id + ' [id=' + child.id + ', shape=rect;label=' + createLabel(child) + ', style="filled"];';

              // Add edges to successors and predecessors of CU
              _.each(child.successors, function(successor) {
                visibleAncestor = findFirstVisibleAncestor(successor);
                edge = child.id + ' -> ' + visibleAncestor.id;
                if (addedFlowEdges.indexOf(edge) == -1) {
                  digraph += "\n" + edge + ' [id="' + edge.replace(' -> ', 't') + '"];';
                  addedFlowEdges.push(edge);
                }
              });
              _.each(child.predecessors, function(predecessor) {
                visibleAncestor = findFirstVisibleAncestor(predecessor);
                edge = visibleAncestor.id + " -> " + child.id;
                if (addedFlowEdges.indexOf(edge) == -1) {
                  digraph += '\n' + edge + '[id="' + edge.replace(' -> ', 't') + '"];';
                  addedFlowEdges.push(edge);
                }
              });

              // Add edges to called function-nodes to the queue to be added to the digraph at the end
              // (adding them at the end, renders the called-function outside of this function)
              if (child.expanded) {
                _.each(child.children, function(functionCall) {
                  if (functionCall.expanded) {
                    edge = child.id + ' -> ' + functionCall.entry.id;
                    functionCallEdges.push(edge);
                  } else {
                    edge = child.id + ' -> ' + functionCall.id;
                    functionCallEdges.push(edge);
                  }
                  functionNodes.push(functionCall);
                });
              }

              // Add dependency-edges
              if (child.dependenciesVisible) {
                _.each(child.dependencies, function(dependency) {
                  visibleAncestor = findFirstVisibleAncestor(dependency.cuNode);
                  edge = child.id + ' -> ' + visibleAncestor.id;
                  digraph += '\n' + edge + '[id="' + edge.replace(' -> ', 't') + '", label="' + dependency.variableName + '", taillabel="' + (dependency.isRaW() ? 'R' : 'W') + '", headlabel="' + (dependency.isWaR() ? 'R' : 'W') + '"];';
                  dependencyEdges.push(edge);
                });
              }
            }
          });
          digraph += '\nlabel=' + createLabel(node) + ';';
          digraph += '\nstyle="filled"';
          digraph += '\nid=' + node.id;
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
        digraph += '\n' + edge + ' [style=dotted, id="' + edge.replace(' -> ', 't') + '"];';
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
        console.log('Execution-Time of Layout-Calculation: ', end - start);
      } catch (err) {
        console.error(err);
        console.log('\n---------------------------\n' + digraph + '\n---------------------------\n');
      }

      // Hack for adding classes to svg nodes (not supported by graphviz)
      var node, nodeClass;
      _.each(checkedNodes, function(nodeId) {
        node = nodes[nodeId];
        switch (node.type) {
          case 0:
            nodeClass = 'cu-node';
            break;
          case 1:
            nodeClass = 'function-node';
            break;
          case 2:
            nodeClass = 'loop-node';
            break;
          case 3:
            nodeClass = 'function-call-node';
            break;
          default:
            nodeClass = "default-node";
        }

        svg = svg.replace('<g id="' + nodeId + '" class="node"', '<g id="' + nodeId + '" class="node ' + nodeClass + '"');
        svg = svg.replace('<g id="' + nodeId + '" class="cluster"', '<g id="' + nodeId + '" class="cluster ' + nodeClass + '"');
      });
      // Hack for adding classes to svg edges (not supported by graphviz)
      _.each(addedFlowEdges, function(edge) {
        console.log('Replacing ' + 'id="' + edge.replace(' -> ', 't') + '" class="edge"', svg.indexOf('id="' + edge + '" class="edge"'));

        svg = svg.replace('<g id="' + edge.replace(' -> ', 't') + '" class="edge"', '<g id="' + edge + '" class="edge flow-edge"');
      });

      _.each(functionCallEdges, function(edge) {
        svg = svg.replace('<g id="' + edge.replace(' -> ', 't') + '" class="edge"', '<g id="' + edge + '" class="edge function-call-edge"');
      });

      _.each(dependencyEdges, function(edge) {
        svg = svg.replace('<g id="' + edge.replace(' -> ', 't') + '" class="edge"', '<g id="' + edge + '" class="edge dependency-edge"');
      });

      // Hack for removing title tooltip from elements (not supported by graphviz)
      svg = svg.replace(/<title>.*<\/title>/g, '');

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
