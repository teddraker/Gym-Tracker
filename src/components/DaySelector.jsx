import { View, Text, StyleSheet, Pressable } from 'react-native';

const DAYS = [
  { id: 'monday', name: 'Monday', shortName: 'Mon', color: '#FF6B6B' },
  { id: 'tuesday', name: 'Tuesday', shortName: 'Tue', color: '#4ECDC4' },
  { id: 'wednesday', name: 'Wednesday', shortName: 'Wed', color: '#45B7D1' },
  { id: 'thursday', name: 'Thursday', shortName: 'Thu', color: '#96CEB4' },
  { id: 'friday', name: 'Friday', shortName: 'Fri', color: '#FFEAA7' },
  { id: 'saturday', name: 'Saturday', shortName: 'Sat', color: '#DDA0DD' },
  { id: 'sunday', name: 'Sunday', shortName: 'Sun', color: '#98D8C8' },
];

export default function DaySelector({ selectedDays = [], onDaysChange, disabled = false }) {
  const toggleDay = (dayId) => {
    if (disabled) return;
    
    if (selectedDays.includes(dayId)) {
      onDaysChange(selectedDays.filter(id => id !== dayId));
    } else {
      onDaysChange([...selectedDays, dayId]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Schedule Days</Text>
      <View style={styles.daysGrid}>
        {DAYS.map((day) => {
          const isSelected = selectedDays.includes(day.id);
          return (
            <Pressable
              key={day.id}
              style={[
                styles.dayButton,
                isSelected && styles.dayButtonSelected,
                isSelected && { backgroundColor: day.color + '20', borderColor: day.color },
                disabled && styles.dayButtonDisabled,
              ]}
              onPress={() => toggleDay(day.id)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.dayShortName,
                  isSelected && styles.dayShortNameSelected,
                  isSelected && { color: day.color },
                ]}
              >
                {day.shortName}
              </Text>
              <Text
                style={[
                  styles.dayName,
                  isSelected && styles.dayNameSelected,
                  isSelected && { color: day.color },
                ]}
              >
                {day.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {selectedDays.length > 0 && (
        <Text style={styles.selectedCount}>
          {selectedDays.length} {selectedDays.length === 1 ? 'day' : 'days'} selected
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    width: '31%',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayButtonSelected: {
    borderWidth: 2,
  },
  dayButtonDisabled: {
    opacity: 0.5,
  },
  dayShortName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8E8E93',
    marginBottom: 2,
  },
  dayShortNameSelected: {
    fontWeight: '800',
  },
  dayName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
  },
  dayNameSelected: {
    fontWeight: '600',
  },
  selectedCount: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});
