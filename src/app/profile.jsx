import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, saveUserProfile } from '../services/workoutService';

const USER_ID = 'default_user';

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  
  // Form state
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [fatMass, setFatMass] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [bodyFatPercentage, setBodyFatPercentage] = useState('');
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [arms, setArms] = useState('');
  const [thighs, setThighs] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [customFields, setCustomFields] = useState([]);

  // Calculated values
  const [bmi, setBmi] = useState(null);
  const [leanMass, setLeanMass] = useState(null);

  // Fetch profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', USER_ID],
    queryFn: () => getUserProfile(USER_ID),
  });

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setWeight(profile.weight?.toString() || '');
      setHeight(profile.height?.toString() || '');
      setFatMass(profile.fatMass?.toString() || '');
      setMuscleMass(profile.muscleMass?.toString() || '');
      setBodyFatPercentage(profile.bodyFatPercentage?.toString() || '');
      setWaist(profile.waist?.toString() || '');
      setChest(profile.chest?.toString() || '');
      setArms(profile.arms?.toString() || '');
      setThighs(profile.thighs?.toString() || '');
      setAge(profile.age?.toString() || '');
      setGender(profile.gender || '');
      setGoalWeight(profile.goalWeight?.toString() || '');
      setNotes(profile.notes || '');
      setCustomFields(profile.customFields || []);
    }
  }, [profile]);

  // Calculate BMI and lean mass when values change
  useEffect(() => {
    if (weight && height) {
      const w = parseFloat(weight);
      const h = parseFloat(height) / 100; // convert cm to meters
      if (w > 0 && h > 0) {
        const calculatedBMI = (w / (h * h)).toFixed(1);
        setBmi(calculatedBMI);
      }
    } else {
      setBmi(null);
    }

    if (weight && fatMass) {
      const w = parseFloat(weight);
      const f = parseFloat(fatMass);
      if (w > 0 && f >= 0) {
        const calculatedLean = (w - f).toFixed(1);
        setLeanMass(calculatedLean);
      }
    } else {
      setLeanMass(null);
    }
  }, [weight, height, fatMass]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: saveUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile', USER_ID]);
      Alert.alert('Success', 'Profile saved successfully!');
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
      console.error('Save error:', error);
    },
  });

  const handleSave = () => {
    const profileData = {
      userId: USER_ID,
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseFloat(height) : null,
      fatMass: fatMass ? parseFloat(fatMass) : null,
      muscleMass: muscleMass ? parseFloat(muscleMass) : null,
      bodyFatPercentage: bodyFatPercentage ? parseFloat(bodyFatPercentage) : null,
      waist: waist ? parseFloat(waist) : null,
      chest: chest ? parseFloat(chest) : null,
      arms: arms ? parseFloat(arms) : null,
      thighs: thighs ? parseFloat(thighs) : null,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      goalWeight: goalWeight ? parseFloat(goalWeight) : null,
      notes: notes || '',
      customFields: customFields.filter(f => f.name && f.value),
    };

    saveMutation.mutate(profileData);
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { id: Date.now().toString(), name: '', value: '', unit: '' }]);
  };

  const updateCustomField = (id, field, value) => {
    setCustomFields(customFields.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const removeCustomField = (id) => {
    setCustomFields(customFields.filter(f => f.id !== id));
  };

  const getBMICategory = (bmiValue) => {
    const bmi = parseFloat(bmiValue);
    if (bmi < 18.5) return { text: 'Underweight', color: '#FF9500' };
    if (bmi < 25) return { text: 'Normal', color: '#34C759' };
    if (bmi < 30) return { text: 'Overweight', color: '#FF9500' };
    return { text: 'Obese', color: '#FF3B30' };
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Profile' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Profile & Body Composition' }} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Basic Information</Text>
          
          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="25"
                placeholderTextColor="#C7C7CC"
                keyboardType="number-pad"
                value={age}
                onChangeText={setAge}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderButtons}>
                <Pressable
                  style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                  onPress={() => setGender('male')}
                >
                  <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextActive]}>
                    Male
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                  onPress={() => setGender('female')}
                >
                  <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextActive]}>
                    Female
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Body Metrics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Body Metrics</Text>
          
          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="70.0"
                placeholderTextColor="#C7C7CC"
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="175"
                placeholderTextColor="#C7C7CC"
                keyboardType="number-pad"
                value={height}
                onChangeText={setHeight}
              />
            </View>
          </View>

          {bmi && (
            <View style={styles.calculatedCard}>
              <Text style={styles.calculatedLabel}>BMI</Text>
              <Text style={styles.calculatedValue}>{bmi}</Text>
              <Text style={[styles.calculatedCategory, { color: getBMICategory(bmi).color }]}>
                {getBMICategory(bmi).text}
              </Text>
            </View>
          )}
        </View>

        {/* Body Composition Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💪 Body Composition</Text>
          
          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Fat Mass (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="15.0"
                placeholderTextColor="#C7C7CC"
                keyboardType="decimal-pad"
                value={fatMass}
                onChangeText={setFatMass}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Muscle Mass (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="35.0"
                placeholderTextColor="#C7C7CC"
                keyboardType="decimal-pad"
                value={muscleMass}
                onChangeText={setMuscleMass}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Body Fat %</Text>
              <TextInput
                style={styles.input}
                placeholder="15.0"
                placeholderTextColor="#C7C7CC"
                keyboardType="decimal-pad"
                value={bodyFatPercentage}
                onChangeText={setBodyFatPercentage}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Goal Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="75.0"
                placeholderTextColor="#C7C7CC"
                keyboardType="decimal-pad"
                value={goalWeight}
                onChangeText={setGoalWeight}
              />
            </View>
          </View>

          {leanMass && (
            <View style={styles.calculatedCard}>
              <Text style={styles.calculatedLabel}>Lean Body Mass</Text>
              <Text style={styles.calculatedValue}>{leanMass} kg</Text>
              <Text style={styles.calculatedSubtext}>Weight - Fat Mass</Text>
            </View>
          )}
        </View>

        {/* Measurements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📏 Measurements (cm)</Text>
          
          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Waist</Text>
              <TextInput
                style={styles.input}
                placeholder="80"
                placeholderTextColor="#C7C7CC"
                keyboardType="decimal-pad"
                value={waist}
                onChangeText={setWaist}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Chest</Text>
              <TextInput
                style={styles.input}
                placeholder="95"
                placeholderTextColor="#C7C7CC"
                keyboardType="decimal-pad"
                value={chest}
                onChangeText={setChest}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Arms</Text>
              <TextInput
                style={styles.input}
                placeholder="35"
                placeholderTextColor="#C7C7CC"
                keyboardType="decimal-pad"
                value={arms}
                onChangeText={setArms}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Thighs</Text>
              <TextInput
                style={styles.input}
                placeholder="55"
                placeholderTextColor="#C7C7CC"
                keyboardType="decimal-pad"
                value={thighs}
                onChangeText={setThighs}
              />
            </View>
          </View>
        </View>

        {/* Custom Fields Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚡ Custom Body Metrics</Text>
            <Pressable style={styles.addButton} onPress={addCustomField}>
              <Text style={styles.addButtonText}>+ Add Field</Text>
            </Pressable>
          </View>
          
          {customFields.length === 0 ? (
            <Text style={styles.emptyText}>
              Add custom body composition metrics like "Neck", "Calves", "Body Water %", etc.
            </Text>
          ) : (
            customFields.map((field) => (
              <View key={field.id} style={styles.customFieldRow}>
                <View style={styles.customFieldInputs}>
                  <TextInput
                    style={[styles.input, styles.customFieldName]}
                    placeholder="Metric name (e.g., Neck)"
                    placeholderTextColor="#C7C7CC"
                    value={field.name}
                    onChangeText={(text) => updateCustomField(field.id, 'name', text)}
                  />
                  <TextInput
                    style={[styles.input, styles.customFieldValue]}
                    placeholder="Value"
                    placeholderTextColor="#C7C7CC"
                    keyboardType="decimal-pad"
                    value={field.value}
                    onChangeText={(text) => updateCustomField(field.id, 'value', text)}
                  />
                  <TextInput
                    style={[styles.input, styles.customFieldUnit]}
                    placeholder="Unit"
                    placeholderTextColor="#C7C7CC"
                    value={field.unit}
                    onChangeText={(text) => updateCustomField(field.id, 'unit', text)}
                  />
                </View>
                <Pressable 
                  style={styles.removeButton}
                  onPress={() => removeCustomField(field.id)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any notes about your fitness goals, diet, or training..."
            placeholderTextColor="#C7C7CC"
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Save Button */}
        <Pressable 
          style={[styles.saveButton, saveMutation.isPending && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Profile</Text>
          )}
        </Pressable>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  genderButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  calculatedCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  calculatedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  calculatedValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  calculatedCategory: {
    fontSize: 16,
    fontWeight: '600',
  },
  calculatedSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  notesInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  customFieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  customFieldInputs: {
    flex: 1,
    gap: 8,
  },
  customFieldName: {
    flex: 1,
  },
  customFieldValue: {
    flex: 1,
  },
  customFieldUnit: {
    flex: 1,
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  removeButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 40,
  },
});
