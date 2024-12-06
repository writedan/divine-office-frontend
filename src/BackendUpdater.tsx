import { useState } from "react";
import AsyncCall from "./components/AsyncCall";
import EndpointLog from "./components/EndpointLog";
import { useNavigation } from './NavigationContext';

const BackendUpdater = () => {
  const [cargoInstalled, setCargoInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{ success: boolean; message: string } | null>(null);

  const { goto } = useNavigation();

  async function update() {
    try {
      const result = await window.electronAPI.updateRepo('https://github.com/writedan/divine-office', 'backend');
      if (result.success) {
        setUpdateStatus({ success: true, message: "Backend updated successfully!" });
      } else {
        setUpdateStatus({ success: false, message: result.error || "An unknown error occurred." });
      }
    } catch (error) {
      setUpdateStatus({ success: false, message: "Failed to update the backend. Please try again later. If you have used the application before, it will still function. If this was your first time launching it, it will not function." });
    }
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

  const statusMessageStyle: React.CSSProperties = {
    fontSize: "1rem",
    color: updateStatus?.success ? "#28a745" : "#e74c3c",
    marginTop: "20px",
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Backend Updater</h2>
      {!updateStatus ? (
        <>
          <EndpointLog stream={"git-log"} />
          <AsyncCall call={update} message={"Updating backend"}>
            <button
              style={buttonStyle}
              onClick={update}
            >
              Update Backend
            </button>
          </AsyncCall>
        </>
      ) : (
        <div>
          <p style={statusMessageStyle}>{updateStatus.message}</p>
          <button
            style={buttonStyle}
            onClick={() => goto('home')}
          >
            Go to Home
          </button>
        </div>
      )}
    </div>
  );
};

export default BackendUpdater;
