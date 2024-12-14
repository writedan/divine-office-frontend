import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import AsyncCall from '../components/AsyncCall';
import EndpointLog from '../components/EndpointLog';
import { useNavigation } from '../Navigation';

const BackendInstaller = () => {
  const [backendInstalled, setBackendInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  const { goto } = useNavigation();

  async function check() {
    const res = await window.electronAPI.fileExists('backend');

    if (res) {
      goto('start-backend');
      return;
    }

    setBackendInstalled(await window.electronAPI.fileExists('backend'));
  }

  async function install() {
    const res = await window.electronAPI.updateRepo('https://github.com/writedan/divine-office', 'backend');
    if (res.success) {
      goto('start-backend');
    }
  }

  function handleInstall() {
    setInstalling(true);
  }

  return (
    <View style={styles.container}>
      {installing ? (
        <View style={styles.content}>
          <EndpointLog stream="git-log" />
          <AsyncCall call={install} message="Installing Backend">
            <Text style={styles.errorMessage}>
              Backend installation failed.
            </Text>
          </AsyncCall>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>Backend Installation</Text>
          <AsyncCall call={check} message="Checking for backend installation">
            {backendInstalled ? (
              <Text style={styles.message}>Backend is already installed!</Text>
            ) : (
              <View>
                <Text style={styles.message}>
                  This application requires a backend to function. We did not detect it on your system.
                </Text>
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleInstall}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>Install Backend</Text>
                </TouchableOpacity>
              </View>
            )}
          </AsyncCall>
        </View>
      )}
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

export default BackendInstaller;
