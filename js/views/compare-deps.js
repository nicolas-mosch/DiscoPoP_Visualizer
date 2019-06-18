const ipc = require("electron").ipcRenderer;
var $ = global.jQuery = window.$ = require('jquery');
// Hack to fix outdated libraries accessing outdated ui property
window.$.ui = require('jquery-ui');
require('bootstrap');
var Handlebars = require('handlebars');
var JSONView = require('json-view');
var sets = [];

ipc.on('add-set', function(event, set) {
	sets.push(new Set(set));
});

function reloadView(result){
	var depMap = {};
	document.body.innerHTML = "";
	result.forEach((value1, value2, set) => {
		document.body.innerHTML += "<br>" + value2;	
	});

	/*
	var view = new JSONView('result', result);
	document.body.appendChild(view.dom);
	*/
}

function union(a, b){
	return new Set([...a, ...b]);
}

function intersection(a, b){
	return new Set([...a].filter(x => b.has(x)));
}

function difference(a, b){
	return new Set([...a].filter(x => !b.has(x)));
}