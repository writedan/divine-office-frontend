import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

// keeps a log of results from a given stream
const EndpointLog = ({ stream }) => {
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  const handleLog = (_event, log) => {
    setLogs((prevLogs) => [...prevLogs, log]);
  };

  const scrollToBottom = () => {
    logsEndRef.current?.scrollToEnd({ animated: true });
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
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        ref={logsEndRef}
      >
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  scrollView: {
    height: 300,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#ccc',
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  logText: {
    marginVertical: 5,
  },
});

export default EndpointLog;
