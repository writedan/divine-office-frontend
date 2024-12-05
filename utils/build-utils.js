const ts = require("typescript");
const { logMessage } = require("./message-utils");
const {
    ipcMain
} = require('electron');

function buildTypeScript() {
    const configPath = ts.findConfigFile(
        "./",
        ts.sys.fileExists,
        "tsconfig.json"
    );
    if (!configPath) {
        throw new Error("Could not find tsconfig.json");
    }

    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsedCommandLine = ts.parseJsonConfigFileContent(
        config.config,
        ts.sys,
        "./"
    );

    const program = ts.createProgram({
        rootNames: parsedCommandLine.fileNames,
        options: parsedCommandLine.options,
    });

    const emitResult = program.emit();
    const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

    allDiagnostics.forEach(diagnostic => {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        logMessage('build-log', `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    });

    if (emitResult.emitSkipped) {
        throw new Error("TypeScript compilation failed.");
    }

    logMessage('build-log', "TypeScript build completed successfully.");
}


const { build } = require("vite");

async function buildVite() {
    try {
        await build();
        logMessage('build-log', "Vite build completed successfully.");
    } catch (err) {
        logMessage('build-log', "Vite build failed:", err);
        throw err;
    }
}

async function buildProject() {
    try {
        logMessage('build-log', "Building TypeScript...");
        buildTypeScript();

        logMessage('build-log', "Building Vite...");
        await buildVite();

        logMessage('build-log', "Build process completed successfully.");

        return { success: true };
    } catch (err) {
        logMessage('build-log', "Build process failed:", err);
        return { success: false, error: err.message }
    }
}

ipcMain.handle('rebuild-frontend', buildProject);