/* global window */

var dagre;

if (require) {
  try {
    dagre = require("dagre");
  } catch (e) {
    console.error('Could not find module dagre');
  }
}

if (!dagre) {
  dagre = window.dagre;
}

module.exports = dagre;
