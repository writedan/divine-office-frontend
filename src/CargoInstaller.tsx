import { useState } from "react";
import AsyncCall from "./components/AsyncCall";
import EndpointLog from "./components/EndpointLog";
import { useNavigation } from './NavigationContext';

const CargoInstaller = () => {
  const [cargoInstalled, setCargoInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  const { goto } = useNavigation();

  async function check() {
    const res = await window.electronAPI.isCargoInstalled();

    if (res) {
      goto('update-backend');
      return;
    }

    setCargoInstalled(await window.electronAPI.isCargoInstalled());
  }

  async function install() {
    const target = await window.electronAPI.getRustTripleTarget();
    const res = await window.electronAPI.installCargo(target);
    if (res.success) {
      goto('update-backend');
    }
  }

  function handleInstall() {
    setInstalling(true);
  }

  const containerStyle: React.CSSProperties = {
    padding: "30px",
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    fontFamily: "'Roboto', sans-serif",
    textAlign: "center",
    boxSizing: "border-box",
    border: "1px solid #e1e1e1",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "2rem",
    fontWeight: "500",
    color: "#333",
    marginBottom: "20px",
  };

  const messageStyle: React.CSSProperties = {
    fontSize: "1.1rem",
    color: "#555",
    marginBottom: "20px",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "12px 24px",
    backgroundColor: "#007BFF",
    color: "white",
    fontSize: "1.1rem",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.3s ease-in-out",
    marginTop: "15px",
    outline: "none",
  };

  const buttonHoverStyle: React.CSSProperties = {
    backgroundColor: "#0056b3",
    transform: "scale(1.05)",
  };

  const asyncCallContainerStyle: React.CSSProperties = {
    marginTop: "20px",
  };

  const loadingStyle: React.CSSProperties = {
    fontSize: "1.1rem",
    color: "#007BFF",
  };

  const errorMessageStyle: React.CSSProperties = {
    fontSize: "1rem",
    color: "#e74c3c",
    marginTop: "20px",
    textAlign: "center",
  };

  const linkStyle: React.CSSProperties = {
    color: "#007BFF",
    textDecoration: "underline",
    cursor: "pointer",
  };

  if (installing) {
    return (
      <div style={containerStyle}>
        <EndpointLog stream={"cargo-install"} />
        <AsyncCall call={install} message={"Installing Cargo"}>
          <p style={errorMessageStyle}>
            Cargo failed to install. Please visit{" "}
            <a
              style={linkStyle}
              onClick={() => window.electronAPI.openLink('https://rustup.rs')}
            >
              rustup.rs
            </a>{" "}
            and install it manually if problems persist.
          </p>
        </AsyncCall>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Cargo Installation</h2>
      <AsyncCall call={check} message={"Checking for Cargo Installation"}>
        {cargoInstalled ? (
          <p style={messageStyle}>Cargo is already installed!</p>
        ) : (
          <div>
            <p style={messageStyle}>This application depends on Cargo, a build system for the Rust programming language. We did not detect it on your system.</p>
            <button
              style={buttonStyle}
              onMouseOver={(e) => {
                const target = e.target as HTMLElement;
                target.style.backgroundColor = buttonHoverStyle.backgroundColor;
                target.style.transform = buttonHoverStyle.transform;
              }}
              onMouseOut={(e) => {
                const target = e.target as HTMLElement;
                target.style.backgroundColor = buttonStyle.backgroundColor;
                target.style.transform = "scale(1)";
              }}
              onClick={handleInstall}
            >
              Install Cargo
            </button>
          </div>
        )}
      </AsyncCall>
    </div>
  );
};

export default CargoInstaller;
