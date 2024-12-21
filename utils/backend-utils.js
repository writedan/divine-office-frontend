const { logMessage } = require("./message-utils");
const { getDefaultBinaryPaths, execCmd } = require("./exec-utils");
const { ipcMain, app } = require("electron");
const path = require("path");

async function updateBackend() {
	try {
		await execCmd('install-log', getDefaultBinaryPaths().cargo[0], ['install', '--git', 'https://github.com/writedan/divine-office']);
		return { success: true }
	} catch (error) {
		logMessage('install-log', 'An error occured while updating backend:', error);
		return { success: false, error, installed: getDefaultBinaryPaths().divineOffice.length > 0 }
	}
}

function startBackend(event) {
  let output = '';
  let url = null;

  return new Promise(async (resolve, reject) => {
    execCmd('start-backend', getDefaultBinaryPaths().divineOffice[0], ["--resources", app.getAppPath()], {}, (data) => {
      output += String(data);
      const match = output.match(/https?:\/\/[^\s]+/);
      if (match && !url) {
        url = match[0];
        logMessage("start-backend", "Identified backend URL", url);
        event.sender.send('cargo-url', { url });
      }
    }).catch((error) => {
      logMessage('start-backend', error);
      event.sender.send('cargo-err', { error: error.message });
      resolve({ success: false, error: error });
    });
    
    resolve({ success: true });
  });
}

ipcMain.handle("update-backend", (e) => updateBackend());
ipcMain.handle("start-backend", (e) => startBackend(e))