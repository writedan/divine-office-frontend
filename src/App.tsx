import React from 'react';
import { FaHome, FaCalendarAlt, FaSync } from 'react-icons/fa';
import { NavigationProvider, useNavigation } from './NavigationContext';

import CargoInstaller from './CargoInstaller';

const HomePage = () => (
  <>
    <h1>Welcome to the Divine Office</h1>
    <p>This is the Home page where you can access the Divine Office prayers.</p>
  </>
);

const CalendarPage = () => (
  <>
    <h1>Liturgical Calendar</h1>
    <p>This is the Calendar page where you can view the liturgical calendar and important dates.</p>
  </>
);

const BottomNavigation = () => {
  const { goto } = useNavigation();

  return (
    <div className="bottom-nav">
      <button className="nav-item" onClick={() => goto('home')}>
        <FaHome className="icon" />
        <span>Home</span>
      </button>
      <button className="nav-item" onClick={() => goto('calendar')}>
        <FaCalendarAlt className="icon" />
        <span>Calendar</span>
      </button>
    </div>
  );
};

function App() {
  const { currentPage } = useNavigation();

  const renderPageContent = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'calendar':
        return <CalendarPage />;
      case 'cargo-install':
        return <CargoInstaller />;
      default:
        return <HomePage />; 
    }
  };

  return (
    <div className="app">
      <main className={`app-content ${currentPage}`}>
        {renderPageContent()}
      </main>

      {currentPage !== 'cargo-install' && <BottomNavigation />}
    </div>
  );
}

const WrappedApp = () => (
  <NavigationProvider>
    <App />
  </NavigationProvider>
);

export default WrappedApp;
