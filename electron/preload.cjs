const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('refileAPI', {
  readPointer: (filePath) => ipcRenderer.invoke('read-pointer', filePath),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  saveFile: (url, defaultName) =>
    ipcRenderer.invoke('save-file', { url, defaultName }),

  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Push events
  onOpenFile: (callback) => {
    const listener = (_event, filePath) => callback(filePath)
    ipcRenderer.on('open-file', listener)
    return () => ipcRenderer.removeListener('open-file', listener)
  },
})
