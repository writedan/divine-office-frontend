import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { NavigationProvider, useNavigation } from './Navigation';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';

import CargoInstaller from './pages/CargoInstaller';
import BackendInstaller from './pages/BackendInstaller';

const App = () => {
  return (
    <NavigationProvider>
      <View style={styles.container}>
        <ScrollView style={{ width: '100%' }}>
          <View style={styles.header}>
            <Text style={styles.title}>Divine Office</Text>
          </View>

          <View style={{ flex: 1, width: '100%' }}>
            <MainContent />
          </View>
        </ScrollView>

        <View style={styles.navBar}>
          <NavItem type="entypo" icon="calendar" label="Today" />
          <NavItem type="fontawesome" icon="calendar" label="Calendar" />
          <NavItem type="fontawesome" icon="refresh" label="Update" />
        </View>
      </View>
    </NavigationProvider>
  );
};

const MainContent = () => {
  const { currentPage } = useNavigation();

  if (currentPage == 'install-cargo') {
    return <CargoInstaller />;
  }

  if (currentPage == 'install-backend') {
    return <BackendInstaller />;
  }

  return <Text>Requested page "{currentPage}" but no such identifier is registered.</Text>;
};

const NavItem = ({ type, icon, label, goto }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const { currentPage } = useNavigation();

  if (currentPage == 'install-cargo') return null;

  return (
    <Pressable
      style={[styles.navItem, isHovered && styles.navItemHovered]}
      onPress={goto}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
    >
     {type === 'entypo' && <Entypo name={icon} size={30} color={isHovered ? '#333' : '#4a3c31'} />} 
     {type === 'fontawesome' && <FontAwesome name={icon} size={30} color={isHovered ? '#333' : '#4a3c31'} />}
      <Text style={[styles.navText, isHovered && styles.navTextHovered]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f5ec',
    alignItems: 'center',
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1c7b7',
    paddingBottom: 10,
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4a3c31',
    textAlign: 'center',
    fontFamily: 'serif',
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
