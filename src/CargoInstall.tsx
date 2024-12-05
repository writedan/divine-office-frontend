import { useState, useEffect, useRef } from 'react';
import { useNavigation } from './NavigationContext';

function CargoInstall() {
  const [logs, setLogs] = useState<string[]>([]);
  const [installing, setInstalling] = useState(false);
  const [checking, setChecking] = useState(true);
  const [infoDisplayed, setInfoDisplayed] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { goto } = useNavigation();

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const checkCargoInstallation = async () => {
      setChecking(true);
      const isInstalled = await window.electronAPI.isCargoInstalled();

      if (isInstalled) {
        goto('home'); 
      } else {
        setLogs([
          'Cargo is not installed.',
        ]);
        setInfoDisplayed(true);
      }

      setChecking(false);
    };

    checkCargoInstallation();
  }, [goto]);

  useEffect(() => {
    const handleLog = (_event: any, log: string) => {
      setLogs((prevLogs) => [...prevLogs, log]);
    };

    window.electronAPI.on('install-log', handleLog);

    return () => {
      window.electronAPI.removeListener('install-log', handleLog);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const installCargo = async () => {
    setInstalling(true);
    setLogs(['Starting Cargo installation...']);
    const targetTriple = await window.electronAPI.getRustTargetTriple();
    const result = await window.electronAPI.installCargo(targetTriple);

    if (result.success) {
      setLogs((prevLogs) => [
        ...prevLogs,
        'Installation completed successfully. Redirecting to Home...',
      ]);
      goto('home');
    } else {
      setLogs((prevLogs) => [
        ...prevLogs,
        `Installation failed: ${result.error}`,
      ]);
    }

    setInstalling(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {checking ? (
        <div>
          <p>Checking for Cargo installation...</p>
          <div className="activity-indicator"></div>
        </div>
      ) : (
        <>
          {!installing && infoDisplayed && (
            <div style={{ marginBottom: '20px' }}>
              <h2>Cargo Installer</h2>
              <p>
                Cargo, a build system for Rust, is required by this application for its backend data provider.
              </p>
              <p>
                Click "Install Cargo" to set it up.
              </p>
            </div>
          )}
          <div
            style={{
              height: '300px',
              overflowY: 'auto',
              border: '1px solid #ccc',
              borderRadius: '5px',
              padding: '10px',
              background: '#f9f9f9',
            }}
          >
            {logs.map((log, index) => (
              <p key={index} style={{ margin: '5px 0' }}>
                {log}
              </p>
            ))}
            <div ref={logsEndRef}></div>
          </div>
          {!checking && !installing && (
            <div style={{ marginTop: '20px' }}>
              <button onClick={installCargo} disabled={installing}>
                Install Cargo
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CargoInstall;
