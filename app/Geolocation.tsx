import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncCall from './components/AsyncCall';

const GeolocationContext = createContext(undefined);

export const Geolocation = ({ children }) => {
  const [geolocation, setGeolocation] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (loaded) return;

    setGeolocation((await axios.get('http://ip-api.com/json/')).data);
    setLoaded(true);
  };

  useEffect(() => console.log('[Geolocation]', geolocation), [geolocation]);

  return (
    <AsyncCall call={load} message={"Fetching geolocation"}>
      <GeolocationContext.Provider value={geolocation || {lat: 0, lon: 0}}>
        {children}
      </GeolocationContext.Provider>
    </AsyncCall>
  );
};

export const useGeolocation = () => {
  const context = useContext(GeolocationContext);
  if (!context) {
    throw new Error('useGeolocation must be used within a Geolocation provider');
  }
  return context;
};