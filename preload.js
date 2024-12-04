const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getRustTargetTriple: () => ipcRenderer.invoke('rust-triple-target'),
  isCargoInstalled: () => ipcRenderer.invoke('is-cargo-installed'),
  installCargo: (tripleTarget) => ipcRenderer.invoke('install-cargo', tripleTarget)
});
