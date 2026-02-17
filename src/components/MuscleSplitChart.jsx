import { View, Text, StyleSheet } from 'react-native';

const MUSCLE_COLORS = {
  chest: '#FF6B6B',
  back: '#4ECDC4',
  shoulders: '#45B7D1',
  biceps: '#96CEB4',
  triceps: '#FFEAA7',
  legs: '#DDA0DD',
  core: '#98D8C8',
  forearms: '#FFB6B9',
  glutes: '#FEC8D8',
  calves: '#957DAD',
  default: '#C7C7CC',
};

export default function MuscleSplitChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No workout data yet</Text>
        <Text style={styles.emptySubtext}>Start logging exercises to see your muscle split!</Text>
      </View>
    );
  }

  const totalSets = data.reduce((sum, item) => sum + item.sets, 0);

  // Calculate pie chart segments
  let currentAngle = -90; // Start from top
  const segments = data.map(item => {
    const percentage = (item.sets / totalSets) * 100;
    const angle = (percentage / 100) * 360;
    const segment = {
      ...item,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      color: MUSCLE_COLORS[item.muscle.toLowerCase()] || MUSCLE_COLORS.default,
    };
    currentAngle += angle;
    return segment;
  });

  return (
    <View style={styles.container}>
      {/* Simple Pie Chart using Views */}
      <View style={styles.pieContainer}>
        <View style={styles.pieChart}>
          {segments.map((segment, index) => {
            // For simplicity, we'll show colored bars instead of actual pie slices
            // A proper implementation would use SVG or Canvas
            return (
              <View
                key={index}
                style={[
                  styles.pieSegment,
                  {
                    backgroundColor: segment.color,
                    flex: segment.percentage,
                  }
                ]}
              />
            );
          })}
        </View>
        
        {/* Center label */}
        <View style={styles.centerLabel}>
          <Text style={styles.centerValue}>{totalSets}</Text>
          <Text style={styles.centerText}>Total Sets</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {segments.map((segment, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: segment.color }]} />
            <View style={styles.legendInfo}>
              <Text style={styles.legendLabel}>
                {segment.muscle.charAt(0).toUpperCase() + segment.muscle.slice(1)}
              </Text>
              <Text style={styles.legendValue}>
                {segment.sets} sets ({Math.round(segment.percentage)}%)
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Top 3 Muscles */}
      <View style={styles.topMuscles}>
        <Text style={styles.topMusclesTitle}>Top 3 Muscle Groups</Text>
        <View style={styles.topMusclesList}>
          {segments.slice(0, 3).map((segment, index) => (
            <View key={index} style={styles.topMuscleItem}>
              <View style={styles.topMuscleRank}>
                <Text style={styles.topMuscleRankText}>{index + 1}</Text>
              </View>
              <View style={styles.topMuscleInfo}>
                <Text style={styles.topMuscleName}>
                  {segment.muscle.charAt(0).toUpperCase() + segment.muscle.slice(1)}
                </Text>
                <Text style={styles.topMuscleSets}>{segment.sets} sets</Text>
              </View>
              <View style={[styles.topMuscleBar, { backgroundColor: segment.color }]}>
                <View 
                  style={[
                    styles.topMuscleBarFill,
                    { 
                      width: `${segment.percentage}%`,
                      backgroundColor: segment.color,
                    }
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
  },
  pieContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  pieChart: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 8,
    borderColor: '#F8F8F8',
  },
  pieSegment: {
    height: '100%',
  },
  centerLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -30 }],
    width: 80,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
  },
  centerValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  centerText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  legend: {
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 12,
  },
  legendInfo: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  legendValue: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  topMuscles: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  topMusclesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  topMusclesList: {
    gap: 12,
  },
  topMuscleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topMuscleRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topMuscleRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topMuscleInfo: {
    flex: 1,
  },
  topMuscleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  topMuscleSets: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  topMuscleBar: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  topMuscleBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
