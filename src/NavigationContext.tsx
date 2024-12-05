import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the context type
type NavigationContextType = {
  currentPage: string;
  goto: (page: string) => void;
};

// Create the context
const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// NavigationProvider component
export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [currentPage, setCurrentPage] = useState('cargoinstall'); // Default to 'home'

  // Function to navigate to a specific page
  const goto = (page: string) => {
    setCurrentPage(page);
  };

  return (
    <NavigationContext.Provider value={{ currentPage, goto }}>
      {children}
    </NavigationContext.Provider>
  );
};

// Hook to use the navigation context
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// Export the nav dictionary
export const nav = {
  currentPage: () => useNavigation().currentPage,
  goto: (page: string) => useNavigation().goto(page),
};
