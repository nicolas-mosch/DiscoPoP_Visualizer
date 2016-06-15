var util = require("./util"),
  addLabel = require("./label/add-label");

module.exports = createClusters;

function createClusters(selection, g) {
  var clusters = g.nodes().filter(function(v) {
      return util.isSubgraph(g, v);
    }),
    svgClusters = selection.selectAll("g.cluster")
    .data(clusters, function(v) {
      return v;
    });

  svgClusters.selectAll("*").remove();
  var cluster = svgClusters.enter()
    .append("g")
    .attr("class", function(v) {
      var node = g.node(v);
      return "cluster " + node.class;
    })
    .attr("id", function(v) {
      var node = g.node(v);
      return node.id;
    })
    .attr("data-id", function(v) {
      var node = g.node(v);
      return node.id;
    })
    .style("opacity", 0);


  util.applyTransition(svgClusters, g)
    .style("opacity", 1);

  svgClusters.sort(function(a, b) {
    return g.node(a).clusterLevel > g.node(b).clusterLevel;
  });
  svgClusters.each(function(v) {
    var node = g.node(v),
      thisGroup = d3.select(this);
    var svgRect = d3.select(this).append("rect").attr("class", "node-shape");

    //var labelGroup = thisGroup.append("g").attr("class", "label");
    //addLabel(labelGroup, node, node.label, node.clusterLabelPos);
  });

  svgClusters.selectAll("rect").each(function(c) {
    var node = g.node(c);
    var domCluster = d3.select(this);
    util.applyStyle(domCluster, node.style);
  });

  util.applyTransition(svgClusters.exit(), g)
    .style("opacity", 0)
    .remove();

  return svgClusters;
}
