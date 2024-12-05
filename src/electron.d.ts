export {};

declare global {
  interface Window {
    electronAPI: {
      // utils/rust-utils.js
      getRustTripleTarget: () => string;
      isCargoInstalled: () => boolean;
      installCargo: (targetTriple: string) => { success: boolean; error?: string };

      // utils/git-utils.js
      updateRepo: (repoPath: string, dirPath: string, branch?: string) => { success: boolean; error?: string };

      // utils/build-utils.js
      rebuildFrontend: () => { success: boolean; error?: string };
    };
  }
}
