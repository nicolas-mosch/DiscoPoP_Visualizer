var app = require('app'); // Module to control application life.
var BrowserWindow = require('browser-window'); // Module to create native browser window.
var Menu = require('menu');
var MenuItem = require('menu-item');
var ipc = require("electron").ipcMain;
var graphGenerator = require('./node_modules/graphGenerator/graphGenerator');
var fs = require('fs');
var _ = require('lodash/core');
var legendWindow = null;

var mainWindow = null;


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
            name: 'JSON',
            extensions: ['json']
          }],
          properties: ['openFile']
        });

        if (filePaths == null)
          return;
        var fileContents = fs.readFileSync(filePaths[0]);



        //        console.log(JSON.stringify(data, null, 2));

        mainWindow.webContents.send('setData', JSON.parse(fileContents));
        mainWindow.webContents.send('renderGraph1');
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
  if (legendWindow){
    legendWindow.close();
    return;
  }
  legendWindow = new BrowserWindow({
    width: 400,
    height: 600
  });
  legendWindow.setMenu(null);
  legendWindow.setAlwaysOnTop(true);
  legendWindow.loadURL('file://' + __dirname + '/legends/' + arg + '.html');
  legendWindow.on('closed', function () {
        legendWindow = null;
    });

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
  //mainWindow.webContents.openDevTools();
  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    legendWindow = null;
    mainWindow = null;
  });
});
