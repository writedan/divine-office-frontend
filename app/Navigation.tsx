import React, { createContext, useContext, useState } from 'react';

const NavigationContext = createContext(undefined);

export const NavigationProvider = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('install-cargo');
  const [pageArgs, setPageArgs] = useState({});

  const goto = (page, args={}) => {
    setCurrentPage(page);
    setPageArgs(args);
  };

  return (
    <NavigationContext.Provider value={{ currentPage, pageArgs, goto }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};