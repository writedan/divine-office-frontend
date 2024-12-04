export {};

declare global {
  interface Window {
    electronAPI: {
      getRustTargetTriple: () => string,
      isCargoInstalled: () => bool,
      installCargo: (targetTriple: string) => { success: boolean; error?: string };
    };
  }
}
