import React, { createContext, useContext, useState, ReactNode } from 'react';

type NavigationContextType = {
  currentPage: string;
  goto: (page: string) => void;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [currentPage, setCurrentPage] = useState('cargoinstall');

  const goto = (page: string) => {
    setCurrentPage(page);
  };

  return (
    <NavigationContext.Provider value={{ currentPage, goto }}>
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

export const nav = {
  currentPage: () => useNavigation().currentPage,
  goto: (page: string) => useNavigation().goto(page),
};
