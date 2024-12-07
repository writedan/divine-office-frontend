const { ipcRenderer } = require('electron');

ipcRenderer.on('update-available', () => {
    alert('A new update is available. Downloading now...');
});

ipcRenderer.on('update-downloaded', () => {
    const response = confirm('Update downloaded. Restart now?');
    if (response) {
        ipcRenderer.send('restart-app');
    }
});
