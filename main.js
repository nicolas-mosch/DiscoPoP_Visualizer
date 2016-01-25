var app = require('app'); // Module to control application life.
var BrowserWindow = require('browser-window'); // Module to create native browser window.
var Menu = require('menu');
var MenuItem = require('menu-item');
//var ipc = require("electron").ipcMain;
var graphGenerator = require('./node_modules/graphGenerator/graphGenerator');
var mainWindow = null;

//var ipc = require('ipc');
var template = [{
    label: 'File',
    submenu: [{
      label: 'Import',
      accelerator: 'CmdOrCtrl+I',
      role: 'import',
      click: function(item, focusedWindow) {
        const dialog = require('electron').dialog;
        var filePaths = dialog.showOpenDialog({
          title: 'Import',
          defaultPath: '/home',
          filters: [{
            name: 'XML',
            extensions: ['xml']
          }],
          properties: ['openFile']
        });

        if(filePaths == null)
          return;

        //TODO: build graph from data
        mainWindow.webContents.executeJavaScript("renderGraph('"+filePaths[0]+"');");
      }
    }]
  }, {
    label: 'View',
    submenu: [{
      label: 'Graph',
      role: 'graphType',
      submenu: [{
        label: 'Dependeny Wheel',
        role: 'dependencyWheel',
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
    }]
  }

];

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.


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

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});

//ipc.on('close-main-window', function () {
//    app.quit();
//});
