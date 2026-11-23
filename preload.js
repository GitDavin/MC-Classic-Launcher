const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
  onReleaseCursor: (callback) => ipcRenderer.on('release-cursor', callback)
});
