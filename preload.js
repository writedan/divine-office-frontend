const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	// utils/rust-utils.js
	getRustTripleTarget: () => ipcRenderer.invoke('rust-triple-target'),
	isCargoInstalled: () => ipcRenderer.invoke('is-cargo-installed'),
	installCargo: (tripleTaget) => ipcRenderer.invoke('install-cargo', tripleTaget),

	// c.f. utils/message-utils.js
	on: (event, listener) => ipcRenderer.on(event, listener),
	removeListener: (event, listener) => ipcRenderer.removeListener(event, listener),

	// utils/git-utils.js
	updateRepo: (repoPath, dirPath, branch='master') => ipcRenderer.invoke('update-repo', repoPath, dirPath, branch),

	// utils/build-utils.js
	rebuildFrontend: () => ipcRenderer.invoke('rebuild-frontend'),
});
