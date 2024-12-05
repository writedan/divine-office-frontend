import { mainWindow } from '../main'

const {
    ipcMain
} = require('electron');

function logMessage(stream, ...args) {
	console.log(`[${stream}]`, ...args);
	mainWindow.webContents.send(stream, args.join(' '));
}

module.exports = { logMessage }