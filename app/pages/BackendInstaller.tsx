import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import AsyncCall from '../components/AsyncCall';
import EndpointLog from '../components/EndpointLog';
import { useNavigation } from '../Navigation';

const BackendInstaller = () => {
  const [backendInstalled, setBackendInstalled] = useState(false);
  const [installing, setInstalling] = useState(true);
  const [installReloadKey, setInstallReloadKey] = useState(0);

  const { goto } = useNavigation();

  async function install() {
    const res = await window.electronAPI.updateBackend();
    if (res.success) {
      goto('start-backend');
    } else {
      setBackendInstalled(res.installed);
    }
  }

  const continueOn = () => {
    goto('start-backend');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Automatic Updates</Text>
        <EndpointLog stream="install-log" />
        <AsyncCall call={install} message="Installing backend (this can take a few minutes)" key={installReloadKey}>
          <Text style={styles.errorMessage}>
            Backend installation failed. {!backendInstalled && "We did not detect a previous installation."}
          </Text>
          <View style={{ flex: 1, marginTop: 15 }}>
            {backendInstalled && (
              <>
                <Text style={styles.message}>
                  You had previously installed the backend. While updates failed you may continue to use the previous version.
                </Text>
                <TouchableOpacity
                  style={styles.button}
                  onPress={continueOn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </AsyncCall>
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

export default BackendInstaller;
