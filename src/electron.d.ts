export {};

declare global {
  interface Window {
    electronAPI: {
      getRustTargetTriple: () => string;
      isCargoInstalled: () => boolean;
      installCargo: (targetTriple: string) => { success: boolean; error?: string };
      on: (event: string, listener: (...args: any[]) => void) => void;
      removeListener: (event: string, listener: (...args: any[]) => void) => void;
    };
  }
}
