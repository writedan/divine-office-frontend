import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import AsyncCall from '../components/AsyncCall';
import EndpointLog from '../components/EndpointLog';
import { useNavigation } from '../Navigation';

const Updater = () => {
  const [downloading, setDownloading] = useState(false);
  const [downloadReloadKey, setDownloadReloadKey] = useState(0);

  const [installing, setInstalling] = useState(false);
  const [installReloadKey, setInstallReloadKey] = useState(0);

  const [behind, setBehind] = useState(0);
  const [missingFrontend, setMissingFrontend] = useState(false);

  const [updateErr, setUpdateErr] = useState(null);

  const { goto } = useNavigation();

  async function checkUpdates() {
  	const backendBehind = await window.electronAPI.getCommitDifference('https://github.com/writedan/divine-office', 'backend');
  	const frontendBehind = await window.electronAPI.getCommitDifference('https://github.com/writedan/divine-office-frontend', 'frontend');

  	setBehind((backendBehind.success && backendBehind.behind) + (frontendBehind.success && frontendBehind.behind));
  	setMissingFrontend(!frontendBehind.success);
  }

  async function download() {
  	await window.electronAPI.updateRepo('https://github.com/writedan/divine-office', 'backend');
  	await window.electronAPI.updateRepo('https://github.com/writedan/divine-office-frontend', 'frontend');
  	handleInstall();
  }

  async function install() {
  	const res = await window.electronAPI.packageFrontend('frontend');
  	if (!res.success) {
  		console.log(res);
  		setUpdateErr(res.error);
  	}
  }

  function handleDownload() {
    setDownloading(true);
    setDownloadReloadKey(downloadReloadKey + 1);
  }

  function handleInstall() {
  	setDownloading(false);
  	setInstalling(true);
  	setInstallReloadKey(installReloadKey + 1);
  }

  return (
    <View style={styles.container}>
      {downloading && (
        <View style={styles.content}>
          <EndpointLog stream="git-log" />
          <AsyncCall call={download} message="Downloading updates" key={downloadReloadKey} />
        </View>
      )}

      {installing && (
      	<View style={styles.content}>
          <EndpointLog stream="npm-package-project" />
          <AsyncCall call={install} message="Installing updates" key={installReloadKey}>
          	{updateErr ? (
          		<Text style={styles.errorMessage}>
            		An error occured while installing updates: {JSON.stringify(updateErr, null, 2)}
            	</Text>
          	) : (
          		<Text>Successfully installed updates. Please restart the app.</Text>
          	)}
          </AsyncCall>
        </View>
      )}

      {!(downloading || installing) && (
        <View style={styles.content}>
          <Text style={styles.title}>Updates</Text>
          <AsyncCall call={checkUpdates} message="Checking for updates">
          	<View>
	            {missingFrontend ? (
	            	<Text style={styles.errorMessage}>
	            		You do not have the frontend installed separately but are running out of the built-in frontend. Please update immediately as this can cause unexpected behavior.
	            	</Text>
	            ) : (
		            <Text style={styles.message}>
		              You are {behind} update{behind == 1 ? '' : 's'} behind.
		            </Text>
	            )}

	            <TouchableOpacity
	              style={styles.button}
	              onPress={handleDownload}
	              activeOpacity={0.7}
	            >
	              <Text style={styles.buttonText}>Install Updates</Text>
	            </TouchableOpacity>
          </View>
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

export default Updater;