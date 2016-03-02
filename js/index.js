var d3 = require('d3');
var ipc = require("electron").ipcRenderer;
var _ = require('lodash/core');
var hljs = require('highlight.js');
var dagreD3 = require('dagre-d3');
var data = null;
var editors = [];
var range = 0;

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
})

ipc.on('renderGraph1', function(event, message) {
  JSON.stringify(data, null, 2)
  var g = new dagreD3.graphlib.Graph({
      compound: true
    })
    .setGraph({})
    .setDefaultEdgeLabel(function() {
      return {};
    });

  _.forEach(data, function(value, key) {
    data[value.id] = value;
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
    g.setNode(value.id, {
      label: value.id,
      width: 144,
      height: 100,
      style: "fill: " + fillColor,
      description: value.name,
      id: value.id
    });

  });

  _.forEach(data, function(value1, key1) {
    _.forEach(value1.childrenNodes, function(value2, key2) {
      g.setEdge(value1.id, value2, {
        id: value1.id + "-" + value2
      });
    });
  });

  g.nodes().forEach(function(v) {
    var node = g.node(v);
    // Round the corners of the nodes
    node.rx = node.ry = 5;
  });
  var render = new dagreD3.render();

  // Set up an SVG group so that we can translate the final graph.
  var svg = d3.select("svg");
  svg.selectAll("*").remove();
  var inner = svg.append("g");
  // Set up zoom support
  var zoom = d3.behavior.zoom().on("zoom", function() {
    inner.attr("transform", "translate(" + d3.event.translate + ")" +
      "scale(" + d3.event.scale + ")");
  });
  svg.call(zoom);


  // Run the renderer. This is what draws the final graph.
  render(inner, g);

  // Set tooltips
  var styleTooltip = function(name, description) {
    return "<p class='name'>" + name + "</p><p class='description'>" + description + "</p>";
  };
  inner.selectAll("g.node")
    .attr("title", function(v) {
      return styleTooltip(v, g.node(v).description)
    })
    .each(function(v) {
      //alert($(this).css('opacity'));
      $(this).tipsy({
        gravity: "w",
        opacity: 1,
        html: true
      });
    });


  // Set left-click events for nodes
  inner.selectAll("g.node").on('click', function(d) {
    var Range = ace.require('ace/range').Range;
    var start = data[this.id].start.split(':');
    var end = data[this.id].end.split(':');
    if (range)
      editors[4].removeSelectionMarker(range);
    range = new Range(start[1] - 1, start[0] - 1, end[1] - 1, end[0] - 1);
    editors[4].addSelectionMarker(
      range
    );
    displayNodeInfo(data[this.id]);
    //$('#node-info').text( JSON.stringify(data[this.id], null, 2) );
  });

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

  // Set right-click events for nodes
  function hideChildren(node) {
    _.forEach(node.childrenNodes, function(value, key) {
      hideChildren(data[value]);
      var childNode = d3.select('[id="' + value + '"]');
      var edge = d3.select('[id="' + node.id + '-' + value + '"]');

      if (childNode.style('display') == 'inline') {
        childNode.style("display", 'none');
      } else {
        childNode.style("display", 'inline');
      }

      if (edge.style('display') == 'inline') {
        edge.style("display", 'none');
      } else {
        edge.style("display", 'inline');
      }



    });
  };

  inner.selectAll("g.node").on('contextmenu', function(d) {
    hideChildren(data[this.id]);
  });


});


function getTree(root) {
  var tree = {
    "name": root.id,
    "children": []
  };
  //alert("CurrentNode: " + JSON.stringify(root, null, 2));
  _.forEach(root.childrenNodes, function(value, key) {
    //alert('adding' + value);
    tree["children"].push(getTree(data[value]));
    //alert('added ' + value);
  });
  if (tree["children"].length == 0)
    delete tree["children"];
  //alert("Returning: " + JSON.stringify(tree, null, 2));
  return tree;
}

ipc.on('renderGraph2', function(event, message) {
  var pubs = getTree(data["1:12"]);
  var diameter = 800;

  var margin = {
      top: 20,
      right: 120,
      bottom: 20,
      left: 120
    },
    width = diameter,
    height = diameter;

  var i = 0,
    duration = 350,
    root;

  var tree = d3.layout.tree()
    .size([360, diameter / 2 - 80])
    .separation(function(a, b) {
      return (a.parent == b.parent ? 1 : 10) / a.depth;
    });

  var diagonal = d3.svg.diagonal.radial()
    .projection(function(d) {
      return [d.y, d.x / 180 * Math.PI];
    });

  var drag = d3.behavior.drag();
  drag.on("dragstart", function() {
    alert('dragging');
    d3.event.sourceEvent.stopPropagation(); // silence other listeners
  });


  var svg = d3.select("svg").call(d3.behavior.zoom().on("zoom", function() {
      svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
    }))
    .append("g");




  root = pubs;
  root.x0 = height / 2;
  root.y0 = 0;

  //root.children.forEach(collapse); // start with all children collapsed
  update(root);

  //d3.select(self.frameElement).style("height", "800px");

  function update(source) {

    // Compute the new tree layout.
    var nodes = tree.nodes(root),
      links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) {
      d.y = d.depth * 80;
    });

    // Update the nodes…
    var node = svg.selectAll("g.node")
      .data(nodes, function(d) {
        return d.id || (d.id = ++i);
      });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      //.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
      .on("click", click);

    nodeEnter.append("circle")
      .attr("r", 1e-6)
      .style("fill", function(d) {
        return d._children ? "lightsteelblue" : "#fff";
      });

    nodeEnter.append("text")
      .attr("x", 10)
      .attr("dy", ".35em")
      .attr("text-anchor", "start")
      //.attr("transform", function(d) { return d.x < 180 ? "translate(0)" : "rotate(180)translate(-" + (d.name.length * 8.5)  + ")"; })
      .text(function(d) {
        return d.name;
      })
      .style("fill-opacity", 1e-6);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) {
        return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
      })

    nodeUpdate.select("circle")
      .attr("r", 4.5)
      .style("fill", function(d) {
        return d._children ? "lightsteelblue" : "#fff";
      });

    nodeUpdate.select("text")
      .style("fill-opacity", 1)
      .attr("transform", function(d) {
        return d.x < 180 ? "translate(0)" : "rotate(180)translate(-" + (d.name.length + 50) + ")";
      });

    // TODO: appropriate transform
    var nodeExit = node.exit().transition()
      .duration(duration)
      //.attr("transform", function(d) { return "diagonal(" + source.y + "," + source.x + ")"; })
      .remove();

    nodeExit.select("circle")
      .attr("r", 1e-6);

    nodeExit.select("text")
      .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
      .data(links, function(d) {
        return d.target.id;
      });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {
          x: source.x0,
          y: source.y0
        };
        return diagonal({
          source: o,
          target: o
        });
      });

    // Transition links to their new position.
    link.transition()
      .duration(duration)
      .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {
          x: source.x,
          y: source.y
        };
        return diagonal({
          source: o,
          target: o
        });
      })
      .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Toggle children on click.
  function click(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }

    update(d);
  }

  // Collapse nodes
  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }


});







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





/*
function renderTestGraph() {

  var g = new dagreD3.graphlib.Graph({
      compound: true
    })
    .setGraph({})
    .setDefaultEdgeLabel(function() {
      return {};
    });

  // Here we're setting the nodes
  g.setNode('a', {
    label: 'A'
  });
  g.setNode('b', {
    label: 'B'
  });
  g.setNode('c', {
    label: 'C'
  });
  g.setNode('d', {
    label: 'D'
  });
  g.setNode('e', {
    label: 'E'
  });
  g.setNode('f', {
    label: 'F'
  });
  g.setNode('g', {
    label: 'G'
  });
  g.setNode('group', {
    label: 'Group',
    clusterLabelPos: 'top',
    style: 'fill: #d3d7e8'
  });
  g.setNode('top_group', {
    label: 'Top Group',
    clusterLabelPos: 'bottom',
    style: 'fill: #ffd47f'
  });
  g.setNode('bottom_group', {
    label: 'Bottom Group',
    style: 'fill: #5f9488'
  });

  // Set the parents to define which nodes belong to which cluster
  g.setParent('top_group', 'group');
  g.setParent('bottom_group', 'group');
  g.setParent('b', 'top_group');
  g.setParent('c', 'bottom_group');
  g.setParent('d', 'bottom_group');
  g.setParent('e', 'bottom_group');
  g.setParent('f', 'bottom_group');

  // Set up edges, no special attributes.
  g.setEdge('a', 'b');
  g.setEdge('b', 'c');
  g.setEdge('b', 'd');
  g.setEdge('b', 'e');
  g.setEdge('b', 'f');
  g.setEdge('b', 'g');



  g.nodes().forEach(function(v) {
    var node = g.node(v);
    // Round the corners of the nodes
    node.rx = node.ry = 5;
  });
  var render = new dagreD3.render();

  // Set up an SVG group so that we can translate the final graph.
  var svg = d3.select("#graph-container").append("svg").attr("width", 800).attr("height", 800);
  svg.selectAll("*").remove()
  var inner = svg.append("g");

  // Set up zoom support
  var zoom = d3.behavior.zoom().on("zoom", function() {
    inner.attr("transform", "translate(" + d3.event.translate + ")" +
      "scale(" + d3.event.scale + ")");
  });
  svg.call(zoom);


  // Run the renderer. This is what draws the final graph.
  render(inner, g);

  inner.selectAll("g.cluster").on('click', function(d) {
    alert(d);
  });


}
*/
