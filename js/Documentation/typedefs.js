/**
 *	A DiscoPoP Dependency
 *	@typedef  {Object}   JsonDependency
 *	@property {Number}   cu        The id of the CU on which there is a dependency
 *	@property {Number}   sinkLine    The line of the sink of the dependency
 *	@property {Number}   sourceLine  The line of the source of the dependency
 *	@property {String}   varName     The name of the variable causing the dependency
 */

/**
 * A DiscoPoP Variable
 * @typedef   {Object}  JsonVariable
 * @property  {String}  type  The type of the variable
 * @property  {String}  name  The name of the variable
 */

/**
 * A DiscoPoP Function-Call
 * @typedef   {Object}  JsonFunctionCall
 * @property  {Number}  line      The line on which the function is called
 * @property  {Number}  function  The id of the node of the function being called
 */

/**
 * A DiscoPoP node in JSON format
 * @typedef Node
 * @type {(JsonCuNode|JsonFunctionNode|JsonLoopNode|JsonLibraryFunctionNode)}
 */

/**
 * A DiscoPoP Computational-Unit node in JSON format
 * @typedef   {Object}          JsonCuNode
 * @property  {Number}          id                        The id of the node
 * @property  {Number}          fileId                    File-ID of the node
 * @property  {Number}          type                      The type of the Node (always 0)
 * @property  {Number}          startLine                 The first line of the CU's code-section
 * @property  {Number}          endLine                   The last line of the CU's code-section
 * @property  {Number[]}        childrenNodes             The nodes which are children of this CU (ids of the function-nodes being called)
 * @property  {Number[]}        parentNodes               The nodes of which this CU is a child (array with a single function or loop node id)
 * @property  {Number}          readDataSize              The amount of Bytes read in the CU
 * @property  {Number}          writeDataSize             The amount of Bytes written in the CU
 * @property  {Number[]}        successorCUs              The CUs succeeding this one
 * @property  {Number[]}        predecessorCUs            The CUs preceeding this one
 * @property  {String}          basicBlockName            The name of the basic block of the CU
 * @property  {Number[]}        instructionsLineNumbers   The lines of instructions of the CU
 * @property  {Number[]}        readPhaseLineNumbers      The lines on which a read occurs within the CU
 * @property  {Number[]}        writePhaseLineNumbers     The lines on which a write occurs within the CU
 * @property  {Variable[]}      localVariables            The variables accessed locally by the CU
 * @property  {Variable[]}      globalVariables           The variables accessed globally by the CU
 * @property  {FunctionCall[]}  functionCalls             The calls to functions from within the CU
 * @property  {Dependency[]}    RAWDepsOn                 The Read-After-Write dependencies of the CU
 * @property  {Dependency[]}    WARDepsOn                 The Write-After-Read dependencies of the CU
 * @property  {Dependency[]}    WAWDepsOn                 The Write-After-Write dependencies of the CU
 * @property  {Number}          heatFactor                The node's heat in relation to all other nodes
 */

/**
 * A DiscoPoP Function node in JSON format
 * @typedef   {Object}  JsonFunctionNode
 * @property  {Number}      id                    The id of the node
 * @property  {Number}      fileId                File-ID of the node
 * @property  {Number}      type                  The type of the Node (always 1)
 * @property  {Number}      start                 The first line of the function's code-section
 * @property  {Number}      end                   The last line of the function's code-section
 * @property  {Number[]}    writePhaseLineNumbers The lines on which a write occurs within the node
 * @property  {Number[]}    readPhaseLineNumbers  The lines on which a read occurs within the node
 * @property  {Number}      readDataSize          The amount of Bytes read in the node
 * @property  {Number}      writeDataSize         The amount of Bytes written in the node
 * @property  {Number}      descendantNodeCount   The amount of nodes that are descendants of this one
 * @property  {String}      name                  The name of the function
 * @property  {Number[]}    childrenNodes         The nodes which are children of this function
 * @property  {Number[]}    parentNodes           The nodes of which this function is a child (empty if main or root-node, CU's calling the function otherwise)
 * @property  {Variable[]}  funcArguments         The arguments of the function
 * @property  {Number}      heatFactor            The node's heat in relation to all other nodes
 */

/**
 * A DiscoPoP Loop node in JSON format
 * @typedef   {Object}    JsonLoopNode
 * @property  {Number}    id                    The id of the node
 * @property  {Number}    fileId                File-ID of the node
 * @property  {Number}    type                  The type of the node (always 2)
 * @property  {Number}    startLine             The first line of the loop's code-section
 * @property  {Number}    endLine               The last line of the loop's code-section
 * @property  {Number[]}  writePhaseLineNumbers The lines on which a write occurs within the node
 * @property  {Number[]}  readPhaseLineNumbers  The lines on which a read occurs within the node
 * @property  {Number}    readDataSize          The amount of Bytes read in the node
 * @property  {Number}    writeDataSize         The amount of Bytes written in the node
 * @property  {Number}    descendantNodeCount   The amount of nodes that are descendants of this one
 * @property  {Node[]}    childrenNodes         The nodes which are children of this loop
 * @property  {Node[]}    parentNodes           The nodes of which this loop is a child (a single function node id)
 * @property  {Number}    loopLevel             The nested-level of the loop (within other loops)
 * @property  {Number}    heatFactor            The node's heat in relation to all other nodes
 */

/**
 * A DiscoPoP Library-Function node in JSON format
 * @typedef   {Object}      JsonLibraryFunctionNode
 * @property  {Number}      id              The id of the node
 * @property  {Number}      fileId          File-ID of the node
 * @property  {Number}      type            The type of the node (always 3)
 * @property  {String}      name            The name of the library-function
 * @property  {Number[]}    parentNodes     The id's of the nodes nodes that call the function (always CU's)
 * @property  {Variable[]}  funcArguments   The arguments of the function
 */

/**
 * A DiscoPoP File-Map in JSON format
 * @typedef  {Object} JsonFileMap
 * @property {String} path      The full path to the file
 * @property {String} contents  The contents of the file
 */

/**
 * DiscoPoP's output data in JSON format
 * @typedef   {Object}          DiscoPopData
 * @property  {JsonFileMap[]}   fileMapping   An object containing the File-Mapping output by DiscoPoP
 * @property  {JsonNode[]}      data          An extended version of DiscoPoP's output node-data object
 * @property  {Number[]}        rootNodes     The id's of the graph's root function-nodes (to be displayed initially)
 */
