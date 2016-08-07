"use strict";

var intersectRect = require("./intersect/intersect-rect"),
  intersectEllipse = require("./intersect/intersect-ellipse"),
  intersectCircle = require("./intersect/intersect-circle"),
  intersectPolygon = require("./intersect/intersect-polygon");
var r, g;
var iconSize = 18;

module.exports = {
  rect: rect,
  ellipse: ellipse,
  circle: circle,
  diamond: diamond,
  hexagon: hexagon
};

function rect(parent, bbox, node) {
  var shapeSvg = parent.insert("rect", ":first-child")
    .attr("rx", node.rx)
    .attr("ry", node.ry)
    .attr("x", -bbox.width / 2)
    .attr("y", -bbox.height / 2)
    .attr("width", bbox.width)
    .attr("height", bbox.height)
    .attr("class", "node-shape");


  node.intersect = function(point) {
    return intersectRect(node, point);
  };

  /*if (typeof node.heatFactor != undefined) {
    r = Math.floor(255 * node.heatFactor);
    g = Math.floor(255 * (1 - node.heatFactor));
    parent.append("svg:foreignObject")
      .attr("width", iconSize)
      .attr("height", iconSize)
      .attr("y", -(bbox.height / 2) + iconSize / 2)
      .attr("x", (bbox.width / 2) - iconSize)
      .append("xhtml:span")
      .attr("class", "control glyphicon glyphicon-fire")
      .attr("style", "color: rgb(" + r + ", " + g + ", 0); font-size: " + iconSize + "px");
  }*/

  return shapeSvg;
}

function ellipse(parent, bbox, node) {
  var rx = bbox.width / 2,
    ry = bbox.height / 2,
    shapeSvg = parent.insert("ellipse", ":first-child")
    .attr("x", -bbox.width / 2)
    .attr("y", -bbox.height / 2)
    .attr("rx", rx)
    .attr("ry", ry)
    .attr("class", "node-shape");
    /*
  if (typeof node.heatFactor != undefined) {
    r = Math.floor(255 * node.heatFactor);
    g = Math.floor(255 * (1 - node.heatFactor));
    parent.append("svg:foreignObject")
      .attr("width", iconSize)
      .attr("height", iconSize)
      .attr("y", (bbox.height / 2) - iconSize)
      .attr("x", - iconSize / 2)
      .append("xhtml:span")
      .attr("class", "control glyphicon glyphicon-fire")
      .attr("style", "color: rgb(" + r + ", " + g + ", 0); font-size: " + iconSize + "px");
  }*/

  node.intersect = function(point) {
    return intersectEllipse(node, rx, ry, point);
  };

  return shapeSvg;
}

function circle(parent, bbox, node) {
  var r = Math.max(bbox.width, bbox.height) / 2,
    shapeSvg = parent.insert("circle", ":first-child")
    .attr("x", -bbox.width / 2)
    .attr("y", -bbox.height / 2)
    .attr("r", r)
    .attr("class", "node-shape");

  /*if (typeof node.heatFactor != undefined) {
    r = Math.floor(255 * node.heatFactor);
    g = Math.floor(255 * (1 - node.heatFactor));
    parent.append("svg:foreignObject")
      .attr("width", iconSize)
      .attr("height", iconSize)
      .attr("y", (bbox.height / 2) - iconSize)
      .attr("x", - iconSize / 2)
      .append("xhtml:span")
      .attr("class", "control glyphicon glyphicon-fire")
      .attr("style", "color: rgb(" + r + ", " + g + ", 0); font-size: " + iconSize + "px");
  }*/


  node.intersect = function(point) {
    return intersectCircle(node, r, point);
  };

  return shapeSvg;
}

// Circumscribe an ellipse for the bounding box with a diamond shape. I derived
// the function to calculate the diamond shape from:
// http://mathforum.org/kb/message.jspa?messageID=3750236
function hexagon(parent, bbox, node) {
  var w = (bbox.width * Math.SQRT2) / 2,
    h = (bbox.height * Math.SQRT2) / 2,
    points = [{
      x: w / 2,
      y: -h
    }, {
      x: -w / 2,
      y: -h
    }, {
      x: -w,
      y: 0
    }, {
      x: -w / 2,
      y: h
    }, {
      x: w / 2,
      y: h
    }, {
      x: w,
      y: 0
    }],
    shapeSvg = parent.insert("polygon", ":first-child")
    .attr("points", points.map(function(p) {
      return p.x + "," + p.y;
    }).join(" "))
    .attr("class", "node-shape");

/*
  if (typeof node.heatFactor != undefined) {
    r = Math.floor(255 * node.heatFactor);
    g = Math.floor(255 * (1 - node.heatFactor));
    parent.append("svg:foreignObject")
      .attr("width", iconSize)
      .attr("height", iconSize)
      .attr("y", (bbox.height / 2) - iconSize)
      .attr("x", - iconSize / 2)
      .append("xhtml:span")
      .attr("class", "control glyphicon glyphicon-fire")
      .attr("style", "color: rgb(" + r + ", " + g + ", 0); font-size: " + iconSize + "px");
  }
*/
  node.intersect = function(p) {
    return intersectPolygon(node, points, p);
  };

  return shapeSvg;
}

function diamond(parent, bbox, node) {
  var w = (bbox.width * Math.SQRT2) / 2,
    h = (bbox.height * Math.SQRT2) / 2,
    points = [{
      x: 0,
      y: -h
    }, {
      x: -w,
      y: 0
    }, {
      x: 0,
      y: h
    }, {
      x: w,
      y: 0
    }],
    shapeSvg = parent.insert("polygon", ":first-child")
    .attr("points", points.map(function(p) {
      return p.x + "," + p.y;
    }).join(" "))
    .attr("class", "node-shape");

  /*if (typeof node.heatFactor != undefined) {
    r = Math.floor(255 * node.heatFactor);
    g = Math.floor(255 * (1 - node.heatFactor));
    parent.append("svg:foreignObject")
      .attr("width", iconSize)
      .attr("height", iconSize)
      .attr("y", (bbox.height / 2) - iconSize)
      .attr("x", - iconSize / 2)
      .append("xhtml:span")
      .attr("class", "control glyphicon glyphicon-fire")
      .attr("style", "color: rgb(" + r + ", " + g + ", 0); font-size: " + iconSize + "px");
  }*/

  node.intersect = function(p) {
    return intersectPolygon(node, points, p);
  };

  return shapeSvg;
}
