const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	// utils/rust-utils.js
	getRustTripleTarget:: () => ipcRenderer.invoke('rust-triple-target'),
	isCargoInstalled: () => ipcRenderer.invoke('is-cargo-installed'),
	installCargo: (tripleTaget) => ipcRenderer.invoke('install-cargo', tripleTaget)
});
