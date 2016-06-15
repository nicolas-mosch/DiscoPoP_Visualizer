var ipc = require("electron").ipcRenderer;
var $ = require('jquery');
global.jQuery = require('jquery');
window.$ = $;
require('bootstrap');
var colorpicker = require('bootstrap-colorpicker');
var configuration = require('../js/general/configuration');
var Handlebars = require('handlebars');

$(document).ready(function() {

  var nodeColorData = [{
    name: 'Computational Unit',
    fillColor: {
      id: 'cuColorFill',
      color: configuration.readSetting('cuColorFill')
    },
    labelColor: {
      id: 'cuColorLabel',
      color: configuration.readSetting('cuColorLabel')
    }
  }, {
    name: 'Function',
    fillColor: {
      id: 'functionColorFill',
      color: configuration.readSetting('functionColorFill')
    },
    labelColor: {
      id: 'functionColorLabel',
      color: configuration.readSetting('functionColorLabel')
    }
  }, {
    name: 'Loop',
    fillColor: {
      id: 'loopColorFill',
      color: configuration.readSetting('loopColorFill')
    },
    labelColor: {
      id: 'loopColorLabel',
      color: configuration.readSetting('loopColorLabel')
    }
  }, {
    name: 'Library-Function',
    fillColor: {
      id: 'libraryFunctionColorFill',
      color: configuration.readSetting('libraryFunctionColorFill')
    },
    labelColor: {
      id: 'libraryFunctionColorLabel',
      color: configuration.readSetting('libraryFunctionColorLabel')
    }
  }, {
    name: 'Other',
    fillColor: {
      id: 'defaultColorFill',
      color: configuration.readSetting('defaultColorFill')
    },
    labelColor: {
      id: 'defaultColorLabel',
      color: configuration.readSetting('defaultColorLabel')
    }
  }, {
    name: 'Selected Node',
    fillColor: {
      id: 'selectedNodeColorFill',
      color: configuration.readSetting('selectedNodeColorFill')
    },
    labelColor: {
      id: 'selectedNodeColorLabel',
      color: configuration.readSetting('selectedNodeColorLabel')
    }
  }];

  var edgeColorData = [{
    id: 'flowEdge',
    name: 'Data-Flow',
    color: configuration.readSetting('flowEdgeFill'),
    width: configuration.readSetting('flowEdgeWidth')
  }, {
    id: 'dependencyEdge',
    name: 'Dependency',
    color: configuration.readSetting('dependencyEdgeFill'),
    width: configuration.readSetting('dependencyEdgeWidth')
  }, {
    id: 'functionCallEdge',
    name: 'Function-Call',
    color: configuration.readSetting('functionCallEdgeFill'),
    width: configuration.readSetting('functionCallEdgeWidth')
  }];

  var nodeColorTemplate = Handlebars.compile(document.getElementById('nodeColorSettingsTableTemplate').innerHTML);
  var edgeColorTemplate = Handlebars.compile(document.getElementById('edgeColorSettingsTableTemplate').innerHTML);
  var otherTemplate = Handlebars.compile(document.getElementById('otherSettingsTableTemplate').innerHTML);

  var nodeColorSettingsTemplate = nodeColorTemplate({
    nodeColorSettings: nodeColorData
  });

  var edgeColorSettingsTemplate = edgeColorTemplate({
    edgeColorSettings: edgeColorData
  });

  var otherSettingsTemplate = otherTemplate({
    visibleParents: configuration.readSetting('visibleParents')
  });

  $("#nodeColorSettings").html(nodeColorSettingsTemplate);
  $("#edgeColorSettings").html(edgeColorSettingsTemplate);
  $("#otherSettings").html(otherSettingsTemplate);

  $(".colorpicker-component").each(function() {
    $(this).colorpicker();
  });

  $('#saveSettings').on('click', saveSettings);
});

function saveSettings() {
  $(".settingInput").each(function() {
    console.log('Saving: ' + $(this).data('key') + ' = ' + $(this).val());
    configuration.saveSetting($(this).data('key'), $(this).val());
  });
  ipc.send('saveGraphSettings');
}
