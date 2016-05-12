var $ = require('jquery');
window.$ = require('jquery');


function editors(fileMaps) {
  var editor, currentFileID;
  var ranges = [];
  var fileSelector = $("#file-select");
  _.each(fileMaps, function(value, key) {
    var option = new Option(value.path.split('/').slice(-1)[0], key);
    fileSelector.append(option);
  });

  // Initialize ace editor block
  editor = ace.edit(document.getElementById('ace-editor'));
  editor.setTheme("ace/theme/monokai");
  editor.getSession().setMode("ace/mode/c_cpp");
  editor.setReadOnly(true);
  editor.setHighlightActiveLine(false);
  editor.setOptions({
    maxLines: 10000,
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

  function displayFile(fileID){
    editor.setValue(fileMaps[fileID].content);
    currentFileID = fileID;
    $('#file-select').val(fileID);
  }

  function getCursorRow(){
    return editor.selection.getCursor().row;
  }

  function getCurrentFileID(){
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
