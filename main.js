const { app, BrowserWindow, session, ipcMain, Menu } = require('electron');

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('ozone-platform', 'x11');
app.commandLine.appendSwitch('use-gl', 'angle');
app.commandLine.appendSwitch('use-angle', 'gles');
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

function createWindow() {
  Menu.setApplicationMenu(null);

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['fullscreen'];
    callback(allowed.includes(permission));
  });

  const win = new BrowserWindow({
    width: 1280,
    height: 760,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    icon: __dirname + '/icon.png',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      preload: __dirname + '/preload.js'
    }
  });

  ipcMain.on('toggle-fullscreen', () => {
    win.setFullScreen(!win.isFullScreen());
  });

  win.webContents.on('did-attach-webview', (event, webContents) => {
    webContents.on('before-input-event', (e, input) => {
      if (input.control && input.alt) {
        win.webContents.send('release-cursor');
        return;
      }
      if ((input.control || input.meta) && ['w', 'r', 'f', 't', 'b'].includes(input.key.toLowerCase())) {
        e.preventDefault();
      }
    });
  });

  win.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.alt) {
      win.webContents.send('release-cursor');
    }
    if ((input.control || input.meta) && input.key.toLowerCase() === 'w') {
      event.preventDefault();
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
