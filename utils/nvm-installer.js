const os = require('os');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { spawn } = require('child_process');
const AdmZip = require('adm-zip');
const stream = require('stream');
const util = require('util');
const { logMessage } = require("./message-utils");

function execCmd(command, args=[]) { 
    return new Promise((resolve, reject) => {
        logMessage('npm-install', 'Running', command, args.join(' '));

        const exec = spawn(`"${command}"`, args, { shell: true });

        exec.stdout.on('data', (data) => {
            logMessage('npm-install', String(data));
        });

        exec.stderr.on('data', (data) => {
            logMessage('npm-install', String(data));
        });

        exec.on('error', (err) => {
            reject(new Error(`Spawn process failed: ${err.message}`));
        });

        exec.on('close', (code) => {
            if (code === 0) {
                resolve('Execution completed successfully.');
            } else {
                reject(new Error(`Execution failed with exit code ${code}.`));
            }
        });
    });
}

class NVMInstaller {
  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
  }

  getNVMDownloadURL() {
    const platformMappings = {
      'win32': {
        'x64': 'https://github.com/coreybutler/nvm-windows/releases/download/1.1.11/nvm-setup.zip',
        'x32': 'https://github.com/coreybutler/nvm-windows/releases/download/1.1.11/nvm-setup.zip'
      },
      'darwin': {
        'x64': 'https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh',
        'arm64': 'https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh'
      },
      'linux': {
        'x64': 'https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh',
        'arm64': 'https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh'
      }
    };

    const urls = platformMappings[this.platform];
    if (!urls) {
      throw new Error(`Unsupported platform: ${this.platform}`);
    }

    const url = urls[this.arch];
    if (!url) {
      throw new Error(`Unsupported architecture ${this.arch} for platform ${this.platform}`);
    }

    return url;
  }

  async downloadInstaller(url) {
    logMessage('npm-install', `Downloading NVM from: ${url}`);
    const filename = path.basename(url);
    const dest = path.join(os.tmpdir(), filename);
    logMessage('npm-install', 'Saving to:', dest);

    try {
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
      });

      if (response.status !== 200) {
        throw new Error(`Failed to download the file. Status code: ${response.status}`);
      }

      const writer = fs.createWriteStream(dest);

      response.data.pipe(writer);

      const finished = util.promisify(stream.finished);
      await finished(writer);

      logMessage('npm-install', `Download complete: ${dest}`);
      return dest;
    } catch (error) {
      console.error('Error downloading the installer:', error);
      throw error;
    }
  }

  async install(installerPath) {
    try {
      logMessage('npm-install', 'Starting NVM installation...');
      logMessage('npm-install', 'Installer path:', installerPath);

      switch (this.platform) {
        case 'win32':
          await this.installOnWindows(installerPath);
          break;
        case 'darwin':
        case 'linux':
          await this.installOnUnix(installerPath);
          break;
        default:
          throw new Error(`Installation not supported on ${this.platform}`);
      }

      logMessage('npm-install', 'NVM installation completed successfully!');
    } catch (error) {
      console.error('NVM installation failed:', error);
      throw error;
    }
  }

  async installOnWindows(installerPath) {
    const extractDir = path.join(os.tmpdir(), 'nvm-windows-install');
    fs.mkdirSync(extractDir, { recursive: true });

    const zip = new AdmZip(installerPath);
    zip.extractAllTo(extractDir, true);

    const setupFiles = fs.readdirSync(extractDir).filter(file => 
      file.toLowerCase().includes('setup') && file.toLowerCase().endsWith('.exe')
    );

    if (setupFiles.length === 0) {
      throw new Error('No setup executable found in the NVM Windows zip');
    }

    const setupPath = path.join(extractDir, setupFiles[0]);

    try {
      // attempt to auto-accept values but fails
      await execCmd(`powershell -Command "Start-Process '${setupPath}' -ArgumentList '/S', '/y' -Wait"`);
    } catch (error) {
      console.error('Error running the NVM Windows installer:', error);
      throw error;
    }

    fs.rmSync(extractDir, { recursive: true, force: true });
  }

  async installOnUnix(installerPath) {
    // i have no idea if this auto-accepts license or not
    await execCmd(`bash ${installerPath} --skip-license`);
  }

  async postInstall() {
    if (this.platform === 'darwin' || this.platform === 'linux') {
      await execCmd('. ~/.nvm/nvm.sh && nvm install node --lts');
    } else if (this.platform === 'win32') {
      await execCmd('nvm', ['install lts']);
    }
  }

  async run() {
    try {
      const url = this.getNVMDownloadURL();
      const installerPath = await this.downloadInstaller(url);
      await this.install(installerPath);
      await this.postInstall();
    } catch (error) {
      console.error('Installation process failed:', error);
      throw error;
    }
  }
}

async function runNvmInstaller() {
  try {
    const installer = new NVMInstaller();
    await installer.run();
  } catch (err) {
    console.error(err);
    logMessage('npm-install', 'Error occured in installation:', err);
    throw err;
  }
}

module.exports = { runNvmInstaller };