var fs = require('fs');
var _ = require('lodash');
var sizeof = require('sizeof');

/**
 * Module for reading DiscoPoP's output-files and adding the necessary information to the generated JSON objects
 * @module data-reader
 */
module.exports = {
  /**
   * Reads the files output by DiscoPoP and from them makes the necessary changes and creates the objects for the visualizer.
   * @param  {string} mappingFilePath The path to the FileMapping file
   * @param  {string} nodeFilePath    The path to the Node-Data file
   * @return {DiscoPopData}           The complete data from DiscoPoP required by the visualizer
   */
  buildFromFile: function buildFromFile(mappingFilePath, nodeFilePath) {
    var start = new Date().getTime();
    var startCU, endCU, nodeID, i, start, end, fileID;
    var rootNodes = [];
    var fileMaps = [];
    var functionNodes = [];
    var maxCuDataSize = 0;
    var minCuDataSize = Infinity;
    var midCuDataSize;
    var checkedNodes = [];
    var dataSize;
    var fileContents = fs.readFileSync(mappingFilePath, "utf-8");
    var fileLines = fileContents.split('\n');
    var fileLine;
    var node, childNode, functionNode, dependency, functionCall;
    var childNodeId;
    var nodeMap = {};
    var fileIdMap = {};
    var i;
	var errors = false;
    /**
     * Helper function: recursively sets the loopLevel, dataSize and descendantNodeCount of a node and its descendants
     */
    function setDescendantData(node, loopLevel) {
      if (checkedNodes.indexOf(node.id) == -1) {
        checkedNodes.push(node.id);
        if (node.type == 1) {
          loopLevel = 0;
        } else {
          node.loopLevel = loopLevel;
          loopLevel++;
        }
        _.each(node.childrenNodes, function(childNodeId) {
          node.descendantNodeCount++;
          var childNode = fileContents[childNodeId];
          if (checkedNodes.indexOf(childNodeId) == -1 && childNode.type >= 0 && childNode.type <= 2) {
            setDescendantData(childNode, loopLevel);
            node.readDataSize += childNode.readDataSize;
            node.writeDataSize += childNode.writeDataSize;
            if(childNode.type == 0 || childNode.type == 2){
              node.readPhaseLineNumbers = _.union(node.readPhaseLineNumbers, childNode.readPhaseLineNumbers);
              node.writePhaseLineNumbers = _.union(node.writePhaseLineNumbers, childNode.writePhaseLineNumbers);
            }
            node.descendantNodeCount += childNode.descendantNodeCount;
          }
        });
      }
    }

    /**
     * Helper function: updates the id and lines of the given dependency to single numbers
     */
    function updateDependencyData(dependency) {
      dependency.cu = nodeMap[dependency.CUid];
      delete dependency.CUid;
      dependency.sinkLine = parseInt(dependency.sinkLine.split(':')[1]);
      dependency.sourceLine = parseInt(dependency.sourceLine.split(':')[1]);
    }


    // ----- Set file-mapping -----
    for (i = 0; i < fileLines.length; i++) {
      fileLine = fileLines[i].split('\t');
      if (fileLine.length == 2) {
        try{
			fileContents = fs.readFileSync(fileLine[1].trim(), "utf-8");
			fileMaps.push({
				path: fileLine[1].trim(),
				content: fileContents
			});
			fileIdMap[fileLine[0]] = i;
		}catch(err){
			console.error(err + "\n");
		}
      }
    }

    //  ----- Set node-data -----
    fileContents = JSON.parse(fs.readFileSync(nodeFilePath));

    // Initialize counter-variables
    var nodeCount = 0;
    var cuCount = 0;
    var functionCount = 0;
    var loopCount = 0;
    var libraryFunctionCount = 0;

    // Add all initial nodes and set dataSize
    // change id to single number
    for (i = 0; i < fileContents.length; i++) {
	  node = fileContents[i];
	  if(node.type < 0 || node.type > 3){
		console.error("\nError: Invalid type for node " + node.id);
		fileContents.splice(i, 1);
		--i;
		continue;
	  }
      node.parentNodes = [];
      node.descendantNodeCount = 0;
      if (node.type == 0) {
        node.predecessorCUs = [];
        node.functionCalls = node.functionCall;
        delete node.functionCall;
        node.lines = [];
        _.each(node.instructionsLineNumbers, function(line){
        	node.lines.push(parseInt(line.split(':')[1]));
        });
        delete node.instructionsLineNumbers;
      } else {
        node.readDataSize = 0;
        node.writeDataSize = 0;
        node.readPhaseLineNumbers = [];
        node.writePhaseLineNumbers = [];
      }
      nodeCount++;
      switch (node.type) {
        case 0:
          cuCount++;
          node.localVariables = node.localVariableNames || [];
          node.globalVariables = node.globalVariableNames || [];
          delete node.localVariableNames;
          delete node.globalVariableNames;
          break;
        case 1:
          functionCount++;
          node.functionArguments = node.funcArguments || [];
          delete node.funcArguments;
          functionNodes.push(node);
          break;
        case 2:
          loopCount++;
          break;
        case 3:
          libraryFunctionCount++;
          break;
        default:
          nodeCount++;
      }
	  
	  node.fileId = fileIdMap[node.id.split(':')[0]];
	  
	  if(typeof node.fileId == "undefined"){
		console.error("Error: No file was found with ID: " + node.id.split(':')[0] + " in FileMapping. (File-ID taken from split of Node-ID " + node.id + " by ':')");
		errors = true;
	  }
	  
	  
      nodeMap[node.id] = i;
      node.id = i;
      node.startLine = parseInt(node.start.split(':')[1]);
      node.endLine = parseInt(node.end.split(':')[1]);
      delete node.start;
      delete node.end;
    };
	
	originalNodeIdMap = [];
	
	_.each(nodeMap, function(val, key){
		originalNodeIdMap[val] = key;
	});

    // Add parentNodes and predecessorCUs properties to nodes
    _.each(fileContents, function(node) {
      for (i = 0; i < node.childrenNodes.length; i++) {
        childNodeId = nodeMap[node.childrenNodes[i]];

        // Add missing library functions
        if (typeof childNodeId === 'undefined') {
		  console.info("\nNode " + originalNodeIdMap[node.id] + " has a childNode which does not exist ("+node.childrenNodes[i]+"). Adding it manually as a Library Function");
          childNodeId = fileContents.length;
          fileContents.push({
            id: childNodeId,
            type: 3,
            name: 'Library Function',
            parentNodes: [],
            childrenNodes: []
          });
          nodeMap[node.childrenNodes[i]] = childNodeId;

        }
        // Update id of childNode
        node.childrenNodes[i] = childNodeId;
        // Add this node to childrens parentNodes
        fileContents[childNodeId].parentNodes.push(node.id);
      }

      if (node.type == 0) {
        // Update successor ids and set predecessors
        for (i = 0; i < node.successorCUs.length; i++) {
          childNodeId = nodeMap[node.successorCUs[i]];
          node.successorCUs[i] = childNodeId;
          
		  try{
			  fileContents[childNodeId].predecessorCUs.push(node.id);
		  }catch(error){
			  console.error("\nError: could not add node " + originalNodeIdMap[node.id] + " to predecessorCUs of " + originalNodeIdMap[childNodeId]);
			  console.error(error);
			  console.info("Removing " + originalNodeIdMap[childNodeId] + " from successorCUs of " + originalNodeIdMap[node.id]);
			  node.successorCUs.splice(i, 1);
			  --i;
			  errors = true;
			}
        }

        // Update ids and lines for dependencies
        for (i = 0; i < node.RAWDepsOn.length; i++) {
          updateDependencyData(node.RAWDepsOn[i]);
        }
        for (i = 0; i < node.WARDepsOn.length; i++) {
          updateDependencyData(node.WARDepsOn[i]);
        }
        for (i = 0; i < node.WAWDepsOn.length; i++) {
          updateDependencyData(node.WAWDepsOn[i]);
        }

        // Update write and read-phase line numbers
        for (i = 0; i < node.readPhaseLineNumbers.length; i++) {
          node.readPhaseLineNumbers[i] = parseInt(node.readPhaseLineNumbers[i].split(':')[1]);
        }
        for (i = 0; i < node.writePhaseLineNumbers.length; i++) {
          node.writePhaseLineNumbers[i] = parseInt(node.writePhaseLineNumbers[i].split(':')[1]);
        }

        for (i = 0; i < node.functionCalls.length; i++) {
          functionCall = node.functionCalls[i];
          functionCall.line = parseInt(functionCall.atLine.split(':')[1]);
          functionCall.function = nodeMap[functionCall.funcId];
          delete functionCall.atLine;
          delete functionCall.funcId;
        }
      }
    });

    // Find root nodes and set descendant data (loop level, read/write datasize, descendantNodeCount)
    _.each(functionNodes, function(node) {
      if (!node.parentNodes.length) {
        rootNodes.push(node.id);
        setDescendantData(node, 0);
      }
    });
	
	if(!rootNodes.length){
		console.error("\nError: Could not find any root nodes. Likely due to broken successorCU values.");
	}

    // get max/min-CuDataSize
    _.each(fileContents, function(node) {
      if (node.type < 3) {
        maxCuDataSize = Math.max(maxCuDataSize, (node.readDataSize + node.writeDataSize));
        minCuDataSize = Math.min(maxCuDataSize, (node.readDataSize + node.writeDataSize));
      }
    });

    // get medium data-size for computing heat factor
    midCuDataSize = (maxCuDataSize - minCuDataSize) / 2;

    // get compute and set heatFactor
    _.each(fileContents, function(node) {
      node.heatFactor = Math.min(1, ((node.readDataSize + node.writeDataSize) / 2) / midCuDataSize);
    });
    var end = new Date().getTime();
    var time = end - start;
    console.log('Resulting dataset size: ' + sizeof.sizeof(fileContents, true));
    console.log('#Nodes: ' + nodeCount + ', #CUs: ' + cuCount + ', #Functions: ' + functionCount + ', #Loops: ' + loopCount + ', #LibFuncs: ' + libraryFunctionCount);
    console.log('Time elapsed: ', time);
	
	if(errors){
		return false;
	}
	
	return {
      fileMapping: fileMaps,
      nodeData: fileContents,
      rootNodes: rootNodes,
	  nodeMap: originalNodeIdMap
    };
  }
};
