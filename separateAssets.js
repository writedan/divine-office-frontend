const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
const fontsDir = path.join(
  __dirname,
  'web-build',
  'assets',
  'node_modules',
  '@expo',
  'vector-icons',
  'build',
  'vendor',
  'react-native-vector-icons',
  'Fonts'
);
const entryJsDir = path.join(__dirname, 'web-build', '_expo', 'static', 'js', 'web');

function clearDirectory(directory) {
  if (fs.existsSync(directory)) {
    fs.readdirSync(directory).forEach(file => {
      const filePath = path.join(directory, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    });
    console.log(`Cleared directory: ${directory}`);
  } else {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`Created directory: ${directory}`);
  }
}

function moveTtfFiles(source, destination) {
  if (!fs.existsSync(source)) {
    console.error(`Source directory "${source}" does not exist.`);
    return;
  }

  const ttfFiles = fs.readdirSync(source).filter(file => path.extname(file) === '.ttf');

  ttfFiles.forEach(file => {
    const sourceFile = path.join(source, file);
    const destFile = path.join(destination, file);

    fs.copyFileSync(sourceFile, destFile);
    console.log(`Moved "${file}" to "${destination}".`);
  });
}

function editEntryJsFile(directory, assetsDestination) {
  const entryJsFile = fs.readdirSync(directory).find(file => file.startsWith('entry-') && file.endsWith('.js'));

  if (!entryJsFile) {
    console.error('No "entry-{hash}.js" file found.');
    return;
  }

  const entryJsPath = path.join(directory, entryJsFile);
  let content = fs.readFileSync(entryJsPath, 'utf8');

  content = content.replace(
    /\/assets\/node_modules\/\@expo\/vector-icons\/build\/vendor\/react-native-vector-icons\/Fonts\/(.*?\.ttf)/g,
    (_, fileName) => `/assets/${fileName}`
  );

  fs.writeFileSync(entryJsPath, content, 'utf8');
  console.log(`Updated references in "${entryJsFile}".`);
}

// Execute the operations
clearDirectory(assetsDir);
moveTtfFiles(fontsDir, assetsDir);
editEntryJsFile(entryJsDir, assetsDir);
