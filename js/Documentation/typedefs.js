/**
 * The ID of a node: a string with the format "x:y", where x is the file-id and y is the node-id
 * @typedef {string}  nodeId
 *
 */

/**
 * A line of a file: a string with the format "x:y", where x is the file-id and y is line-number
 * @typedef {string}  fileLine
 *
 */

/**
 *	A DiscoPoP Dependency
 *	@typedef  {Object}   JsonDependency
 *	@property {nodeId}   CUid        The id of the CU on which there is a dependency
 *	@property {fileLine} sinkLine    The line of the sink of the dependency
 *	@property {fileLine} sourceLine  The line of the source of the dependency
 *	@property {string}   varName     The name of the variable causing the dependency
 */

/**
 * A DiscoPoP Variable
 * @typedef   {Object}  JsonVariable
 * @property  {string}  type  The type of the variable
 * @property  {string}  name  The name of the variable
 */

/**
 * A DiscoPoP Function-Call
 * @typedef   {Object}    JsonFunctionCall
 * @property  {fileLine}  atLine  The line on which the function is called
 * @property  {nodeId}    funcId  The id of the node of the function being called
 */

/**
 * A DiscoPoP node in JSON format
 * @typedef Node
 * @type {(JsonCuNode|JsonFunctionNode|JsonLoopNode|JsonLibraryFunctionNode|JsonCustomNode)}
 */

/**
 * An object for adding a node to the graph with custom settings
 * @typedef   {Object}  CustomNode
 * @property  {string}  label     The text that will be displayed in the node
 * @property  {string}  nodeClass The class that will be given to the node's DOM-element
 * @property  {string}  shape     The shape that the node will be redered with (rect, ellipse, circle, hexagon and diamond are possible)
 * @property  {number}  type      The type of the node (always -1)
 */

/**
 * A DiscoPoP Computational-Unit node in JSON format
 * @typedef   {Object} JsonCuNode
 * @property  {nodeId}                                id                        The id of the node
 * @property  {number}                                type                      The type of the Node (always 0)
 * @property  {fileLine}                              start                     The first line of the CU's code-section
 * @property  {fileLine}                              end                       The last line of the CU's code-section
 * @property  {Node[]}  childrenNodes             The nodes which are children of this CU (ids of the function-nodes being called)
 * @property  {Node[]}             parentNodes               The nodes of which this CU is a child (array with a single function or loop node id)
 * @property  {number}                                readDataSize              The amount of Bytes read in the CU
 * @property  {number}                                writeDataSize             The amount of Bytes written in the CU
 * @property  {CuNode[]}                              successorCUs              The CUs succeeding this one
 * @property  {CuNode[]}                              predecessorCUs            The CUs preceeding this one
 * @property  {string}                                basicBlockName            The name of the basic block of the CU
 * @property  {fileLine[]}                            instructionsLineNumbers   The lines of instructions of the CU
 * @property  {fileLine[]}                            readPhaseLineNumbers      The lines on which a read occurs within the CU
 * @property  {fileLine[]}                            writePhaseLineNumbers     The lines on which a write occurs within the CU
 * @property  {Variable[]}                            localVariableNames        The variables accessed locally by the CU
 * @property  {Variable[]}                            globalVariableNames       The variables accessed globally by the CU
 * @property  {FunctionCall[]}                        functionCall              The calls to functions from within the CU
 * @property  {Dependency[]}                          RAWDepsOn                 The Read-After-Write dependencies of the CU
 * @property  {Dependency[]}                          WARDepsOn                 The Write-After-Read dependencies of the CU
 * @property  {Dependency[]}                          WAWDepsOn                 The Write-After-Write dependencies of the CU
 * @property  {number}                                heatFactor                The node's heat in relation to all other nodes
 */

/**
 * A DiscoPoP Function node in JSON format
 * @typedef   {Object}  JsonFunctionNode
 * @property  {nodeId}              id              The id of the node
 * @property  {number}              type            The type of the Node (always 1)
 * @property  {fileLine}            start           The first line of the function's code-section
 * @property  {fileLine}            end             The last line of the function's code-section
 * @property  {string}              name            The name of the function
 * @property  {Node[]} childrenNodes   The nodes which are children of this function
 * @property  {CuNode[]}            parentNodes     The nodes of which this function is a child (empty if main or root-node, CU's calling the function otherwise)
 * @property  {Variable[]}          funcArguments   The arguments of the function
 * @property  {number}              heatFactor      The node's heat in relation to all other nodes
 */

/**
 * A DiscoPoP Loop node in JSON format
 * @typedef   {Object}  JsonLoopNode
 * @property  {nodeId}                      id              The id of the node
 * @property  {number}                      type            The type of the node (always 2)
 * @property  {fileLine}                    start           The first line of the loop's code-section
 * @property  {fileLine}                    end             The last line of the loop's code-section
 * @property  {Node[]}         childrenNodes   The nodes which are children of this loop
 * @property  {Node[]}   parentNodes     The nodes of which this loop is a child (a single function node id)
 * @property  {number}                      loopLevel       The nested-level of the loop (within other loops)
 * @property  {number}                      heatFactor      The node's heat in relation to all other nodes
 */

/**
 * A DiscoPoP Library-Function node in JSON format
 * @typedef   {Object}  JsonLibraryFunctionNode
 * @property  {nodeId}      id              The id of the node
 * @property  {number}      type            The type of the node (always 3)
 * @property  {string}      name            The name of the library-function
 * @property  {CuNode[]}    parentNodes     The CU nodes that call the function
 * @property  {Variable[]}  funcArguments   The arguments of the function
 */

/**
 * A DiscoPoP File-Map in JSON format
 * @typedef  {Object}  JsonFileMap
 * @property {string} path      The full path to the file
 * @property {string} contents  The contents of the file
 */

/**
 * DiscoPoP's output data in JSON format
 * @typedef   {Object}  DiscoPopData
 * @property  {JsonFileMap[]}       fileMapping   An object containing the File-Mapping output by DiscoPoP
 * @property  {JsonNode[]}      data          An extended version of DiscoPoP's output node-data object
 * @property  {number[]}  rootNodes           The id's of the graph's root function-nodes (to be displayed initially)
 */
