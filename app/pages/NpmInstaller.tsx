import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import AsyncCall from '../components/AsyncCall';
import EndpointLog from '../components/EndpointLog';
import { useNavigation } from '../Navigation';

const NpmInstaller = () => {
  const [npmInstalled, setNpmInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installReloadKey, setInstallReloadKey] = useState(0);

  const { goto } = useNavigation();

  async function check() {
    const res = await window.electronAPI.isNpmInstalled();

    if (res) {
      goto('install-backend');
      return;
    }

    setNpmInstalled(await window.electronAPI.isNpmInstalled());
  }

  async function install() {
    const res = await window.electronAPI.runNvmInstaller();
    if (res.success) {
      goto('install-backend');
    }
  }

  function handleInstall() {
    setInstalling(true);
    setInstallReloadKey(installReloadKey + 1);
  }

  return (
    <View style={styles.container}>
      {installing ? (
        <View style={styles.content}>
          <EndpointLog stream="npm-install" />
          <AsyncCall call={install} message="Installing NPM" key={installReloadKey}>
            <Text style={styles.errorMessage}>
              NPM failed to install. Please visit{' '}
              <Text
                style={styles.link}
                onPress={() => Linking.openURL('https://nodejs.org/en/download/package-manager')}
              >
                nodejs.org
              </Text>{' '}
              and install it manually if problems persist.
            </Text>
          </AsyncCall>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>NPM Installation</Text>
          <AsyncCall call={check} message="Checking for NPM Installation">
            {npmInstalled ? (
              <Text style={styles.message}>NPM is already installed!</Text>
            ) : (
              <View>
                <Text style={styles.message}>
                  This application depends on NPM and Node.js, a JavaScript runtime environment. We did not detect it on your system.
                </Text>
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleInstall}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>Install NPM</Text>
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

export default NpmInstaller;