module.exports = {
  appId: "io.github.writedan.divineoffice",
  files: [
    "web-build/**/*",
    "web-build/assets/**/*",
    "node_modules/**/*",
    "package.json",
    "main.js",
    "utils/**/*",
    "preload.js",
    "assets/**/*",
    "APP_ROOT.js",
    "**/*"
  ],
  extraMetadata: {
    main: "main.js"
  },
  linux: {
    target: [
      "AppImage",
      "deb"
    ],
    artifactName: "${productName}-${version}-linux-${platform}-${arch}.${ext}"
  },
  win: {
    target: "nsis",
    artifactName: "${productName}-${version}-win-installer-${platform}-${arch}.exe"
  },
  mac: {
    target: "dmg",
    artifactName: "${productName}-${version}-mac-${platform}-${arch}.${ext}"
  },
  asarUnpack: [
    "**/node_modules/npm/**/*",
    "**/node_modules/node/**/*"
  ]
};