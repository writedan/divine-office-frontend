const { app, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const { logMessage } = require("./message-utils");

ipcMain.handle('start-backend', async (event) => {
  try {
    const targetDir = path.join(app.getPath('userData'), 'backend');

    logMessage("start-backend", "Identified path", targetDir);
    
    const cargoProcess = spawn('cargo', ['run', '--release'], { cwd: targetDir });

    let output = '';
    let url = null;

    cargoProcess.stdout.on('data', (data) => {
      logMessage("start-backend", data.toString());
      output += data.toString();
      const match = output.match(/https?:\/\/[^\s]+/);
      if (match && !url) {
        url = match[0];
        logMessage("start-backend", "Identified backend URL", url);
        event.sender.send('cargo-url', { url });
      }
    });

    cargoProcess.stderr.on('data', (data) => {
      output += data.toString();
      logMessage("start-backend", data.toString());
    });

    cargoProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Cargo process exited with code ${code}`);
        event.sender.send('cargo-err', code);
      }
    });

    return { success: true, message: 'Cargo process running in the background.' };

  } catch (error) {
    console.error(error);
    logMessage("start-backend", error);
    return { success: false, error: error.message };
  }
});
