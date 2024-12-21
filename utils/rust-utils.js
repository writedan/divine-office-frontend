const { getDefaultBinaryPaths, execCmd } = require("./exec-utils");
const { logMessage } = require("./message-utils");
const { ipcMain } = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const axios = require("axios");

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

async function downloadRustup(tripleTaget, destinationPath) {
    const url = `https://static.rust-lang.org/rustup/dist/${tripleTaget}/rustup-init${process.platform === 'win32' ? '.exe' : ''}`;
    logMessage('cargo-install', 'Saving', url, 'to', destinationPath);
    const writer = fs.createWriteStream(destinationPath);

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', (err) => {
                fs.unlink(destinationPath, () => reject(err));
            });
        });
    } catch (err) {
        fs.unlink(destinationPath, () => { throw err });
    }
}

async function installRustup(installerPath, tripleTarget) {
    return (await execCmd('cargo-install', installerPath, ['-y', '--default-toolchain', `stable-${tripleTarget}`]));
}

async function installCargo() {
	const tripleTarget = getTripleTarget();
	if (process.platform === 'win32') {
		logMessage('cargo-install', '!!!! WARNING !!!!');
		logMessage('cargo-install', 'You are running Windows, which is supposed to use the MSVC ABI. We have substituted in the GNU ABI, since MSVC depends upon Visual Code.');
		logMessage('cargo-install', 'If this fails, you must manually install cargo and Visual Code.');
	}

    try {
        const installerPath = path.join(os.tmpdir(), `rustup-init${process.platform === 'win32' ? '.exe' : ''}`);

        await downloadRustup(tripleTarget, installerPath);

        if (process.platform !== 'win32') {
            try {
                fs.chmodSync(installerPath, 0o755);
            } catch (err) {
                console.error(err);
                return {
                    success: false,
                    error: `Failed to set executable permissions: ${err.message}`
                };
            }
        }

        await installRustup(installerPath, tripleTarget);

        return {
            success: true
        };
    } catch (error) {
        console.error(error);
        logMessage('cargo-install', error);
        return {
            success: false,
            error
        };
    }
};

ipcMain.handle('rust-triple-target', getTripleTarget);
ipcMain.handle("is-cargo-installed", (e) => getDefaultBinaryPaths().cargo.length > 0);
ipcMain.handle('install-cargo', (e) => installCargo());