import { View, Text, StyleSheet } from 'react-native';

export default function ConsistencyHeatmap({ data = [] }) {
  // Create a map of dates to workout data
  const workoutMap = new Map();
  data.forEach(day => {
    workoutMap.set(day.date, day);
  });

  // Generate last 90 days
  const days = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      dayOfWeek: date.getDay(),
      workout: workoutMap.get(dateStr),
    });
  }

  // Group by weeks
  const weeks = [];
  let currentWeek = [];
  
  // Add empty cells for the first week to align with day of week
  const firstDayOfWeek = days[0].dayOfWeek;
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }

  days.forEach((day, index) => {
    currentWeek.push(day);
    
    if (currentWeek.length === 7 || index === days.length - 1) {
      // Fill remaining days with null if it's the last week
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  const getIntensityColor = (workout) => {
    if (!workout) return '#F0F0F0';
    
    const setCount = workout.setCount;
    if (setCount >= 20) return '#006D32'; // Dark green
    if (setCount >= 15) return '#26A641'; // Medium-dark green
    if (setCount >= 10) return '#39D353'; // Medium green
    if (setCount >= 5) return '#9BE9A8'; // Light green
    return '#C6E48B'; // Very light green
  };

  const totalWorkoutDays = data.length;
  const currentStreak = calculateStreak(data);

  return (
    <View style={styles.container}>
      {/* Day labels */}
      <View style={styles.dayLabels}>
        <Text style={styles.dayLabel}>S</Text>
        <Text style={styles.dayLabel}>M</Text>
        <Text style={styles.dayLabel}>T</Text>
        <Text style={styles.dayLabel}>W</Text>
        <Text style={styles.dayLabel}>T</Text>
        <Text style={styles.dayLabel}>F</Text>
        <Text style={styles.dayLabel}>S</Text>
      </View>

      {/* Heatmap grid */}
      <View style={styles.grid}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((day, dayIndex) => (
              <View
                key={`${weekIndex}-${dayIndex}`}
                style={[
                  styles.cell,
                  { backgroundColor: day ? getIntensityColor(day.workout) : 'transparent' }
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        <View style={[styles.legendCell, { backgroundColor: '#F0F0F0' }]} />
        <View style={[styles.legendCell, { backgroundColor: '#C6E48B' }]} />
        <View style={[styles.legendCell, { backgroundColor: '#9BE9A8' }]} />
        <View style={[styles.legendCell, { backgroundColor: '#39D353' }]} />
        <View style={[styles.legendCell, { backgroundColor: '#26A641' }]} />
        <View style={[styles.legendCell, { backgroundColor: '#006D32' }]} />
        <Text style={styles.legendText}>More</Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalWorkoutDays}</Text>
          <Text style={styles.statLabel}>Workout Days</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round((totalWorkoutDays / 90) * 100)}%</Text>
          <Text style={styles.statLabel}>Consistency</Text>
        </View>
      </View>
    </View>
  );
}

function calculateStreak(data) {
  if (data.length === 0) return 0;
  
  // Sort by date descending
  const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sorted.length; i++) {
    const workoutDate = new Date(sorted[i].date);
    workoutDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - streak);
    
    const diffDays = Math.floor((expectedDate - workoutDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      streak++;
    } else if (diffDays > 1) {
      break;
    }
  }
  
  return streak;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    width: 14,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 16,
  },
  week: {
    flex: 1,
    gap: 3,
  },
  cell: {
    aspectRatio: 1,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 16,
  },
  legendText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#26A641',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
  },
});
