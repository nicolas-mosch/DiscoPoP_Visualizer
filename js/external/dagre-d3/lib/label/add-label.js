var addTextLabel = require("./add-text-label"),
  addHtmlLabel = require("./add-html-label"),
  addSVGLabel = require("./add-svg-label"),
  _ = require('../lodash');
module.exports = addLabel;

function addLabel(root, node, location) {
  var labelSvg = root.append("g");
  var label = node.label;
  // Allow the label to be a string, a function that returns a DOM element, or
  // a DOM element itself.
  if (node.labelType === "svg") {
    addSVGLabel(labelSvg, node, label);
  } else if (typeof label !== "string" || node.labelType === "html") {
    addHtmlLabel(labelSvg, node, label);
  } else {
    addTextLabel(labelSvg, node, label);
  }

  var labelBBox = labelSvg.node().getBBox();
  var x, y;
  switch (location) {
    case "top":
      x = (-labelBBox.width / 2);
      y = (-node.height / 2);
      break;
    case "bottom":
      x = (-labelBBox.width / 2);
      y = (node.height / 2) - labelBBox.height;
      break;
    case "start":
      console.log('edge-start', node);
      x = (-labelBBox.width / 2);
      y = (node.height / 2) - labelBBox.height;
      break;
    case "end":
      x = (-labelBBox.width / 2);
      y = (node.height / 2) - labelBBox.height;
      break;
    default:
      x = (-labelBBox.width / 2);
      y = (-labelBBox.height / 2);
  }
  labelSvg.attr("transform",
    "translate(" + x + "," + y + ")");

  if(_.has(node, 'labelId')){
    labelSvg.attr("id", node.labelId);
  }

  return labelSvg;
}
