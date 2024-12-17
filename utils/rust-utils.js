const { ipcMain } = require('electron');
const os = require('os');
const process = require('process');
const { isMusl } = require('detect-libc');
const { logMessage } = require("./message-utils");
const { exec, spawn } = require("child_process"); 
const path = require("path");
const fs = require("fs");
const https = require("https");

function getRustPath() {
    if (os.platform() === 'win32') {
        return process.env.USERPROFILE + '\\.cargo\\bin';
    } else if (os.platform() === 'darwin' || os.platform() === 'linux') {
        return path.join(os.homedir(), '.cargo', 'bin'); 
    }
    return ''; 
}

// ensure we have the system's path variables
const env = { ...process.env, PATH: `${getRustPath()}:${process.env.PATH}` };

function getTripleTarget() {
    const platform = process.platform;
    const arch = process.arch;

    let target = '';

    if (platform === 'win32') {
        // we should probably find a way to do this but 'msvc' requires 
        /*** 
         * please ensure that Visual Studio 2017 or later, or Build Tools for Visual Studio were installed with the Visual C++ option.
         */ 
        // so its a non-starter for simple UX

        const abi = /* process.env.RUST_COMPILER_ABI || 'msvc' */ 'gnu';
        target = `${arch === 'x64' ? 'x86_64' : arch}-pc-windows-${abi}`;
    } else if (platform === 'darwin') {
        target = `${arch === 'x64' ? 'x86_64' : arch}-apple-darwin`;
    } else if (platform === 'linux') {
        const libc = isMusl() ? 'musl' : 'gnu';
        target = `${arch === 'x64' ? 'x86_64' : arch}-unknown-linux-${libc}`;
    } else {
        target = 'unsupported-platform';
    }

    logMessage('cargo-install', `Identified target ${target}`);

    return target;
}

function isCargoInstalled() {
    logMessage('cargo-install', 'system environment:', env);
    return new Promise((resolve) => {
        exec('cargo --version', { env }, (error, stdout) => {
            logMessage('cargo-install', error, stdout);
            if (error) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

async function downloadRustup(tripleTaget, destinationPath) {
    return new Promise((resolve, reject) => {
        const url = `https://static.rust-lang.org/rustup/dist/${tripleTaget}/rustup-init${process.platform === 'win32' ? '.exe' : ''}`;
        logMessage('cargo-install', 'Saving', url, 'to', destinationPath);
        const file = fs.createWriteStream(destinationPath);

        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${url} (status code: ${response.statusCode})`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(destinationPath, () => reject(err));
        });
    });
}

function execCmd(command, args) { 
    return new Promise((resolve, reject) => {
        const installer = spawn(command, args, { env });

        installer.stdout.on('data', (data) => {
            logMessage('cargo-install', String(data));
        });

        installer.stderr.on('data', (data) => {
            logMessage('cargo-install', String(data));
        });

        installer.on('close', (code) => {
            if (code === 0) {
                resolve('Installation completed successfully.');
            } else {
                reject(new Error(`Installation failed with exit code ${code}.`));
            }
        });
    });
}

function installRustup(installerPath) {
    return execCmd(installerPath, ['-y']);
}

async function installCargo(event, tripleTarget) {
    try {
        const installerPath = path.join(os.tmpdir(), `rustup-init${process.platform === 'win32' ? '.exe' : ''}`);

        await downloadRustup(tripleTarget, installerPath);

        if (process.platform !== 'win32') {
            try {
                fs.chmodSync(installerPath, 0o755);
            } catch (err) {
                return {
                    success: false,
                    error: `Failed to set executable permissions: ${err.message}`
                };
            }
        }

        await installRustup(installerPath);

        // see the note above in getTripleTarget() about the ABI -- this is a total hack solution
        if (process.platform === 'win32') {
            const target = getTripleTarget();
            logMessage('cargo-install', '!!!! YOU ARE RUNNING WINDOWS !!!!');
            logMessage('cargo-install', 'We are forced to substitute your actual target for GNU.');
            logMessage('cargo-install', 'If this fails you will have to install cargo manually.');

            await execCmd('rustup', ['toolchain', 'install', `stable-${target}`]);
            await execCmd('rustup', ['default', `stable-${target}`]);
        }

        return {
            success: true
        };
    } catch (error) {
        logMessage('cargo-install', error);
        return {
            success: false,
            error: error.message
        };
    }
};

ipcMain.handle('rust-triple-target', getTripleTarget);
ipcMain.handle('is-cargo-installed', isCargoInstalled);
ipcMain.handle('install-cargo', installCargo);