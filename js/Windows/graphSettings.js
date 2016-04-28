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

  var colorData = {
    cuColor: configuration.readSetting('cuColor'),
    functionColor: configuration.readSetting('functionColor'),
    loopColor: configuration.readSetting('loopColor'),
    defaultColor: configuration.readSetting('defaultColor'),
    labelColor: configuration.readSetting('labelColor')
  }

  var template = Handlebars.compile(document.getElementById('graphColorSettingsTableTemplate').innerHTML);
  var graphSettingsTemplate = template({
    colorSettings: colorData
  });

  $("#colorSettings").html(graphSettingsTemplate);
  $( ".colorpicker-component" ).each(function() {
    $( this ).colorpicker();
  });

  $('#saveSettings').on('click', saveSettings);
});

function saveSettings(){
  $( ".settingInput" ).each(function() {
    console.log('Saving: ' + $(this).data('key') + ' = ' + $(this).val());
    configuration.saveSetting($(this).data('key'), $(this).val());
  });
  ipc.send('saveGraphSettings');
}
