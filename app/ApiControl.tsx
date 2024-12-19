import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const ApiContext = createContext(undefined);

export const ApiControl = ({ children }) => {
  const [apiUrl, setApiUrl] = useState(null);

  const getMetadata = async (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1);
    const day = String(date.getDate());
    const resp = await axios.get(`${apiUrl}/Identifiers/Day/${year}-${month}-${day}`);
    return resp.data;
  }

  const getMonthCalendar = async (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1);
    const resp = await axios.get(`${apiUrl}/Identifiers/Month/${year}-${month}`);
    return resp.data;
  };

  const getElements = async (date, hour) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1);
    const day = String(date.getDate());
    const resp = await axios.get(`${apiUrl}/Elements/${year}-${month}-${day}/${hour}`);
    return resp.data;
  }

  return (
    <ApiContext.Provider value={{ apiUrl, setApiUrl, getMetadata, getMonthCalendar, getElements }}>
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