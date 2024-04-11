const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const { electron } = require('process');
const shell = require('electron').shell;
let win;

function createWindow () {
  win = new BrowserWindow({
    frame: false,
    width: 1250,
    height: 750,
    minWidth: 1250 / 2.5,
    minHeight: 750 / 2.5,
    backgroundColor: '#363636',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // devTools: false
    }
  });

  win.loadFile('src/index.html');
  // win.maximize();
  // win.webContents.openDevTools()  
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.on('close-app', (event) => { 
  app.quit();
});

ipcMain.on('maximize-app', (event) => { 
    if ( win.isMaximized() ) {
      win.unmaximize();  
    } else {
      win.maximize(); 
    }
});  

ipcMain.on('minimize-app', (event) => { 
  win.minimize(); 
});

ipcMain.on('devtools', (event) => { 
  win.webContents.openDevTools()
});
