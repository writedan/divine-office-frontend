import React, { createContext, useContext, useState } from 'react';

const ApiContext = createContext(undefined);

export const ApiControl = ({ children }) => {
  const [apiUrl, setApiUrl] = useState(null);

  return (
    <ApiContext.Provider value={{ apiUrl, setApiUrl }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within a ApiProvider');
  }
  return context;
};