import React, { useState } from "react";

const UpdatePage: React.FC = () => {
    const [logMessages, setLogMessages] = useState<string[]>([]);
    const [isUpdateSuccess, setIsUpdateSuccess] = useState(false);

    const handleLogMessage = (_event: any, message: string) => {
        setLogMessages((prevMessages) => [...prevMessages, message]);
    };

    React.useEffect(() => {
        window.electronAPI.on('log-message', handleLogMessage);
        return () => {
            window.electronAPI.removeListener('log-message', handleLogMessage);
        };
    }, []);

    const handleUpdateClick = async () => {
        const result = await window.electronAPI.buildFrontend();
        
        if (result.success) {
            setIsUpdateSuccess(true);
        } else {
            setLogMessages((prevMessages) => [...prevMessages, `Error: ${result.error}`]);
        }
    };

    const handleRebootClick = () => {
        window.electronAPI.rebootApp();
    };

    return (
        <div>
            <h1>App Update</h1>
            <button onClick={handleUpdateClick}>Update</button>

            {isUpdateSuccess && (
                <div>
                    <h2>Update Successful!</h2>
                    <button onClick={handleRebootClick}>Reboot App</button>
                </div>
            )}

            <h2>Logs</h2>
            <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ccc", padding: "10px" }}>
                {logMessages.map((message, index) => (
                    <p key={index}>{message}</p>
                ))}
            </div>
        </div>
    );
};

export default UpdatePage;
