import { useState, useEffect } from 'react';

function App() {
  const [targetTriple, setTargetTriple] = useState('Loading...');
  const [cargoInstalled, setCargoInstalled] = useState<string | boolean>('Loading...');
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null | undefined>(null);

  useEffect(() => {
    const load = async () => {
      setTargetTriple(await window.electronAPI.getRustTargetTriple());
      setCargoInstalled(await window.electronAPI.isCargoInstalled());
    };

    load();
  }, []);

  const installCargo = async () => {
    setInstalling(true);
    setError(null);

    const result = await window.electronAPI.installCargo(targetTriple);
    if (result.success) {
      setCargoInstalled(true);
    } else {
      setError(result.error);
    }

    setInstalling(false);
  };

  return (
    <div>
      <p>Rust Target Triple: {targetTriple}</p>
      <p>Cargo Installed? {typeof cargoInstalled === 'boolean' ? (cargoInstalled ? 'true' : 'false') : cargoInstalled}</p>
      {!cargoInstalled && !installing && (
        <button onClick={installCargo}>Install Cargo</button>
      )}
      {installing && <p>Installing Cargo...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}

export default App;
