const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	// c.f. utils/message-utils.js
	on: (event, listener) => ipcRenderer.on(event, listener),
	removeListener: (event, listener) => ipcRenderer.removeListener(event, listener),
	
	// utils/exec-utils.js
	getDefaultBinaryPaths: () => ipcRenderer.invoke('default-binary-paths'),
	execCmd: (stream, command, args, opts) => ipcRenderer.invoke('exec-command', stream, command, args, opts),

	// utils/rust-utils.js
	getRustTripleTarget: () => ipcRenderer.invoke('rust-triple-target'),
	isCargoInstalled: () => ipcRenderer.invoke('is-cargo-installed'),
	installCargo: () => ipcRenderer.invoke('install-cargo'),

	// utils/backend-utils.js
	updateBackend: () => ipcRenderer.invoke('update-backend'),
	startBackend: () => ipcRenderer.invoke('start-backend')
});
