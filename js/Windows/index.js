var ipc = require("electron").ipcRenderer;
var _ = require('lodash/core');
var d3 = require('d3');
var dagreD3 = require('dagre-d3');
var $ = require('jquery');
global.jQuery = require('jquery');
window.$ = $;
require('bootstrap');

//require("colresizable");
var BootstrapMenu = require('bootstrap-menu');
var configuration = require('../js/Controllers/configuration.js');

var data = null;
var displayedData = null;
var flowGraph = null;
var dependencyGraph = null;
var fileMaps = null;
var editors = {};
var ranges = [];
var codeSnippets = null;
var tempSettings = null;
var render;
var maxCuDataSize = 0;

ipc.on('alert', function(event, message) {
  alert(message);
});

ipc.on('clearGraph', function(event, message) {
  clearGraph();
});

ipc.on('redrawGraph', function(event, message) {
  redraw(flowGraph);
});

ipc.on('setFileMapping', function(event, dat) {
  fileMaps = dat;
  _.each(fileMaps, function(value, key) {
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
      maxLines: 10000,
      fontSize: "14pt",
      wrapBehavioursEnabled: true,
      animatedScroll: true
    });
    document.getElementById("code-container").appendChild(codeElement);
  });

});

function addToDescendantNodeCount(node) {
  node.descendantNodeCount = node.descendantNodeCount + 1;
  _.each(node.parentNodes, function(parentID) {
    if (node.type == 1) {
      _.each(data[parentID].parentNodes, function(grandparentID) {
        addToDescendantNodeCount(data[grandparentID]);
      });
    } else {
      addToDescendantNodeCount(data[parentID]);
    }
  });
}

ipc.on('initializeGraphAndData', function(event, dat) {
  var rootNode, startCU, endCU;
  if (fileMaps == null) {
    alert('Import FileMapping first');
    return;
  }
  data = {};
  displayedData = {};
  codeSnippets = {};
  _.each(dat, function(node) {
    node.parentNodes = [];
    if (node.type == 0) {
      node.predecessorCUs = [];
      maxCuDataSize = Math.max(maxCuDataSize, node.readDataSize + node.writeDataSize);
    } else {
      node.descendantNodeCount = 0;
    }
    node.collapsed = true;
    data[node.id] = node;
  });

  // Add parentNodes, predecessorCUs and descendantNodeCount properties to CU-nodes
  _.forEach(dat, function(node) {
    // parentNodes
    _.each(node.childrenNodes, function(childNodeID) {
      data[childNodeID].parentNodes.push(node.id);
    });

    // predecessorCUs
    if (node.type == 0) {
      for (var i = 0; i < node.successorCUs.length; i++) {
        try {
          data[node.successorCUs[i]].predecessorCUs.push(node.id);
        } catch (error) {
          console.log('Error trying to add predecessorCU ' + node.id + ' to ' + node.successorCUs[i]);
          console.log('data', data);
          throw error;
        }
      }
    }
  });

  _.forEach(data, function(node) {
    if (node.type != 0 && !node.parentNodes.length) {
      rootNode = node;
    }
    if (node.type == 0) {
      _.each(node.parentNodes, function(parentID) {
        addToDescendantNodeCount(data[parentID]);
      });
    }
  });
  _.forEach(data, function(node) {
    if (node.type == 0 && node.parentNodes[0] == rootNode.id) {
      if (!node.predecessorCUs.length) {
        node.predecessorCUs.push('startNode');
      }
      if (!node.successorCUs.length) {
        node.successorCUs.push('endNode');
      }
    }
  });

  // check which nodes to render
  flowGraph = new dagreD3.graphlib.Graph({
      compound: true,
      multigraph: true,
      directed: true
    })
    .setGraph({})
    .setDefaultEdgeLabel(function() {
      return {};
    });

  dependencyGraph = new dagreD3.graphlib.Graph({
      compound: true,
      multigraph: true,
      directed: false
    })
    .setGraph({})
    .setDefaultEdgeLabel(function() {
      return {};
    });

  flowGraph.graphType = "flow";
  dependencyGraph.graphType = "dependency";

  var svgFlow = d3.select("#flow-graph-container svg"),
    innerFlow = d3.select("#flow-graph-container svg g"),
    zoomFlow = d3.behavior.zoom().on("zoom", function() {
      innerFlow.attr("transform", "translate(" + d3.event.translate + ")" +
        "scale(" + d3.event.scale + ")");
    });
  svgFlow.call(zoomFlow);

  var svgDependency = d3.select("#dependency-graph-container svg"),
    innerDependency = d3.select("#dependency-graph-container svg g"),
    zoomDependency = d3.behavior.zoom().on("zoom", function() {
      innerDependency.attr("transform", "translate(" + d3.event.translate + ")" +
        "scale(" + d3.event.scale + ")");
    });
  svgDependency.call(zoomDependency);

  // Create and configure the renderer
  render = dagreD3.render();
  initContextMenus();

  data['startNode'] = {
    collapsed: false,
    parentNodes: ['startNode'],
    type: 3
  };

  data['endNode'] = {

    collapsed: false,
    parentNodes: ['endNode'],
    type: 3
  };

  flowGraph.setNode('startNode', {
    id: '-1',
    label: "Entry",
    shape: "circle",
    class: "default-node"
  });
  flowGraph.setNode('endNode', {
    id: '-2',
    label: "Exit",
    shape: "circle",
    class: "default-node"
  });

  addNodeToGraph(rootNode, flowGraph);
  flowGraph.setEdge('startNode', rootNode.id);
  flowGraph.setEdge(rootNode.id, 'endNode');
  //addNodeToGraph(rootNode, dependencyGraph);
  renderFullDependencyGraph();
  redraw(flowGraph);
  //redraw(dependencyGraph);
});


function redraw(g) {
  console.log('redraw ' + g.graphType, g);
  // Set margins, if not present
  if (!g.graph().hasOwnProperty("marginx") &&
    !g.graph().hasOwnProperty("marginy")) {
    g.graph().marginx = 20;
    g.graph().marginy = 20;
  }

  g.graph().transition = function(selection) {
    return selection.transition().duration(500);
  };
  // Render the graph into svg g
  var inner = d3.select("#" + g.graphType + "-graph-container svg g");
  d3.select("#" + g.graphType + "-graph-container svg g").call(render, g);

  // Set click behavior
  var nodes = inner.selectAll("g.node");
  var clusters = inner.selectAll("g.cluster");

  nodes.on('click', function(d) {
    //d3.event.stopPropagation();
    unhighlight();
    highlightNodeInCode(data[d]);
  });

  nodes.on('dblclick', function(nodeID) {
    var node = data[nodeID];
    var cuNodes, loopNodes, functionNodes;

    d3.event.stopPropagation();
    unhighlight();
    highlightNodeInCode(node);
    if (!node.type && (node.RAWDepsOn.length || node.WARDepsOn.length || node.WAWDepsOn.length)) {
      toggleDependencyEdges(node);
      redraw(g);
    } else if (node.childrenNodes.length && node.collapsed) {
      expandNode(node, g);
      redraw(g);
    }
  });

  clusters.on('click', function(d) {
    //d3.event.stopPropagation();
    unhighlight();
    highlightNodeInCode(data[d]);
  });

  cuNodes = inner.selectAll(".node.cu-node");
  cuNodes.append("svg:foreignObject")
    .attr("width", 20)
    .attr("height", 20)
    .attr("y", "-32px")
    .attr("x", "50px")
    .append("xhtml:span")
    .attr("class", "control glyphicon glyphicon-fire")
    .attr("style", "color: yellow;");

  loopNodes = inner.selectAll(".node.loop-node");
  loopNodes.append("svg:foreignObject")
    .attr("width", 20)
    .attr("height", 20)
    .attr("y", "13px")
    .attr("x", "-8px")
    .append("xhtml:span")
    .attr("class", "control glyphicon glyphicon-fire")
    .attr("style", "color: red;");

  functionNodes = inner.selectAll(".node.function-node");
  functionNodes.append("svg:foreignObject")
    .attr("width", 20)
    .attr("height", 20)
    .attr("y", "15px")
    .attr("x", "-8px")
    .append("xhtml:span")
    .attr("class", "control glyphicon glyphicon-fire")
    .attr("style", "color: red;");

  // Set colors from settings
  inner.selectAll('g.cu-node').style("fill", configuration.readSetting('cuColor'));
  inner.selectAll('g.function-node').style("fill", configuration.readSetting('functionColor'));
  inner.selectAll('g.loop-node').style("fill", configuration.readSetting('loopColor'));
  inner.selectAll('g.default-node').style("fill", configuration.readSetting('defaultColor'));
  inner.selectAll('g.label').style("fill", configuration.readSetting('labelColor'));

  // Tooltip
  var tooltip = d3.select('#tooltip-container');
  inner.selectAll('.cluster.function-node').on("mouseover", function(nodeID) {
      tooltip.text('Function (' + data[nodeID].name + ')');
      return tooltip.style("visibility", "visible");
    })
    .on("mousemove", function() {
      return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 50) + "px");
    })
    .on("mouseout", function() {
      return tooltip.style("visibility", "hidden");
    });




  $('[data-toggle="popover"]').popover();
}

function highlightNodeInCode(info) {
  var Range = ace.require('ace/range').Range;
  var fileID = info.id.split(':')[0];
  var start = info.start.split(':');
  var end = info.end.split(':');
  var range = new Range(start[1] - 1, 0, end[1], 0);
  ranges.push(range);
  editors[fileID].addSelectionMarker(
    range
  );
}

function unhighlight() {
  _.forEach(ranges, function(range) {
    _.forEach(editors, function(editor, key) {
      editors[key].removeSelectionMarker(range);
    });
  });
  ranges = [];
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

function initContextMenus() {
  var menu1 = new BootstrapMenu('.node.cu-node', {
    fetchElementData: function($nodeElem) {
      var nodeId = $nodeElem[0].id;
      return data[nodeId];
    },
    actions: [{
      name: function(node) {
        var hasDependencies = node.type == 0 && (node.RAWDepsOn.length > 0 || node.WARDepsOn.length > 0 || node.WAWDepsOn.length > 0);
        if (hasDependencies) {
          return (node.collapsed) ? 'Show Dependencies' : 'Hide Dependencies';
        } else {
          return '<i>Show Dependencies</i>';
        }
      },
      iconClass: 'glyphicon glyphicon-retweet',
      onClick: function(node) {
        toggleDependencyEdges(node);
        redraw(flowGraph);
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
    fetchElementData: function($nodeElem) {
      var nodeId = $nodeElem[0].id;
      return data[nodeId];
    },
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
        expandNode(node, flowGraph);
        redraw(flowGraph);
      },
      classNames: function(node) {
        return {
          'action-success': (_.has(node, 'childrenNodes') && node.childrenNodes.length > 0)
        };
      },
      isEnabled: function(node) {
        console.log('node', node);
        console.log(_.has(node, 'childrenNodes') && node.childrenNodes.length);
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
        var currentNode, childNode;
        var stack = [];
        stack.push(node);
        do {
          currentNode = stack.pop();
          expandNode(currentNode, flowGraph);
          _.each(currentNode.childrenNodes, function(childNodeID) {
            childNode = data[childNodeID];
            if (_.has(childNode, 'childrenNodes') && childNode.childrenNodes.length) {
              stack.push(childNode);
            }
          });
        }
        while (stack.length);
        redraw(flowGraph);
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
    fetchElementData: function($nodeElem) {
      var nodeId = $nodeElem[0].id;
      return data[nodeId];
    },
    actions: [{
      name: 'Collapse',
      iconClass: 'glyphicon glyphicon-collapse-up',
      onClick: function(node) {
        collapseNode(node, flowGraph);
        redraw(flowGraph);
      }
    }, {
      name: 'Node-Info',
      iconClass: 'glyphicon glyphicon-info-sign',
      onClick: function(node) {
        ipc.send('showCuInfo', node);
      }
    }]
  });
}

function clearGraph(type) {
  $("#" + type + "-graph-container svg").empty();
}

function expandNode(node, g) {
  if (_.has(node, 'childrenNodes') && node.childrenNodes.length && node.collapsed && node.type > 0 && g.graphType == 'flow') {
    var childNode, successorCU, predecessorCU, sourceNodeID, sinkNodeID;
    node.collapsed = false;
    // Add children nodes to graph
    _.each(node.childrenNodes, function(childNodeID) {
      if (data[childNodeID].type != 0) {
        data[childNodeID].collapsed = true;
      } else {
        _.each(data[childNodeID].childrenNodes, function(functionNodeID) {
          addNodeToGraph(data[functionNodeID], g);
          g.setEdge(childNodeID, functionNodeID, {
            style: "stroke: #000; stroke-width: 1px; stroke-dasharray: 5, 5;"
          });
        });
      }
      addNodeToGraph(data[childNodeID], g);
    });

    var graphNode = g.node(node.id);
    graphNode.clusterLabelPos = 'top';
    g.setNode(node.id, graphNode);

    // remove edges from expanded node
    _.each(g.nodeEdges(node.id), function(edge) {
      g.removeEdge(edge);
    });

    // add edges to children of expanded nodes
    _.each(node.childrenNodes, function(childNodeID) {
      g.setParent(childNodeID, node.id);
      childNode = data[childNodeID];
      _.each(childNode.successorCUs, function(successorID) {
        console.log('AChecking successor ' + successorID);
        successorCU = data[successorID];
        sinkNodeID = data[successorCU.parentNodes[0]].collapsed ? successorCU.parentNodes[0] : successorID;
        console.log('ASetting edge ' + childNodeID + ' -> ' + sinkNodeID);
        g.setEdge(childNodeID, sinkNodeID, {
          style: "stroke: " + configuration.readSetting('cuColor') + "; stroke-width: 3px;",
          arrowheadStyle: "fill: " + configuration.readSetting('cuColor') + "; stroke: " + configuration.readSetting('cuColor')
        });
      });

      _.each(childNode.predecessorCUs, function(predecessorID) {
        var predecessorCU = data[predecessorID];
        var fromNode;
        if (predecessorCU.parentNodes[0] != node.id) {
          sourceNodeID = data[predecessorCU.parentNodes[0]].collapsed ? predecessorCU.parentNodes[0] : predecessorID;
          console.log('BSetting edge ' + sourceNodeID + ' -> ' + childNodeID);
          g.setEdge(sourceNodeID, childNodeID, {
            style: "stroke: " + configuration.readSetting('cuColor') + "; stroke-width: 3px;",
            arrowheadStyle: "fill: " + configuration.readSetting('cuColor') + "; stroke: " + configuration.readSetting('cuColor')
          });
        }
      });
    });

    if (node.type == 1) {
      _.each(node.childrenNodes, function(childNodeID) {
        if (!g.inEdges(childNodeID).length) {
          _.each(node.parentNodes, function(parentCU) {
            g.setEdge(parentCU, childNodeID, {
              style: "stroke: #000; stroke-width: 1px; stroke-dasharray: 5, 5;"
            });
          });
        }
      });
    }
  }
}

function collapseNode(node, g) {
  if (!node.collapsed && g.graphType == 'flow') {
    console.log('collapsing', node);
    var childNode;
    node.collapsed = true;
    _.each(node.childrenNodes, function(childNodeID) {
      childNode = data[childNodeID];
      _.each(g.inEdges(childNodeID), function(edge) {
        if (data[edge.v].parentNodes.indexOf(node.id) == -1) {
          console.log('Cluster predecessor edge', g.edge(edge));
          g.setEdge(edge.v, node.id, g.edge(edge));
        }
      });
      _.each(g.outEdges(childNodeID), function(edge) {
        if (data[edge.w].parentNodes.indexOf(node.id) == -1) {
          g.setEdge(node.id, edge.w, g.edge(edge));
        }
      });
      if (childNode.type == 0 && childNode.childrenNodes.length) {
        _.each(childNode.childrenNodes, function(functionNodeID) {
          collapseNode(data[functionNodeID], g);
          g.removeNode(functionNodeID);
        });
      } else if (!childNode.collapsed) {
        collapseNode(childNode, g);
      }
      g.removeNode(childNodeID);
    });
  }
}

function textifyNumber(value) {
  switch (value.length) {


  }
}

function addNodeToGraph(node, g) {
  var label, shape, nodeClass;
  switch (node.type) {
    case 0:
      label = 'CU (' + node.id + ')\nlines: ' + node.start + ' - ' + node.end + '\nData Read: ' + node.readDataSize + '\nData Written: ' + node.writeDataSize;
      shape = 'rect';
      nodeClass = 'cu-node';
      break;
    case 1:
      label = ' function (' + node.name + ')\nlines: ' + node.start + ' - ' + node.end + '\n ';
      shape = 'diamond';
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

  g.setNode(node.id, {
    id: node.id,
    label: label,
    //labelType: "html",
    style: "stroke: #000; stroke-width: 3px;",
    shape: shape,
    rx: 5,
    ry: 5,
    class: nodeClass
  });
}


function renderFullDependencyGraph() {
  _.each(data, function(node) {
    if (node.type == 0) {
      addNodeToGraph(node, dependencyGraph);
    }
  });

  _.each(data, function(node) {
    _.each(node.RAWDepsOn, function(dependentCuId) {
      dependencyGraph.setEdge(node.id, dependentCuId, {
        label: "RaW"
          //,style: "stroke: #000; stroke-width: 1px; stroke-dasharray: 5, 5;"
      });
    });
    _.each(node.WARDepsOn, function(dependentCuId) {
      dependencyGraph.setEdge(node.id, dependentCuId, {
        label: "WaR",
        style: "stroke: #000; stroke-width: 1px; stroke-dasharray: 5, 5;"
      });
    });
    _.each(node.WAWDepsOn, function(dependentCuId) {
      dependencyGraph.setEdge(node.id, dependentCuId, {
        label: "WaW",
        style: "stroke: #000; stroke-width: 1px; stroke-dasharray: 5, 5;"
      });
    });
    if (node.type != 1) {
      dependencyGraph.setParent(node.id, node.parentNodes[0]);
    }

  });
}

function toggleDependencyEdges(node) {
  if (node.collapsed) {
    _.each(node.RAWDepsOn, function(dependencyID) {
      flowGraph.setEdge(node.id, dependencyID, {
        style: "stroke: #000; stroke-width: 1px;",
        label: "RaW",
        arrowheadStyle: "fill: #000; stroke: #000;"
      }, "RaW");
    });
    _.each(node.WARDepsOn, function(dependencyID) {
      flowGraph.setEdge(node.id, dependencyID, {
        style: "stroke: #000; stroke-width: 1px;",
        label: "WaR",
        arrowheadStyle: "fill: #000; stroke: #000;"
      }, "WaR");
    });
    _.each(node.WAWDepsOn, function(dependencyID) {
      flowGraph.setEdge(node.id, dependencyID, {
        style: "stroke: #000; stroke-width: 1px;",
        label: "WaW",
        arrowheadStyle: "fill: #000; stroke: #000;"
      }, "WaW");
    });
    node.collapsed = false;
  } else {
    _.each(node.RAWDepsOn, function(dependencyID) {
      flowGraph.removeEdge({
        v: node.id,
        w: dependencyID,
        name: "RaW"
      });
    });
    _.each(node.WARDepsOn, function(dependencyID) {
      flowGraph.removeEdge({
        v: node.id,
        w: dependencyID,
        name: "WaR"
      });
    });
    _.each(node.WAWDepsOn, function(dependencyID) {
      flowGraph.removeEdge({
        v: node.id,
        w: dependencyID,
        name: "WaW"
      });
    });
    node.collapsed = true;
  }
}
