const ipc = require("electron").ipcRenderer;
var $ = require('jquery');
global.jQuery = require('jquery');
window.$ = require('jquery');
require('bootstrap');

$(document).ready(function() {
    $("#import-button").on('click', function(){
      ipc.send('import-files');
    });
});
