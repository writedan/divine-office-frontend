import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import SunCalc from 'suncalc';

const Hours = () => {
  const [hours, setHours] = useState([]);
  const [today, setToday] = useState(null);
  const [tomorrow, setTomorrow] = useState(null);

  const colors = {
    White: '#ffffff',
    Blue: '#0066cc',
    Green: '#008000',
    Red: '#cc0000',
    Black: '#000000',
    Violet: '#5a2a83',
    Rose: '#ff66b2',
  };

  useEffect(() => {
    const fetchLiturgicalData = async () => {
      // Mock API response
      const response = {
        today: {
          name: "Saturday in the 1st Week of Advent",
          penance: "Fasting",
          color: "White",
          rank: "Feria",
        },
        tomorrow: {
          name: "2nd Sunday of Advent",
          penance: null,
          color: "Violet",
          rank: "StrongSunday",
        },
      };

      setToday(response.today);
      setTomorrow(response.tomorrow);
    };

    const calculateHours = () => {
      const now = new Date();
      const { latitude, longitude } = getUserLocation();

      const times = SunCalc.getTimes(now, latitude, longitude);

      const liturgicalHours = [
        { name: 'Matins', time: roundToNearest15(times.nightEnd) },
        { name: 'Lauds', time: roundToNearest15(times.sunrise) },
        { name: 'Prime', time: roundToNearest15(addMinutes(times.sunrise, 60)) },
        { name: 'Terce', time: roundToNearest15(addMinutes(times.sunrise, 180)) },
        { name: 'Sext', time: roundToNearest15(addMinutes(times.sunrise, 360)) },
        { name: 'None', time: roundToNearest15(addMinutes(times.sunrise, 540)) },
      ];

      if (!tomorrow) {
        liturgicalHours.push(
          { name: 'Vespers', time: roundToNearest15(times.sunset) },
          { name: 'Compline', time: roundToNearest15(times.night) }
        );
      }

      setHours(liturgicalHours);
    };

    fetchLiturgicalData();
    calculateHours();
  }, [tomorrow]);

  const getUserLocation = () => ({
    latitude: 40.7128,
    longitude: -74.0060,
  });

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);

  const roundToNearest15 = (date) => {
    const ms = 1000 * 60 * 15;
    return new Date(Math.round(date.getTime() / ms) * ms);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Divine Office</Text>
      </View>

      {today && (
        <Text style={{ ...styles.sectionHeader, color: colors[today.color] }}>
          {today.name}
        </Text>
      )}

      <View style={styles.tableContainer}>
        {hours.map((hour, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.column}>{hour.name}</Text>
            <Text style={styles.column}>{formatTime(hour.time)}</Text>
          </View>
        ))}
      </View>

      {tomorrow && (
        <>
          <Text style={{ ...styles.sectionHeader, color: colors[tomorrow.color] }}>
            {tomorrow.name}
          </Text>
          <View style={styles.tableContainer}>
            <View style={styles.row}>
              <Text style={styles.column}>First Vespers</Text>
              <Text style={styles.column}>{formatTime(SunCalc.getTimes(new Date(), 40.7128, -74.0060).sunset)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.column}>First Compline</Text>
              <Text style={styles.column}>{formatTime(SunCalc.getTimes(new Date(), 40.7128, -74.0060).night)}</Text>
            </View>
          </View>
        </>
      )}
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
    textAlign: 'center',
    marginBottom: 20,
  },
  tableContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1c7b7',
    backgroundColor: '#fff',
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
    textAlign: 'center',
    flex: 1,
  },
});

export default Hours;
