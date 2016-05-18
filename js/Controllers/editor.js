var $ = require('jquery');
window.$ = require('jquery');
var jstree = require('jstree');

function editors(fileMaps) {
  var editor, currentFileID;
  var ranges = [];

  // Remove irrelevant path portion from paths
  var irrelevantPath = "";
  var paths = [];
  _.each(fileMaps, function(value, key) {
    paths.push(value.path);
  });

  var A = paths.concat().sort();
  var a1 = A[0];
  var a2 = A[A.length - 1]
  var L = a1.length;
  var i = 0;
  var j;
  var parts;
  var fileTreeData = [];
  var containedTreeNodes = [];
  var pathPartsLength;
  var shortPath;

  while (i < L && a1.charAt(i) === a2.charAt(i)) {
    i++;
  }
  irrelevantPath = a1.substring(0, i);
  _.each(fileMaps, function(value, key) {
    shortPath = value.path.replace(irrelevantPath, '');
    parts = shortPath.split('/');
    pathPartsLength = parts.length;

    if (containedTreeNodes.indexOf('0_' + parts[0]) == -1) {
      fileTreeData.push({
        id: '0_' + parts[0],
        parent: '#',
        text: parts[0],
        type: 'folder'
      });
    }
    containedTreeNodes.push('0_' + parts[0]);
    for (j = 1; j < pathPartsLength - 1; j++) {
      if (containedTreeNodes.indexOf(j + '_' + parts[j]) == -1) {
        fileTreeData.push({
          id: j + '_' + parts[j],
          parent: (j - 1) + '_' + parts[j - 1],
          text: parts[j],
          type: 'folder'
        });
        containedTreeNodes.push(j + '_' + parts[j]);
      }
    }

    fileTreeData.push({
      id: key,
      parent: (j - 1) + '_' + parts[j - 1],
      text: parts[j],
      type: 'file'
    });
  });


  $("#file-select-container").jstree({
    "plugins": [
      "search",
      "sort",
      "types",
      "unique",
      "wholerow"
    ],
    "core": {
      "animation": 1,
      "themes": {
        "stripes": true,
        'variant' : 'large'

      },
      "dblclick_toggle": false,
      'data': fileTreeData
    },
    "types": {
      "folder": {
        "icon": "glyphicon glyphicon-folder-open"
      },
      "file": {
        "icon": "glyphicon glyphicon-file"
      }
    }
  });


  // Initialize ace editor block
  editor = ace.edit(document.getElementById('ace-editor'));
  editor.setTheme("ace/theme/monokai");
  editor.getSession().setMode("ace/mode/c_cpp");
  editor.setReadOnly(true);
  editor.setHighlightActiveLine(false);
  editor.setOptions({
    maxLines: 50,
    fontSize: "14pt",
    wrapBehavioursEnabled: true,
    animatedScroll: true
  });
  editor.$blockScrolling = Infinity;


  function highlightNodeInCode(node) {
    var Range = ace.require('ace/range').Range;
    var fileID = node.id.split(':')[0];
    var start = node.start.split(':');
    var end = node.end.split(':');
    var range = new Range(start[1] - 1, 0, end[1], 0);
    ranges.push(range);
    editor.addSelectionMarker(
      range
    );
  }

  function unhighlight() {
    _.forEach(ranges, function(range) {
      editor.removeSelectionMarker(range);
    });
    ranges = [];
  }

  function displayFile(fileID) {
    editor.setValue(fileMaps[fileID].content, -1);
    currentFileID = fileID;
    $('#file-select').val(fileID);
  }

  function getCursorRow() {
    return editor.selection.getCursor().row;
  }

  function getCurrentFileID() {
    return currentFileID;
  }

  return {
    highlightNodeInCode: highlightNodeInCode,
    unhighlight: unhighlight,
    displayFile: displayFile,
    getCursorRow: getCursorRow,
    getCurrentFileID: getCurrentFileID
  };
}


module.exports = editors;
