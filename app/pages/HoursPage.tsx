import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import SunCalc from 'suncalc';

import { useGeolocation } from '../Geolocation';
import { useApi } from '../ApiControl';

const colors = {
  White: '#ffffff',
  Blue: '#0066cc',
  Green: '#008000',
  Red: '#cc0000',
  Black: '#000000',
  Violet: '#5a2a83',
  Rose: '#ff66b2',
};

const Hours = ({now}) => {
  const [hours, setHours] = useState([]);
  const [today, setToday] = useState(null);
  const [tomorrow, setTomorrow] = useState(null);
  const [meals, setMeals] = useState({});
  const [hoveredRow, setHoveredRow] = useState(null);

  const { getMetadata } = useApi();

  const { lat: latitude, lon: longitude } = useGeolocation();

  useEffect(() => {
    const fetchLiturgicalData = async () => {
      const response = await getMetadata(now);

      setToday(response.today);
      setTomorrow(response.tomorrow);
    };

    const calculateHours = () => {
      const times = SunCalc.getTimes(now, latitude, longitude);
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

    fetchLiturgicalData();
    calculateHours();
  }, []);

  const calculateMeals = () => {
  	if (!today) return;
	const meals = [];
		if (today.penance == null || today.penance == 'Abstinence') {
				meals.push({name: 'Dinner', hour: 'Sext'});
		}

		meals.push({name: 'Supper', hour: 'Vespers'});
		setMeals(meals);
	};

  useEffect(calculateMeals, [today]);

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

  const renderRow = (left, right) => (
  	<Pressable
  		style={[
  			hoveredRow === left && styles.hoveredRow
  		]}
  		onHoverIn={() => setHoveredRow(left)}
  		onHoverOut={() => setHoveredRow(null)}
  	>
	  	<View style={styles.row}>
		  <Text style={[styles.column, styles.leftAlign]}>{left}</Text>
		  <Text style={[styles.column, styles.rightAlign]}>
		    {right}
		  </Text>
		</View>
	</Pressable>
  );

  return (
    <View style={{ width: '50%', marginLeft: '25%' }}>
      {today && renderSection(today.name, today.color)}
      {today && renderPenanceMessage(today.penance)}

      <View style={styles.tableContainer}>
        {hours.map((hour, index) => {
          if (tomorrow && (hour.name == 'Vespers' || hour.name == 'Compline')) return null;

          return renderRow(hour.name, formatTime(hour.time));
        })}
      </View>

      {tomorrow && renderSection(tomorrow.name, tomorrow.color)}

      {tomorrow && (
        <View style={styles.tableContainer}>
          {renderRow('First Vespers', formatTime(hours.find(h => h.name === 'Vespers')?.time))}
          {renderRow('First Compline', formatTime(hours.find(h => h.name === 'Compline')?.time))}
        </View>
      )}
    </View>
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
});

export default Hours;
