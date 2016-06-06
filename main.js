var app = require('app'); // Module to control application life.
var BrowserWindow = require('browser-window'); // Module to create native browser window.
var Menu = require('menu');
var MenuItem = require('menu-item');
var Handlebars = require('handlebars');
const ipc = require("electron").ipcMain;
var _ = require('lodash/core');
var configuration = require('./js/Controllers/configuration.js');
var dataReader = require('./js/data-reader.js');

// Windows
var mainWindow = null;
var graphSettingsWindow = null;
var codeSettingsWindow = null;
var cuInfoWindows = {};
var nodeData = null;

const dialog = require('electron').dialog;

var template = [{
  label: 'File',
  submenu: [{
    label: 'Import Data',
    accelerator: 'CmdOrCtrl+I',
    role: 'import',
    click: function(item, focusedWindow) {
      importFiles();
    }
  }, {
    label: 'Open DevTools',
    accelerator: 'CmdOrCtrl+T',
    role: 'import',
    click: function(item, focusedWindow) {
      mainWindow.webContents.openDevTools();
    }
  },
  {
    label: 'Exit',
    accelerator: 'CmdOrCtrl+Esc',
    role: 'close',
    click: function(item, focusedWindow) {
      mainWindow.close();
    }
  }]
}, {
  label: 'Preferences',
  submenu: [{
    label: 'Graph',
    accelerator: 'CmdOrCtrl+G',
    role: 'graphSettings',
    click: function(item, focusedWindow) {
      if (graphSettingsWindow) {
        graphSettingsWindow.focus();
        return;
      }
      graphSettingsWindow = new BrowserWindow({
        width: 600,
        height: 350
      });
      graphSettingsWindow.setMenu(null);
      graphSettingsWindow.setAlwaysOnTop(true);
      graphSettingsWindow.loadURL('file://' + __dirname + '/Windows/graphSettings.html');
      graphSettingsWindow.on('closed', function() {
        graphSettingsWindow = null;
      });
      //graphSettingsWindow.webContents.openDevTools();
    }
  }, {
    label: 'Code',
    accelerator: 'CmdOrCtrl+E',
    role: 'codeSettings',
    click: function(item, focusedWindow) {}
  }]
}];

ipc.on('showCuInfo', function(event, cuData) {
  if (!_.has(cuInfoWindows, cuData.id)) {
    var cuInfoWindow = new BrowserWindow({
      width: 400,
      height: 400,
      resizable: true,
      title: 'CU: ' + cuData.id,
      javascript: true
    });
    cuInfoWindow.setMenu(null);
    cuInfoWindow.loadURL('file://' + __dirname + '/Windows/cuInfo.html');
    cuInfoWindow.webContents.on('did-finish-load', function() {
      cuInfoWindow.webContents.send('init', cuData);
    });
    cuInfoWindow.on('closed', function() {
      delete cuInfoWindows[cuData.id];
    });
    //cuInfoWindow.webContents.openDevTools();
    cuInfoWindows[cuData.id] = cuInfoWindow;
  } else {
    cuInfoWindows[cuData.id].focus();
  }
});

ipc.on('import-files', function() {
  importFiles();
});

ipc.on('closeGraphSettingsWindow', function() {
  graphSettingsWindow.close();
});

ipc.on('saveGraphSettings', function() {
  //graphSettingsWindow.close();
  mainWindow.webContents.send('redrawGraph');
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
    height: 600
  });

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/Windows/index.html');
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
    defaultPath: 'Data',
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
    defaultPath: 'Data',
    filters: [{
      name: 'JSON',
      extensions: ['json']
    }],
    properties: ['openFile']
  });

  if (filePaths == null)
    return;
  mainWindow.setProgressBar(0.5);
  var data = dataReader.buildFromFile(mappingPath, filePaths[0]);

  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.webContents.send('init', data);
  });

  mainWindow.loadURL('file://' + __dirname + '/Windows/visualizer.html');


}
