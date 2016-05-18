var fs = require('fs');
var _ = require('lodash/core');
var sizeof = require('sizeof');
var IntervalTree = require('../Models/tree.js');

function buildFromFile(mappingFilePath, nodeFilePath) {
  var rootNode, startCU, endCU, nodeID, i, start, end, fileID;
  var data = {};
  var fileMaps = {};
  var fileNodeIntervalTrees = {};
  var maxCuDataSize = 0;
  var minCuDataSize = Infinity;
  var midCuDataSize;
  // Set file-mapping
  var fileContents = fs.readFileSync(mappingFilePath, "utf-8");
  var fileLines = fileContents.split('\n');

  for (var line = 0; line < fileLines.length; line++) {
    var fileLine = fileLines[line].split('\t');
    if (fileLine.length == 2) {
      fileContents = fs.readFileSync(fileLine[1].trim(), "utf-8");
      fileMaps[fileLine[0]] = {
        path: fileLine[1].trim(),
        content: fileContents
      };
      fileNodeIntervalTrees[fileLine[0]] = new IntervalTree();
    }
  }

  // Set node-data
  fileContents = fs.readFileSync(nodeFilePath);
  fileContents = JSON.parse(fileContents);


  // Updates the descendantNodeCount of a CU's ancestor-nodes
  function addToDescendantNodeCount(node, dataSize) {
    node.descendantNodeCount = node.descendantNodeCount + 1;
    node.dataSize = node.dataSize + dataSize;
    _.each(node.parentNodes, function(parentNode) {
      if (node.type == 1) {
        _.each(parentNode.parentNodes, function(grandparentNode) {
          addToDescendantNodeCount(grandparentNode, dataSize);
        });
      } else {
        addToDescendantNodeCount(parentNode, dataSize);
      }
    });
  }

  // Add all initial nodes
  _.each(fileContents, function(node) {
    node.parentNodes = [];
    if (node.type == 0) {
      node.predecessorCUs = [];
      fileID = node.id.split(':')[0];
      start = node.start.split(':')[1];
      end = node.end.split(':')[1];
      fileNodeIntervalTrees[fileID].insert([start, end], node);
      node.dataSize = node.readDataSize + node.writeDataSize;
    } else {
      node.descendantNodeCount = 0;
      node.dataSize = 0
    }
    data[node.id] = node;
  });

  console.log('Initial dataset size: ' + sizeof.sizeof(data, true));
  //console.log('Initial dataset size: ' + sizeof(data) + 'B');

  // Add parentNodes and predecessorCUs properties to CU-nodes
  _.each(data, function(node) {
    // set references to parentNodes and childrenNodes
    for (i = 0; i < node.childrenNodes.length; i++) {
      nodeID = node.childrenNodes[i];
      try {
        if (!_.has(data, nodeID)) {
          data[nodeID] = {
            id: nodeID,
            type: 3,
            name: 'Library Function',
            parentNodes: []
          };
        }
        data[nodeID].parentNodes.push(node);
        node.childrenNodes[i] = data[nodeID];
      } catch (err) {
        console.error('Tried to add ' + node.id + ' to ' + nodeID + '\'s parentNodes', node, data[nodeID]);
        throw err;
      }
    }

    if (node.type == 0) {
      // set references to predecessorCUs and successorCUs and dependencies
      for (i = 0; i < node.successorCUs.length; i++) {
        try {
          nodeID = node.successorCUs[i];
          data[nodeID].predecessorCUs.push(node);
          node.successorCUs[i] = data[nodeID];
        } catch (err) {
          console.error('Tried to add ' + node.id + ' to ' + nodeID + '\'s predecessorCUs', node, data[nodeID]);
          throw err;
        }
      }
      for (i = 0; i < node.RAWDepsOn.length; i++) {
        node.RAWDepsOn[i] = data[node.RAWDepsOn[i]];
      }

      for (i = 0; i < node.WAWDepsOn.length; i++) {
        node.WAWDepsOn[i] = data[node.WAWDepsOn[i]];
      }

      for (i = 0; i < node.WARDepsOn.length; i++) {
        node.WARDepsOn[i] = data[node.WARDepsOn[i]];
      }
    }
  });

  // Create entry and exit nodes
  var entryNode = {
    parentNodes: [],
    type: -1,
    name: 'Entry',
    id: 'entryNode'
  };

  var exitNode = {
    parentNodes: [],
    type: -1,
    name: 'Exit',
    id: 'exitNode'
  };

  _.each(data, function(node) {
    if (node.type == 0) {
      // set descendantNodeCounts of CU's ancestor-nodes
      _.each(node.parentNodes, function(parentNode) {
        addToDescendantNodeCount(parentNode, node.dataSize);
      });
    } else if (!node.parentNodes.length) {
      // Find the root Node
      rootNode = node;
      _.each(node.childrenNodes, function(childNode) {
        //connect starting and ending CUs to start and end nodes
        if (childNode.type == 0) {
          if (!childNode.predecessorCUs.length) {
            childNode.predecessorCUs.push(entryNode);
          }
          if (!childNode.successorCUs.length) {
            childNode.successorCUs.push(exitNode);
          }
        }
      });
    }
  });

  // get max/min-CuDataSize
  _.each(data, function(node) {
    maxCuDataSize = Math.max(maxCuDataSize, node.dataSize);
    minCuDataSize = Math.min(maxCuDataSize, node.dataSize);
  });
  console.log('max', maxCuDataSize);
  console.log('min', minCuDataSize);
  midCuDataSize = (maxCuDataSize - minCuDataSize) / 2;

  // get max/min-CuDataSize
  _.each(data, function(node) {
    node.heatFactor = (node.dataSize / 2) / midCuDataSize;
  });

  // Add start and end nodes to dataset
  data['entryNode'] = entryNode;
  data['exitNode'] = exitNode;
  console.log('Resulting dataset size: ' + sizeof.sizeof(data, true));

  return {
    fileMapping: fileMaps,
    rootNode: rootNode,
    nodeData: data,
    fileNodeIntervalTrees: fileNodeIntervalTrees
  };
};




module.exports = {
  buildFromFile: buildFromFile
};
