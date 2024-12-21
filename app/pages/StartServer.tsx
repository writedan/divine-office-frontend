import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncCall from '../components/AsyncCall';
import EndpointLog from '../components/EndpointLog';
import { useNavigation } from '../Navigation';
import { useApi } from '../ApiControl';

const StartServer = () => {
  const [err, setErr] = useState(null);
  const [running, setRunning] = useState(false);

  const { goto } = useNavigation();
  const { setApiUrl } = useApi();

  async function launch() {
    const res = await window.electronAPI.startBackend();
    console.log('launch', res);
    if (res.success) {
      setRunning(true);
    } else {
      setRunning(false);
      setErr(res.error);
    }
  }

  function handleError(_event, err) {
    console.error(err);
    setErr(err.error);
    setRunning(false);
  }

  function handleUrl(_event, obj) {
    setRunning(false);
    setApiUrl(obj.url);
    goto('today', {date: new Date()});
  }

  useEffect(() => {
    window.electronAPI.on("cargo-err", handleError);

    window.electronAPI.on("cargo-url", handleUrl);

    return () => {
      window.electronAPI.removeListener("cargo-err", handleError);
      window.electronAPI.removeListener("cargo-url", handleUrl);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <EndpointLog stream="start-backend" />
        <AsyncCall call={launch} message="Launching backend"/>
        {err && <Text style={styles.errorMessage}>
          Failed to launch backend: {err}
        </Text>}
        {running && <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Launching backend...</Text>
        </View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f5ec',
    padding: 20,
  },
  content: {
    padding: 30,
    maxWidth: 600,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    textAlign: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    color: '#333',
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    color: '#555',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  errorMessage: {
    fontSize: 16,
    color: '#e74c3c',
    marginTop: 20,
    textAlign: 'center',
  },
  link: {
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
});

export default StartServer;
