var ipc = require("electron").ipcRenderer;
var Handlebars = require('handlebars');
var $ = require('jquery');
global.jQuery = require('jquery');
window.$ = $;
require('bootstrap');

ipc.on('init', function(event, data) {
  Handlebars.registerHelper('handleAttribute', function (inItem) {
    return JSON.stringify(inItem);
  });
  var template = Handlebars.compile(document.getElementById('cuInfoTableTemplate').innerHTML);
  var cuDataTable = template({
    cuData: data
  });
  document.getElementById('body').innerHTML = cuDataTable;
});
