import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExerciseHistory, getUserWorkoutSets } from '../services/workoutService';

const USER_ID = 'default_user';

export default function StrengthChart() {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [availableExercises, setAvailableExercises] = useState([]);

  // Fetch all user's workout sets to get unique exercises
  const { data: allSets, isLoading: isLoadingSets } = useQuery({
    queryKey: ['userWorkoutSets', USER_ID],
    queryFn: () => getUserWorkoutSets(USER_ID),
  });

  // Extract unique exercises from workout sets
  useEffect(() => {
    if (allSets && allSets.length > 0) {
      const exerciseMap = new Map();
      
      // Count sets per exercise to show most tracked exercises first
      allSets.forEach(set => {
        const count = exerciseMap.get(set.exerciseName) || 0;
        exerciseMap.set(set.exerciseName, count + 1);
      });
      
      // Sort by frequency and take top exercises
      const exercises = Array.from(exerciseMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name)
        .slice(0, 10); // Show top 10 most tracked exercises
      
      setAvailableExercises(exercises);
      
      // Set first exercise as default if none selected
      if (!selectedExercise && exercises.length > 0) {
        setSelectedExercise(exercises[0]);
      }
    }
  }, [allSets]);

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['exerciseHistory', selectedExercise, USER_ID],
    queryFn: () => getExerciseHistory(selectedExercise, USER_ID, 10),
    enabled: !!selectedExercise,
  });

  const sessions = historyData?.sessions || [];
  const maxValue = Math.max(...sessions.map(s => s.max1RM), 0);

  const isLoading = isLoadingSets || isLoadingHistory;

  return (
    <View style={styles.container}>
      {isLoadingSets ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.emptyText}>Loading exercises...</Text>
        </View>
      ) : availableExercises.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No exercises tracked yet</Text>
          <Text style={styles.emptySubtext}>Start logging sets to see your strength progress!</Text>
        </View>
      ) : (
        <>
          {/* Exercise Selector */}
          <View style={styles.exerciseSelector}>
            {availableExercises.map((exercise) => (
              <Pressable
                key={exercise}
                style={[
                  styles.exerciseButton,
                  selectedExercise === exercise && styles.exerciseButtonActive,
                ]}
                onPress={() => setSelectedExercise(exercise)}
              >
                <Text
                  style={[
                    styles.exerciseButtonText,
                    selectedExercise === exercise && styles.exerciseButtonTextActive,
                  ]}
                >
                  {exercise.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Text>
              </Pressable>
            ))}
          </View>

          {isLoadingHistory ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.emptyText}>Loading history...</Text>
            </View>
          ) : sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No data yet</Text>
              <Text style={styles.emptySubtext}>Start logging sets to see your progress!</Text>
            </View>
          ) : (
            <>
              <View style={styles.chartContainer}>
                {/* Y-axis labels */}
                <View style={styles.yAxis}>
                  <Text style={styles.yAxisLabel}>{Math.round(maxValue)}kg</Text>
                  <Text style={styles.yAxisLabel}>{Math.round(maxValue * 0.5)}kg</Text>
                  <Text style={styles.yAxisLabel}>0kg</Text>
                </View>

                {/* Chart area */}
                <View style={styles.chartArea}>
                  {/* Grid lines */}
                  <View style={styles.gridLine} />
                  <View style={[styles.gridLine, { top: '50%' }]} />
                  <View style={[styles.gridLine, { top: '100%' }]} />

                  {/* Bars */}
                  <View style={styles.barsContainer}>
                    {sessions.slice().reverse().map((session, index) => {
                      const heightPercent = (session.max1RM / maxValue) * 100;
                      const date = new Date(session.date);
                      const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;
                      
                      return (
                        <View key={index} style={styles.barWrapper}>
                          <View style={styles.barContainer}>
                            <View 
                              style={[
                                styles.bar,
                                { height: `${heightPercent}%` }
                              ]}
                            >
                              <Text style={styles.barValue}>{session.max1RM}</Text>
                            </View>
                          </View>
                          <Text style={styles.xAxisLabel}>{dateLabel}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Stats Summary */}
              {sessions.length > 0 && (
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{sessions[0]?.max1RM || 0}kg</Text>
                    <Text style={styles.statLabel}>Latest 1RM</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{sessions.length}</Text>
                    <Text style={styles.statLabel}>Sessions</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {sessions[0] && sessions[sessions.length - 1] 
                        ? `${sessions[0].max1RM > sessions[sessions.length - 1].max1RM ? '+' : ''}${sessions[0].max1RM - sessions[sessions.length - 1].max1RM}kg`
                        : '0kg'
                      }
                    </Text>
                    <Text style={styles.statLabel}>Progress</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  exerciseSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  exerciseButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  exerciseButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  exerciseButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  exerciseButtonTextActive: {
    color: '#FFFFFF',
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
  },
  chartContainer: {
    flexDirection: 'row',
    height: 200,
    marginBottom: 30, // Increased bottom margin to make room for labels
  },
  yAxis: {
    width: 50,
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingBottom: 0, // Ensure axis numbers align with grid lines
  },
  yAxisLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    // No padding bottom here
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end', // Ensure content sits at bottom
    maxWidth: 50,
    height: '100%', // Take full height of chart area
    position: 'relative', // For absolute positioning of label
  },
  barContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    // REMOVED paddingBottom: 20 (This was the culprit!)
  },
  bar: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 4, // Keeps small bars visible
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  xAxisLabel: {
    position: 'absolute', // Take label out of flow
    bottom: -22, // Push it below the chart area
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
    width: '100%',
    textAlign: 'center',
  },
  statsContainer: {
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
    color: '#007AFF',
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