import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import SunCalc from 'suncalc';
import Geolocation from '@react-native-community/geolocation';

const Hours = () => {
  const [hours, setHours] = useState([]);

  useEffect(() => {
    const calculateHours = async () => {
      const now = new Date();
      const { longitude, latitude } = await getUserLocation();

      const times = SunCalc.getTimes(now, latitude, longitude);
      console.log(times);

      const liturgicalHours = [
        { name: 'Matins', time: roundToNearest15(times.nightEnd) },
        { name: 'Lauds', time: roundToNearest15(times.sunrise) },
        { name: 'Prime', time: roundToNearest15(addMinutes(times.sunrise, 60)) },
        { name: 'Terce', time: roundToNearest15(addMinutes(times.sunrise, 180)) },
        { name: 'Sext', time: roundToNearest15(addMinutes(times.sunrise, 360)) },
        { name: 'None', time: roundToNearest15(addMinutes(times.sunrise, 540)) },
        { name: 'Vespers', time: roundToNearest15(times.sunset) },
        { name: 'Compline', time: roundToNearest15(times.night) },
      ];

      setHours(liturgicalHours);
    };

    calculateHours();
  }, []);

  const getUserLocation = () => {
    return new Promise((resolve, reject) => Geolocation.getCurrentPosition(
	        (position) => {
	          const { latitude, longitude } = position.coords;
	          resolve({ latitude, longitude });
	        },
	        (error) => reject(error.message),
	        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      ));
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const addMinutes = (date, minutes) => {
    return new Date(date.getTime() + minutes * 60000);
  };

  const roundToNearest15 = (date) => {
    const ms = 1000 * 60 * 15;
    return new Date(Math.round(date.getTime() / ms) * ms);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Divine Office</Text>
      </View>
      <Text style={styles.sectionHeader}>Saturday in the First Week of Advent</Text>
      <View style={styles.tableContainer}>
        {hours.map((hour, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.column}>{hour.name}</Text>
            <Text style={styles.column}>{formatTime(hour.time)}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.sectionHeader}>2nd Sunday of Advent</Text>
      <View style={styles.tableContainer}>
        {hours.slice(6).map((hour, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.column}>{hour.name}</Text>
            <Text style={styles.column}>{formatTime(hour.time)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f5ec',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
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
  sectionHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'purple',
    textAlign: 'center',
    marginVertical: 20,
  },
  tableContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1c7b7',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1c7b7',
    padding: 10,
    justifyContent: 'space-between',
  },
  column: {
    fontSize: 16,
    color: '#4a3c31',
    flex: 1,
  },
});

export default Hours;
