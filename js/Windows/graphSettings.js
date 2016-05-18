var ipc = require("electron").ipcRenderer;
var $ = require('jquery');
global.jQuery = require('jquery');
window.$ = $;
require('bootstrap');
var colorpicker = require('bootstrap-colorpicker');
var configuration = require('../js/Controllers/configuration.js');
var Handlebars = require('handlebars');

$(document).ready(function() {
  console.log("ready!");

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

  var template = Handlebars.compile(document.getElementById('graphColorSettingsTableTemplate').innerHTML);
  var graphSettingsTemplate = template({
    nodeColorSettings: nodeColorData
  });

  $("#colorSettings").html(graphSettingsTemplate);
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
