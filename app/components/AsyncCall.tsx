import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator as RNActivityIndicator } from 'react-native';

const AsyncCall = ({ call, message, children }) => {
  const [running, setRunning] = useState(false);

  console.log('[AsyncCall init]', message, running);

  useEffect(() => {
    console.log('[AsyncCall triggered]', message, running);

    const load = async () => {
      //if (running) return;

      try {
        setRunning(true);
        console.log('[AsyncCall load]', message);
        await call(); 
      } catch (error) {
        console.error('[AsyncCall error]', error);
      } finally {
        setRunning(false);
      }
    };

    load(); 

    return () => setRunning(false); 
  }, []); 

  return running ? (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <RNActivityIndicator size="large" color="#0000ff" />
      <Text>{message}</Text>
    </View>
  ) : (
    children
  );
};

export default AsyncCall;
