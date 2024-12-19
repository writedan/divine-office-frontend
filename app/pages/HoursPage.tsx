import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import SunCalc from 'suncalc';
import AsyncCall from '../components/AsyncCall';
import { useGeolocation } from '../Geolocation';
import { useApi } from '../ApiControl';
import { useNavigation } from '../Navigation';
import Icon from 'react-native-vector-icons/MaterialIcons'; 

const colors = {
  White: '#ffffff',
  Blue: '#0066cc',
  Green: '#008000',
  Red: '#cc0000',
  Black: '#000000',
  Violet: '#5a2a83',
  Rose: '#ff66b2',
};

const Hours = ({ now }) => {
  const [hours, setHours] = useState([]);
  const [today, setToday] = useState(null);
  const [tomorrow, setTomorrow] = useState(null);
  const [meals, setMeals] = useState({});
  const [hoveredRow, setHoveredRow] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [currentDate, setCurrentDate] = useState(now);

  const { getMetadata } = useApi();
  const { lat: latitude, lon: longitude } = useGeolocation();
  const { goto } = useNavigation();

  const load = async () => {
    const fetchLiturgicalData = async () => {
      const response = await getMetadata(currentDate);
      setToday(response.today);
      setTomorrow(response.tomorrow);
    };

    const calculateHours = () => {
      const times = SunCalc.getTimes(currentDate, latitude, longitude);
      const daylightDuration = times.sunset - times.sunrise;

      const addSunlightHours = (startTime, fraction) => {
        const timeInMs = startTime.getTime() + (daylightDuration * fraction);
        return new Date(timeInMs);
      };

      const liturgicalHours = [
        { name: 'Vigils', time: roundToNearest15(times.nadir) },
        { name: 'Matins', time: roundToNearest15(times.dawn) },
        { name: 'Prime', time: roundToNearest15(addSunlightHours(times.sunrise, 1 / 12)) },
        { name: 'Terce', time: roundToNearest15(addSunlightHours(times.sunrise, 3 / 12)) },
        { name: 'Sext', time: roundToNearest15(addSunlightHours(times.sunrise, 6 / 12)) },
        { name: 'None', time: roundToNearest15(addSunlightHours(times.sunrise, 9 / 12)) },
        { name: 'Vespers', time: roundToNearest15(times.sunset) },
        { name: 'Compline', time: roundToNearest15(times.night) },
      ];

      setHours(liturgicalHours);
    };

    await fetchLiturgicalData();
    calculateHours();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const roundToNearest15 = (date) => {
    const ms = 1000 * 60 * 15;
    return new Date(Math.round(date.getTime() / ms) * ms);
  };

  const renderSection = (title, color) => (
    <Text
      style={[
        styles.sectionHeader,
        { color: colors[color] },
        color.toLowerCase() === 'white' && styles.headerBlackOutline
      ]}
    >
      {title}
    </Text>
  );

  const renderPenanceMessage = (penance) => {
    if (penance === null) {
      return (
        <Text style={styles.penanceText}>
          <Text style={styles.bold}>No penance.</Text> Meat and fish may be taken at dinner.
        </Text>
      );
    } else if (penance === 'Abstinence') {
      return (
        <Text style={styles.penanceText}>
          <Text style={styles.bold}>Abstinence.</Text> Refrain from meat, dairy, and eggs.
        </Text>
      );
    } else if (penance === 'Fasting' || penance === 'Vigil') {
      return (
        <Text style={styles.penanceText}>
          <Text style={styles.bold}>Fasting.</Text> Refrain from meat, fish, oil, wine, dairy, and eggs.
        </Text>
      );
    }
  };

  const renderRow = (left, right, goto) => (
    <Pressable
      style={[
        hoveredRow === left && styles.hoveredRow
      ]}
      onHoverIn={() => setHoveredRow(left)}
      onHoverOut={() => setHoveredRow(null)}
      onPress={goto}
    >
      <View style={styles.row}>
        <Text style={[styles.column, styles.leftAlign]}>{left}</Text>
        <Text style={[styles.column, styles.rightAlign]}>
          {right}
        </Text>
      </View>
    </Pressable>
  );

  const goToYesterday = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
    setReloadKey(prevKey => prevKey + 1);
  };

  const goToTomorrow = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
    setReloadKey(prevKey => prevKey + 1);
  };

  return (
    <AsyncCall call={load} message={"Fetch liturgical information..."} key={reloadKey}>
      <View style={{ width: '50%', marginLeft: '25%' }}>
        <View style={styles.navContainer}>
          <Pressable onPress={() => goToYesterday()}>
            <Icon name="arrow-back" size={30} color={colors.Black} />
          </Pressable>

          {today && renderSection(today.name, today.color)}

          <Pressable onPress={() => goToTomorrow()}>
            <Icon name="arrow-forward" size={30} color={colors.Black} />
          </Pressable>
        </View>

        {today && renderPenanceMessage(today.penance)}

        <View style={styles.tableContainer}>
          {hours.map((hour, index) => {
            if (tomorrow && (hour.name == 'Vespers' || hour.name == 'Compline')) return null;

            return renderRow(hour.name, formatTime(hour.time), () => goto('hour', {date: currentDate, hour: hour.name.toLowerCase()}));
          })}
        </View>

        {tomorrow && renderSection(tomorrow.name, tomorrow.color)}

        {tomorrow && (
          <View style={styles.tableContainer}>
            {renderRow('First Vespers', formatTime(hours.find(h => h.name === 'Vespers')?.time), () => goto('hour', {date: currentDate, hour: 'vespers'}))}
            {renderRow('First Compline', formatTime(hours.find(h => h.name === 'Compline')?.time), () => goto('hour', {date: currentDate, hour: 'compline'}))}
          </View>
        )}
      </View>
    </AsyncCall>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  headerBlackOutline: {
    WebkitTextStroke: '1px black',
  },
  penanceText: {
    fontSize: 16,
    color: '#4a3c31',
    marginBottom: 10,
    textAlign: 'center',
  },
  bold: {
    fontWeight: 'bold',
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
  },
  leftAlign: {
    textAlign: 'left',
    flex: 1,
  },
  rightAlign: {
    textAlign: 'right',
    flex: 1,
  },
  hoveredRow: {
    backgroundColor: '#f4f0f8', 
    transition: 'all 0.2s ease',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
});

export default Hours;
