import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { getWorkoutConsistency, getMuscleSplit } from '../services/workoutService';
import StrengthChart from '../components/StrengthChart';
import ConsistencyHeatmap from '../components/ConsistencyHeatmap';
import MuscleSplitChart from '../components/MuscleSplitChart';

const USER_ID = 'default_user';

export default function ProgressScreen() {
  const [timeRange, setTimeRange] = useState(30); // 30, 60, or 90 days

  const { data: consistencyData, isLoading: isLoadingConsistency } = useQuery({
    queryKey: ['consistency', USER_ID, timeRange],
    queryFn: () => getWorkoutConsistency(USER_ID, timeRange),
  });

  const { data: muscleSplitData, isLoading: isLoadingMuscle } = useQuery({
    queryKey: ['muscleSplit', USER_ID, timeRange],
    queryFn: () => getMuscleSplit(USER_ID, timeRange),
  });

  const isLoading = isLoadingConsistency || isLoadingMuscle;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Progress Monitor' }} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Progress</Text>
          <Text style={styles.headerSubtitle}>Track your fitness journey</Text>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {[30, 60, 90].map((days) => (
            <Pressable
              key={days}
              style={[
                styles.timeRangeButton,
                timeRange === days && styles.timeRangeButtonActive,
              ]}
              onPress={() => setTimeRange(days)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === days && styles.timeRangeTextActive,
                ]}
              >
                {days} Days
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading your progress...</Text>
          </View>
        ) : (
          <>
            {/* Strength Progress Chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>💪 Strength Progress</Text>
                <Text style={styles.chartSubtitle}>Track your estimated 1RM over time</Text>
              </View>
              <StrengthChart />
            </View>

            {/* Consistency Heatmap */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>🔥 Workout Consistency</Text>
                <Text style={styles.chartSubtitle}>
                  {consistencyData?.length || 0} workout days in the last {timeRange} days
                </Text>
              </View>
              <ConsistencyHeatmap data={consistencyData} />
            </View>

            {/* Muscle Split Breakdown */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>🎯 Muscle Split</Text>
                <Text style={styles.chartSubtitle}>
                  {muscleSplitData?.totalSets || 0} total sets in the last {timeRange} days
                </Text>
              </View>
              <MuscleSplitChart data={muscleSplitData?.breakdown} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
});
