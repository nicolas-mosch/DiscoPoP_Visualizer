// Requires
const {
  app,
  BrowserWindow,
  Menu,
  MenuItem,
  dialog,
  ipcMain,
  globalShortcut
} = require('electron');
var _ = require('lodash/core');
var configuration = require('./js/general/configuration.js');
var dataReader = require('./js/general/data-reader.js');
var dataInitializer = require('./js/general/data-initializer.js');
var GraphController = require('./js/controllers/graph.js');

// Windows
var mainWindow = null;
var graphSettingsWindow = null;
var codeSettingsWindow = null;
var nodes;
var fileMaps;
var fileNodeIntervalTrees;
var graphController;

var template = [{
  label: 'File',
  submenu: [{
    label: 'Import Data',
    accelerator: 'CmdOrCtrl+I',
    click: function(item, focusedWindow) {
      importFiles();
    }
  }, {
    label: 'Open DevTools',
    accelerator: 'F12',
    click: function(item, focusedWindow) {
      mainWindow.webContents.openDevTools();
    }
  },
  {
    label: 'Exit',
    accelerator: 'CmdOrCtrl+Esc',
    click: function(item, focusedWindow) {
      mainWindow.close();
    }
  }]
}, {
  label: 'Preferences',
  submenu: [{
    label: 'Graph',
    accelerator: 'CmdOrCtrl+G',
    click: function(item, focusedWindow) {
      if (graphSettingsWindow) {
        graphSettingsWindow.focus();
        return;
      }
      graphSettingsWindow = new BrowserWindow({
        width: 600,
        height: 350,
        webPreferences: {
          nodeIntegration: true
        }
      });
      graphSettingsWindow.setMenu(null);
      graphSettingsWindow.setAlwaysOnTop(true);
      graphSettingsWindow.loadURL('file://' + __dirname + '/windows/graphSettings.html');
      graphSettingsWindow.on('closed', function() {
        graphSettingsWindow = null;
      });
      //graphSettingsWindow.webContents.openDevTools();
    }
  }, {
    label: 'Code',
    accelerator: 'CmdOrCtrl+E',
    click: function(item, focusedWindow) {}
  }]
},
{
  label: 'Tools',
  submenu: [{
    label: 'DepFile Compare',
    click: function(item, focusedWindow) {
      compareDepFiles();
    }
  }]
}];

ipcMain.on('import-files', function() {
  importFiles();
});

ipcMain.on('closeGraphSettingsWindow', function() {
  graphSettingsWindow.close();
});

ipcMain.on('saveGraphSettings', function() {
  //graphSettingsWindow.close();
  mainWindow.webContents.send('redrawGraph');
});

ipcMain.on('viz-test', function(message, dot){
  vizWriter.write(dot);
});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  if (process.platform != 'darwin')
    app.quit();
});

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
  menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/windows/index.html');
  mainWindow.maximize();
  //mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    legendWindow = null;
    mainWindow = null;
  });
});


function importFiles() {
  var mappingPath;

  // Import File-Mapping
  var filePaths = dialog.showOpenDialog({
    title: 'Import File-Mapping',
    defaultPath: '.',
    filters: [{
      name: 'Text',
      extensions: ['txt']
    }],
    properties: ['openFile']
  });

  if (filePaths == null)
    return;
  mappingPath = filePaths[0];

  // Import Node-Data
  var filePaths = dialog.showOpenDialog({
    title: 'Import Node-Data',
    defaultPath: mappingPath.substring(0, mappingPath.lastIndexOf("/")),
    filters: [{
      name: 'JSON',
      extensions: ['json']
    }],
    properties: ['openFile']
  });

  if (filePaths == null)
    return;
	
  var data = dataReader.buildFromFile(mappingPath, filePaths[0]);
  
  if(!data){
	mainWindow.webContents.send('alert', 'An error occurred while loading the data. Check the console log for more information.');
	return;
  }
  
  mainWindow.webContents.on('did-finish-load', function() {
    
    mainWindow.webContents.send('load-data', data);

    fileNodeIntervalTrees = dataInitializer.prepareData(data);
    fileMaps = data.fileMapping;

    graphController = new GraphController.controller(data.nodeData, data.rootNodes);
    mainWindow.webContents.send('init-listeners');
    mainWindow.webContents.send('update-graph', graphController.generateSvgGraph(data.rootNodes));
  });
  mainWindow.loadURL('file://' + __dirname + '/windows/visualizer.html');
}
var compareDeps = false;
function compareDepFiles() {
  var deps1, deps2;
  // Import First Dep-File
  var filePaths = dialog.showOpenDialog({
    title: 'Import First Dependency File',
    defaultPath: '.',
    filters: [{
      name: 'Text',
      extensions: ['txt']
    }],
    properties: ['openFile']
  });

  if (filePaths == null)
    return;
  deps = dataReader.buildDepsFromFile(filePaths[0]);
  var data = {
    name: filePaths[0],
    set: deps
  }
  
  if(!compareDeps){
    mainWindow.webContents.on('did-finish-load', function() {
      mainWindow.webContents.send('add-set', deps);
    });
    mainWindow.loadURL('file://' + __dirname + '/windows/compare-deps.html');
    compareDeps = true;
  }else{
    mainWindow.webContents.send('add-set', deps);
  }
}
