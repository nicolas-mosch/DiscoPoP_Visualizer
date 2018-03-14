const
ipc = require("electron").ipcRenderer;
var _ = require('lodash/core');
var d3 = require('d3');
var $ = global.jQuery = window.$ = require('jquery');
// Hack to fix outdated libraries accessing outdated ui property
window.$.ui = require('jquery-ui');

require('bootstrap');
var BootstrapMenu = require('bootstrap-menu');
var Handlebars = require('handlebars');
var EditorController = require('../js/controllers/editor');
var dataInitializer = require('../js/general/data-initializer');
var generalFunctions = require('../js/general/generalFunctions');
var configuration = require('../js/general/configuration');
var currentZoom;
var nodeData, fileMaps, fileNodeIntervalTrees;
var editorController;
var zoom;
var init = false;
var originalNodeIdMap;
ipc.on('alert', function(event, message) {
	alert(message);
});

ipc.on('clearGraph', function(event, message) {
	clearGraph();
});

/**
 * Loads the required data TODO: test without loading data client-side (fetch
 * everything from backend)
 */
ipc.on('load-data', function(event, data) {
	fileNodeIntervalTrees = dataInitializer.prepareData(data, true);
	nodeData = data.nodeData;
	fileMaps = data.fileMapping;
	editorController = new EditorController(fileMaps);
	originalNodeIdMap = data.nodeMap;
});

/**
 * Receives a string containing the html-markup (as svg) of the new graph to be
 * rendered
 */
ipc.on('update-graph', function(event, svg) {
	$("#flow-graph-container").html(svg);
	var svg = d3.select("#flow-graph-container svg");
	var inner = d3.select("#graph0");
	var currentScale, currentTranslate;
	
	if(init){
		currentScale = zoom.scale();
		currentTranslate = zoom.translate();
	}

	// set zoom
	zoom = d3.behavior.zoom().on(
			"zoom",
			function(panToNode) {
				inner.attr("transform", "translate(" + d3.event.translate + ")"
						+ "scale(" + d3.event.scale + ")");
			});
	svg.call(zoom);
	// Remove native doubleclick zoom
	svg.on("dblclick.zoom", null);

	if(init){
		svg.transition().duration(0)
		.call(zoom.translate(currentTranslate)
		.scale(currentScale).event);
	}
	
	
	colorGraph(inner);
	colorGraph(d3.select("#legend-graph"));
	
	init = true;
});

/**
 * Set the colors of the graph's elements
 */
function colorGraph(inner) {

	inner.selectAll('g.cu-node:not(.selected-node) polygon').style("fill",
			configuration.readSetting('cuColorFill'));
	$(".cu-node-label").css("color", configuration.readSetting('cuColorLabel'));

	inner.selectAll('g.function-node:not(.selected-node) polygon').style(
			"fill", configuration.readSetting('functionColorFill'));
	$(".function-node-label").css("color",
			configuration.readSetting('functionColorLabel'));

	inner.selectAll('g.loop-node:not(.selected-node) polygon').style("fill",
			configuration.readSetting('loopColorFill'));
	inner.selectAll('g.loop-node:not(.selected-node) ellipse').style("fill",
			configuration.readSetting('loopColorFill'));
	$(".loop-node-label").css("color",
			configuration.readSetting('loopColorLabel'));

	inner.selectAll('g.library-function-node:not(.selected-node) polygon')
			.style("fill",
					configuration.readSetting('libraryFunctionColorFill'));
	$(".library-function-node-label").css("color",
			configuration.readSetting('libraryFunctionColorLabel'));

	inner.selectAll('g.default-node:not(.selected-node) polygon').style("fill",
			configuration.readSetting('defaultColorFill'));
	$(".default-node-label").css("color",
			configuration.readSetting('defaultColorLabel'));

	inner.selectAll('g.selected-node polygon').style("fill",
			configuration.readSetting('selectedNodeColorFill'));
	inner.selectAll('g.selected-node ellipse').style("fill",
			configuration.readSetting('selectedNodeColorFill'));
	$(".selected-node-label").css("color",
			configuration.readSetting('selectedNodeColorLabel'));

	// Edges
	inner.selectAll('g.flow-edge path').style("stroke",
			configuration.readSetting('flowEdgeFill')).style("stroke-width",
			configuration.readSetting('flowEdgeWidth'));
	inner.selectAll('g.flow-edge polygon').style("stroke",
			configuration.readSetting('flowEdgeFill')).style("fill",
			configuration.readSetting('flowEdgeWidth'));
	inner.selectAll('g.dependency-edge path').style("stroke",
			configuration.readSetting('dependencyEdgeFill')).style(
			"stroke-width", configuration.readSetting('dependencyEdgeWidth'));
	inner.selectAll('g.dependency-edge polygon').style("stroke",
			configuration.readSetting('dependencyEdgeFill')).style("fill",
			configuration.readSetting('dependencyEdgeWidth'));
	inner.selectAll('g.function-call-edge path').style("stroke",
			configuration.readSetting('functionCallEdgeFill')).style(
			"stroke-width", configuration.readSetting('functionCallEdgeWidth'));
	inner.selectAll('g.function-call-edge polygon').style("stroke",
			configuration.readSetting('functionCallEdgeFill')).style("fill",
			configuration.readSetting('functionCallEdgeWidth'));
}

// initialize the event-listeners
ipc
		.on(
				'init-listeners',
				function(event) {
					/**
					 * Misc click behavior
					 */
					// Node-Info
					$("#node-info-button")
							.on(
									'click',
									function() {
										$("#node-info-container")
												.slideToggle(
														"medium",
														function() {
															if ($(
																	"#node-info-container")
																	.is(
																			":hidden")) {
																$(
																		'#node-info-collapse-icon')
																		.removeClass(
																				'glyphicon-collapse-up');
																$(
																		'#node-info-collapse-icon')
																		.addClass(
																				'glyphicon-collapse-down');
															} else {
																$(
																		'#node-info-collapse-icon')
																		.removeClass(
																				'glyphicon-collapse-down');
																$(
																		'#node-info-collapse-icon')
																		.addClass(
																				'glyphicon-collapse-up');
															}
														});
									});
					// Reset-View
					$("#reset-graph-button").on('click', function() {
						ipc.send('resetGraph');
					});

					// Legend
					$("#show-legend-button").on('click', function() {
						$("#legend-table").slideToggle("medium", function() {

						});
					});

					// Select a file from file-tree
					$('#file-select-container').on("changed.jstree",
							function(e, data) {
								if (data.node.type == "file") {
									editorController.displayFile(data.node.id);
									$('#code-container-tab').trigger('click');
									editorController.unhighlight();
								}
							});

					/**
					 * Graph click behavior
					 */
					var graphContainer = $("#graph-container");

					// Node selection
					graphContainer
							.delegate(
									'g.node, g.cluster',
									'click',
									function(e) {
										e.stopImmediatePropagation();
										var node = nodeData[this.id];

										// Highlight/Unhighlight
										if ($(this).hasClass('selected-node')) {
											$('g.selected-node').removeClass(
													'selected-node');
											colorGraph(d3.select('#graph0'));
											return;
										}
										$('g.selected-node').removeClass(
												'selected-node');
										editorController.unhighlight();
										editorController
												.highlightNodeInCode(node);
										highlightGraphNode($(this));

										// Create Node-Info Table
										var type;
										switch (node.type) {
										case 0:
											type = "Computational-Unit";
											break;
										case 1:
											type = "Function";
											break;
										case 2:
											type = "Loop";
											break;
										case 3:
											type = "Library-Function";
											break;
										default:
											type = "undefined";
										}
										var data = {
											id: node.id,
											originalID: originalNodeIdMap[node.id],
											file : fileMaps[node.fileId].fileName,
											lines : node.startLine + ' - '
													+ node.endLine,
											type : type
										}

										// Create Dependencies-Table
										var cuDependencies = [];
										if (!node.type) {
											data.read = generalFunctions
													.humanFileSize(
															node.readDataSize,
															true);
											data.write = generalFunctions
													.humanFileSize(
															node.writeDataSize,
															true);
											// add dependencies to template
											// (true: read, false: write)
											_
													.each(
															node.dependencies,
															function(dependency) {
																cuDependencies
																		.push({
																			sourceRead : dependency
																					.isWaR(),
																			sinkRead : dependency
																					.isRaW(),
																			sourceFile : node.fileId,
																			sinkFile : dependency.cuNode.fileId,
																			varName : dependency.variableName,
																			sourceLine : dependency.sourceLine,
																			sinkLine : dependency.sinkLine
																		});
															});
										}

										if (_.has(node, 'funcArguments')) {
											data.arguments = "";
											_
													.each(
															node.functionArguments,
															function(variable) {
																data.arguments += variable.name
																		+ ' ('
																		+ variable.type
																		+ '), ';
															});
										}
										if (node.type == 1 || node.type == 3) {
											data.name = node.name;
										}
										if (node.type == 2) {
											data.Loop_Level = node.level;
										}

										// Update node info table
										$("#node-info-available-icon").css(
												'color', '	#00FF00');
										var template = Handlebars
												.compile(document
														.getElementById('cuInfoTableTemplate').innerHTML);
										var nodeInfoData = {
											nodeData : data,
											dependencies : cuDependencies,
											localVariables : node.localVariables,
											globalVariables : node.globalVariables,
											hasVariables : !node.type
										};
										var nodeDataTable = template(nodeInfoData);

										$("#node-info-container").html(
												nodeDataTable);
										$('#code-container-tab').trigger(
												'click');
									});

					// Click on variable-links
					graphContainer.delegate('.link-to-line', 'click',
							function() {
								var line = $(this).data('file-line');
								var fileId = $(this).data('file-id');
								$('#code-container-tab').trigger('click');
								editorController.displayFile(fileId);
								editorController.unhighlight();
								editorController.highlightLine(line);
							});

					// Double click events
					graphContainer.delegate('g.node', 'dblclick', function(
							event) {
						event.stopImmediatePropagation();
						var node = nodeData[this.id];
						var cuNodes, loopNodes, functionNodes;

						if (node.children.length) {
							ipc.send('expandNode', node.id);
						}
					});

					graphContainer
							.delegate(
									'g.cluster',
									'click',
									function() {
										editorController.unhighlight();
										editorController
												.highlightNodeInCode(nodeData[this.id]);
									});

					// tooltip (hover) events
					var tooltip = d3.select('#tooltip-container');
					var node, file;
					graphContainer.delegate('g.cluster', 'mouseover',
							function() {
								node = nodeData[this.id];
								file = fileMaps[node.fileId].fileName;
								if (node.type == 1) {
									$('#tooltip-container').html(
											'&#8618; <label style="font-weight: bold;">'
													+ node.name
													+ '</label><br>' + file);
								} else if (node.type == 2) {
									$('#tooltip-container').html(
											'&#8635; (' + node.startLine + '-'
													+ node.endLine + ')<br>'
													+ file + '<br>Level: '
													+ node.level);
								} else {
									return;
								}
								tooltip.style("visibility", "visible");
							});
					graphContainer.delegate('g.cluster', 'mousemove', function(
							event) {
						return tooltip.style("top", (event.pageY - 10) + "px")
								.style("left", (event.pageX + 20) + "px");
					});
					graphContainer.delegate('g.cluster', 'mouseout',
							function() {
								return tooltip.style("visibility", "hidden");
							});

					/**
					 * Graph right-click (contextmenu) behavior
					 */

					// Function for fetching the node being right-clicked on
					function fetchNodeData($nodeElem) {
						var nodeId = $nodeElem[0].id;
						return nodeData[nodeId];
					}
					;

					function toggleGraphDependencies(node) {
						ipc.send('toggleDependencyEdges', node.id);
					}

					// Contextmenu for CU-nodes
					var cuNodeMenu = new BootstrapMenu(
							'.node.cu-node',
							{
								fetchElementData : fetchNodeData,
								actions : [
										{
											name : function(node) {
												if (node.type == 0) {
													var dependencyCount = node.dependencies.length;
													if (dependencyCount > 0) {
														return 'Toggle Dependencies  <span class="badge">'
																+ dependencyCount
																+ '</span>';
													} else {
														return '<i>Toggle Dependencies  <span class="badge">0</span></i>';
													}
												}
											},
											iconClass : 'glyphicon glyphicon-retweet',
											onClick : toggleGraphDependencies,
											classNames : function(node) {
												var hasDependencies = node.type == 0
														&& (node.dependencies.length > 0);
												return {
													'action-success' : hasDependencies
												};
											},
											isEnabled : function(node) {
												var hasDependencies = node.type == 0
														&& (node.dependencies.length > 0);
												return hasDependencies;
											}
										},
										{
											name : function(node) {
												if (node.children.length) {
													return 'Toggle Called Functions <span class="badge">'
															+ node.children.length
															+ '</span>';
												} else {
													return '<i>Toggle Called Functions</i> <span class="badge">0</span></i>';
												}
											},
											iconClass : 'glyphicon glyphicon-expand',
											onClick : function(node) {
												ipc.send('toggleFunctionCalls',
														node.id);
											},
											classNames : function(node) {
												return {
													'action-success' : (node.children.length > 0)
												};
											},
											isEnabled : function(node) {
												return (node.children.length > 0);
											}
										} ]
							});

					// Contextmenu object for non-expanded function and loop
					// nodes
					var clusterNodeMenu = {
						fetchElementData : fetchNodeData,
						actions : [
								{
									name : function(node) {
										if (node.children.length) {
											return 'Expand';
										} else {
											return '<i>Expand</i>';
										}
									},
									iconClass : 'glyphicon glyphicon-expand',
									onClick : function(node) {
										ipc.send('expandNode', node.id);
									},
									classNames : function(node) {
										return {
											'action-success' : (node.children.length > 0)
										};
									},
									isEnabled : function(node) {
										return (node.children.length > 0);
									}
								},
								{
									name : function(node) {
										if (node.children.length) {
											return 'Expand All  <span class="badge">'
													+ node.descendantNodeCount
													+ '</span>';
										} else {
											return '<i>Expand All</i>';
										}
									},
									iconClass : 'glyphicon glyphicon-expand',
									onClick : function(node) {
										ipc.send('expandAll', node.id);
									},
									classNames : function(node) {
										return {
											'action-success' : (node.children.length > 0)
										};
									},
									isEnabled : function(node) {
										return (node.children.length > 0);
									}
								} ]
					};

					var loopNodeMenu = new BootstrapMenu('.loop-node',
							clusterNodeMenu);
					var functionNodeMenu = new BootstrapMenu('.function-node',
							clusterNodeMenu);

					// Contextmenu for expanded function and loop nodes
					var expandedNodeMenu = new BootstrapMenu('.cluster', {
						fetchElementData : fetchNodeData,
						actions : [ {
							name : 'Collapse',
							iconClass : 'glyphicon glyphicon-collapse-up',
							onClick : function(node) {
								ipc.send('collapseNode', node.id);
							}
						}, {
							name : 'Toggle Dependencies',
							iconClass : 'glyphicon glyphicon-retweet',
							onClick : toggleGraphDependencies
						} ]
					});

					// Contextmenu for the code-viewer
					var codeMenu = new BootstrapMenu(
							'#code-container #ace-editor',
							{
								// menuEvent: 'click',
								fetchElementData : function() {
									try {
										var line = editorController
												.getCursorRow() + 1;
										var nodes = fileNodeIntervalTrees[editorController
												.getCurrentFileID()].findAll(
												line, line);
										console.log('overlapping nodes', nodes);
										for (var i = 0; i < nodes.length; i++) {
											if (nodes[i].lines.indexOf(line) > -1) {
												console.log(nodes[i]);
												return nodes[i];
											}
										}
										return null;
									} catch (err) {
										console.error(err);
										console.error('fileNodeIntervalTrees',
												fileNodeIntervalTrees);
										console.error(editorController
												.getCurrentFileID());
									}
									return node;
								},
								actions : [ {
									name : 'Show CU',
									isEnabled : function(node) {
										return (node != null);
									},
									onClick : function(node) {
										ipc.send('expandTo', node.id);
										$('g.node#' + node.id).trigger('click');
									}
								} ]
							});

				});

function highlightGraphNode(node) {
	console.log('higlighting', nodeData[node.attr("id")]);
	node.addClass('selected-node');
	colorGraph(d3.select('#graph0'));
}
