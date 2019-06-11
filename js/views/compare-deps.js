const ipc = require("electron").ipcRenderer;
var $ = global.jQuery = window.$ = require('jquery');
// Hack to fix outdated libraries accessing outdated ui property
window.$.ui = require('jquery-ui');
require('bootstrap');
var Handlebars = require('handlebars');
var JSONView = require('json-view');

ipc.on('display-results', function(event, message) {
	var view = new JSONView('example', message);
	document.body.appendChild(view.dom);
});