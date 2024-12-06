import React from "react";

const ActivityIndicator = ({ message }) => {
  const styles = {
    container: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      padding: "10px",
    },
    spinner: {
      width: "24px",
      height: "24px",
      border: "3px solid #f3f3f3",
      borderTop: "3px solid #3498db",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
    message: {
      fontSize: "16px",
      color: "#333",
    },
    keyframes: `
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `,
  };

  if (!document.getElementById("spin-keyframes")) {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.id = "spin-keyframes";
    styleSheet.innerText = styles.keyframes;
    document.head.appendChild(styleSheet);
  }

  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
};

export default ActivityIndicator;
