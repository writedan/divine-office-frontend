const ts = require("typescript");

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
        console.error(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    });

    if (emitResult.emitSkipped) {
        throw new Error("TypeScript compilation failed.");
    }

    console.log("TypeScript build completed successfully.");
}


const { build } = require("vite");

async function buildVite() {
    try {
        await build(); // This assumes your `vite.config.js` is in the root directory.
        console.log("Vite build completed successfully.");
    } catch (err) {
        console.error("Vite build failed:", err);
        throw err;
    }
}

async function buildProject() {
    try {
        console.log("Building TypeScript...");
        buildTypeScript();

        console.log("Building Vite...");
        await buildVite();

        console.log("Build process completed successfully.");
    } catch (err) {
        console.error("Build process failed:", err);
    }
}

buildProject();
