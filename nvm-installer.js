const os = require('os');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');
const stream = require('stream');
const util = require('util');

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
    console.log(`Downloading NVM from: ${url}`);
    const filename = path.basename(url);
    const dest = path.join(os.tmpdir(), filename);
    console.log('Saving to:', dest);

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

      console.log(`Download complete: ${dest}`);
      return dest;
    } catch (error) {
      console.error('Error downloading the installer:', error);
      throw error;
    }
  }

  async install(installerPath) {
    try {
      console.log('Starting NVM installation...');
      console.log('Path:', installerPath);

      switch (this.platform) {
        case 'win32':
          await this.installOnWindows(installerPath);
          break;
        case 'darwin':
        case 'linux':
          this.installOnUnix(installerPath);
          break;
        default:
          throw new Error(`Installation not supported on ${this.platform}`);
      }

      console.log('NVM installation completed successfully!');
    } catch (error) {
      console.error('NVM installation failed:', error);
      process.exit(1);
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
      execSync(`powershell -Command "Start-Process '${setupPath}' -ArgumentList '/S', '/y' -Wait"`, { stdio: 'inherit' });
    } catch (error) {
      console.error('Error running the NVM Windows installer:', error);
      throw error;
    }

    fs.rmSync(extractDir, { recursive: true, force: true });
  }

  installOnUnix(installerPath) {
    // i have no idea if this auto-accepts license or not
    execSync(`bash ${installerPath} --skip-license`, { stdio: 'inherit' });
  }

  postInstall() {
    if (this.platform === 'darwin' || this.platform === 'linux') {
      execSync('. ~/.nvm/nvm.sh && nvm install node --lts', { stdio: 'inherit', shell: '/bin/bash' });
    } else if (this.platform === 'win32') {
      execSync('nvm install lts', { stdio: 'inherit' });
    }
  }

  async run() {
    try {
      const url = this.getNVMDownloadURL();
      const installerPath = await this.downloadInstaller(url);
      await this.install(installerPath);
      this.postInstall();
    } catch (error) {
      console.error('Installation process failed:', error);
      process.exit(1);
    }
  }
}

async function main() {
  try {
    require.resolve('adm-zip');
  } catch (error) {
    console.error('Missing required npm package. Please run:');
    console.error('npm install adm-zip');
    process.exit(1);
  }

  const installer = new NVMInstaller();
  await installer.run();
}

main();
