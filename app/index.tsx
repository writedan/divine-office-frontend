import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { NavigationProvider, useNavigation } from './Navigation';
import { ApiControl } from './ApiControl';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';

import CargoInstaller from './pages/CargoInstaller';
import BackendInstaller from './pages/BackendInstaller';
import StartServer from './pages/StartServer';
import HoursPage from './pages/HoursPage';

const App = () => {
  return (
    <View style={styles.background}> 
      <ApiControl>
        <NavigationProvider>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Divine Office</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              <MainContent />
            </ScrollView>

            <View style={styles.navBar}>
              <NavItem type="entypo" icon="calendar" label="Today" />
              <NavItem type="fontawesome" icon="calendar" label="Calendar" />
              <NavItem type="fontawesome" icon="refresh" label="Update" />
            </View>
          </View>
        </NavigationProvider>
      </ApiControl>
    </View>
  );
};

const MainContent = () => {
  const { currentPage, pageArgs } = useNavigation();

  if (currentPage == 'install-cargo') {
    return <CargoInstaller />;
  }

  if (currentPage == 'install-backend') {
    return <BackendInstaller />;
  }

  if (currentPage == 'start-backend') {
    return <StartServer />;
  }

  if (currentPage == 'today' && pageArgs.date) {
    return <HoursPage now={pageArgs.date} />;
  }

  return <Text>Requested page "{currentPage}" with args {JSON.stringify(pageArgs)} but no such identifier is registered.</Text>;
};

const NavItem = ({ type, icon, label, goto }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const { currentPage } = useNavigation();

  const isActive = currentPage === label.toLowerCase();

  if (currentPage === 'install-cargo' || currentPage === 'install-backend') return null;

  return (
    <Pressable
      style={[
        styles.navItem,
        isHovered && styles.navItemHovered,
        isActive && styles.navItemActive, 
      ]}
      onPress={goto}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
    >
      {type === 'entypo' && (
        <Entypo name={icon} size={30} color={isActive ? '#000' : isHovered ? '#333' : '#4a3c31'} />
      )}
      {type === 'fontawesome' && (
        <FontAwesome name={icon} size={30} color={isActive ? '#000' : isHovered ? '#333' : '#4a3c31'} />
      )}
      <Text style={[styles.navText, isHovered && styles.navTextHovered, isActive && styles.navTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
};


const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#f8f5ec',
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1c7b7',
    paddingBottom: 10,
    width: '100%',
    paddingVertical: 20
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4a3c31',
    textAlign: 'center',
    fontFamily: 'serif',
  },
  scrollView: {
    width: '100%',
  },
  scrollContent: {
    marginBottom: 20,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#d1c7b7',
    width: '100%',
  },
  navItem: {
    alignItems: 'center',
  },
  navItemActive: {
    backgroundColor: '#ebe4d8',
    borderRadius: 10,
    padding: 15,
  },
  navTextActive: {
  },
  navItemHovered: {
    transform: [{ scale: 1.1 }],
  },
  navText: {
    color: '#4a3c31',
    marginTop: 5,
    fontSize: 14,
    fontFamily: 'serif',
  },
  navTextHovered: {
    color: '#333',
  },
});

export default App;
