var app = require('app'); // Module to control application life.
var BrowserWindow = require('browser-window'); // Module to create native browser window.
var Menu = require('menu');
var MenuItem = require('menu-item');
var ipc = require("electron").ipcMain;
var graphGenerator = require('./node_modules/graphGenerator/graphGenerator');
var fs = require('fs');
var _ = require('lodash/core');
var legendWindow = null;
var randomInputWindow = null;
var mainWindow = null;

function wait(ms) {
  var start = new Date().getTime();
  var end = start;
  while (end < start + ms) {
    end = new Date().getTime();
  }
}

var template = [{
    label: 'File',
    submenu: [{
      label: 'Import CU-File',
      accelerator: 'CmdOrCtrl+I',
      role: 'import',
      click: function(item, focusedWindow) {
        const dialog = require('electron').dialog;
        var filePaths = dialog.showOpenDialog({
          title: 'Import CU-File',
          defaultPath: 'Data',
          filters: [{
            name: 'JSON',
            extensions: ['json']
          }],
          properties: ['openFile']
        });

        if (filePaths == null)
          return;
        var fileContents = fs.readFileSync(filePaths[0]);
        mainWindow.webContents.send('setData', JSON.parse(fileContents));
        mainWindow.webContents.send('renderGraph1');
      }
    }, {
      label: 'Import File-Mapping',
      accelerator: 'CmdOrCtrl+F',
      role: 'import',
      click: function(item, focusedWindow) {
        const dialog = require('electron').dialog;
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
          console.log(filePaths[0]);
        var fileContents = fs.readFileSync(filePaths[0], "utf-8");
        var fileLines = fileContents.split('\n');
        var fileMaps = {};
        for (var line = 0; line < fileLines.length; line++) {
          var fileLine = fileLines[line].split('\t');
          if(fileLine.length == 2){
            fileContents = fs.readFileSync(fileLine[1].trim(), "utf-8");
            fileMaps[fileLine[0]] = {path: fileLine[1].trim(), content: fileContents};
          }
        }
        console.log(fileMaps)

        mainWindow.webContents.send('setFileMapping', fileMaps);
      }
    }, {
      label: 'Random',
      accelerator: 'CmdOrCtrl+R',
      role: 'random',
      click: function() {
        if (randomInputWindow) {
          randomInputWindow.close();
          return;
        }
        randomInputWindow = new BrowserWindow({
          width: 100,
          height: 100
        });
        randomInputWindow.setMenu(null);
        randomInputWindow.setAlwaysOnTop(true);
        randomInputWindow.loadURL('file://' + __dirname + '/Modals/randomInput.html');
        randomInputWindow.on('closed', function() {
          legendWindow = null;
        });
      }
    }]
  }, {
    label: 'View',
    submenu: [{
      label: 'Graph',
      role: 'graphType',
      submenu: [{
        label: 'Radial Tree',
        role: 'radialTree',
        click: function() {
          mainWindow.webContents.send('renderGraph2');
        }
      }]
    }, {
      label: 'Data',
      role: 'dataType',
      submenu: [{
        label: 'Computational Units',
        role: 'cu',
      }, {
        label: 'Data Dependencies',
        role: 'dataDependencies',
      }, {
        label: 'File Mapping',
        role: 'fileMapping',
      }]
    }, {
      label: 'Code',
      role: 'codeView',
      submenu: [{
        label: 'Tabbed',
        role: 'All',
      }]
    }]
  }

];

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
ipc.on('showLegend', function(event, arg) {
  if (legendWindow) {
    legendWindow.close();
    return;
  }
  legendWindow = new BrowserWindow({
    width: 400,
    height: 600
  });
  legendWindow.setMenu(null);
  legendWindow.setAlwaysOnTop(true);
  legendWindow.loadURL('file://' + __dirname + '/Modals/' + arg + '.html');
  legendWindow.on('closed', function() {
    legendWindow = null;
  });

});
ipc.on('randomInput', function(event, arg) {
  console.log('randomInput', JSON.stringify(arg));
  randomInputWindow.close();
  randomInputWindow = null;
  mainWindow.webContents.send('renderGraph0', arg);
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
  mainWindow.loadURL('file://' + __dirname + '/index.html');
  mainWindow.maximize();
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    legendWindow = null;
    mainWindow = null;
  });
});
