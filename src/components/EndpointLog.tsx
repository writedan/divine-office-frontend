import { useState, useEffect, useRef } from 'react';

// keeps a log of results from a given stream
const EndpointLog = ({stream}) => {
	const [logs, setLogs] = useState([]);
	const logsEndRef = useRef<HTMLDivElement>(null);

	const handleLog = (_event, log) => {
    	setLogs((prevLogs) => [...prevLogs, log]);
    };

	const scrollToBottom = () => {
		logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	// gives access to the logs from the stream
	useEffect(() => {
		window.electronAPI.on(stream, handleLog);
		return () => {
			window.electronAPI.removeListener(stream, handleLog);
		};
	}, []);

	useEffect(() => scrollToBottom(), [logs]);

	return (
    	<div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
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
    	</div>
    );
};

export default EndpointLog;