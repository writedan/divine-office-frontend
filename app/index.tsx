import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Hours from './Hours';

const App = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={{ width: '100%' }}>
        <View style={styles.header}>
          <Text style={styles.title}>Divine Office</Text>
        </View>

        <View style={{ flex: 1, width: '100%' }}>
          {/* Main Content */}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f5ec',
    alignItems: 'center',
    flex: 1
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
});

export default App;