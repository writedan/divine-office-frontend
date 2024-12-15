import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncCall from '../components/AsyncCall';
import { useApi } from '../ApiControl';
import { useNavigation } from '../Navigation';

const colors = {
  White: '#ffffff',
  Blue: '#0066cc',
  Green: '#008000',
  Red: '#cc0000',
  Black: '#000000',
  Violet: '#5a2a83',
  Rose: '#ff66b2',
};

const isColorDark = (hexColor) => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance < 0.5;
};

const Calendar = ({ today }) => {
  const [identifiers, setIdentifiers] = useState({});
  const [currentDate, setCurrentDate] = useState(today);
  const [reloadKey, setReloadKey] = useState(0);

  const { getMonthCalendar } = useApi();
  const { goto } = useNavigation();

  const load = async () => {
    setIdentifiers(await getMonthCalendar(currentDate));
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setReloadKey(reloadKey + 1);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setReloadKey(reloadKey + 1);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.emptyDay} />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayData = identifiers[day];
      const bgColor = dayData ? colors[dayData.color] : '#ffffff';
      const isDark = dayData ? isColorDark(bgColor) : false;
      
      days.push(
        <Pressable
          key={day}
          onPress={() => goto('today', {date: new Date(currentDate.getFullYear(), currentDate.getMonth(), day) })}
          style={[
            styles.dayCell,
            { backgroundColor: bgColor }
          ]}
        >
          <Text style={[
            styles.dayNumber,
            isDark ? styles.lightText : styles.darkText
          ]}>
            {day}
          </Text>
          {dayData && (
            <Text 
              numberOfLines={2} 
              style={[
                styles.dayName,
                isDark ? styles.lightText : styles.darkText
              ]}
            >
              {dayData.name}
            </Text>
          )}
        </Pressable>
      );
    }

    return days;
  };

  return (
    <AsyncCall message="Loading calendar..." call={load} key={reloadKey}>
      <View style={styles.container}>
        <View style={styles.stickyHeader}>
          <Pressable onPress={handlePrevMonth} style={styles.navButton}>
            <Icon name="chevron-left" size={24} color="#000000" />
          </Pressable>
          
          <Text style={styles.monthTitle}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          
          <Pressable onPress={handleNextMonth} style={styles.navButton}>
            <Icon name="chevron-right" size={24} color="#000000" />
          </Pressable>
        </View>

        <View style={styles.stickyWeekDays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={styles.weekDay}>
              {day}
            </Text>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.calendar}>
          {renderCalendar()}
        </ScrollView>
      </View>
    </AsyncCall>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  stickyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    position: 'sticky',
    top: 0,
    backgroundColor: '#ffffff',
    zIndex: 1,
    padding: 10,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  stickyWeekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    position: 'sticky',
    top: 48,
    backgroundColor: '#ffffff',
    zIndex: 1,
    paddingVertical: 8,
  },
  weekDay: {
    fontWeight: 'bold',
    width: 45,
    textAlign: 'center',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 4,
    justifyContent: 'flex-start',
    alignItems: 'left',
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dayName: {
  	marginTop: 2,
    fontSize: 16,
    fontWeight: '600',
    flex: 1
  },
  lightText: {
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  darkText: {
    color: '#000000',
  },
});

export default Calendar;
