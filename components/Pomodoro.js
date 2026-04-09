import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  Alert,
  AppState 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveSession } from '../utils/storage';
import { scheduleNotification, cancelNotification } from '../utils/notifications';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-audio';

export default function PomodoroScreen() {
  const [customMinutes, setCustomMinutes] = useState('25');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [appState, setAppState] = useState(AppState.currentState);
  
  const intervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const isRunningRef = useRef(false);
  const timeLRefs = useRef(0);
  const backgroundStartTimeRef = useRef(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    isRunningRef.current = isRunning;
    timeLRefs.current = timeLeft;
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleAppStateChange = (nextAppState) => {
    // App goes to background
    if (appStateRef.current.match(/active/) && nextAppState.match(/inactive|background/)) {
      if (isRunningRef.current) {
        backgroundStartTimeRef.current = Date.now();
      }
    }
    // App comes back to foreground
    else if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      if (isRunningRef.current && backgroundStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - backgroundStartTimeRef.current) / 1000);
        setTimeLeft(prev => Math.max(prev - elapsed, 0));
        backgroundStartTimeRef.current = null;
      }
    }

    appStateRef.current = nextAppState;
    setAppState(nextAppState);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playCompletionSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        {
          uri: 'content://settings/system/notification_sound'
        },
        { shouldPlay: true }
      );
      await sound.playAsync();
    } catch (error) {
      // Sound playback failed silently
    }
  };

  const handleComplete = async () => {
    setIsRunning(false);
    await cancelNotification();

    //play device notification sound
    await playCompletionSound();
    
    // Multiple vibration pattern for completion
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 200);
    } catch (e) {
      console.log('Haptics error:', e);
    }
    
    if (totalTime > 0) {
      const saved = await saveSession(totalTime, 'pomodoro');
      if (saved) {
        Alert.alert('Pomodoro Complete! ✅', `Great work! Time: ${formatTime(totalTime)}`);
      }
    }
    
    setTimeLeft(0);
    setTotalTime(0);
  };

  const handleStart = async () => {
    const minutes = parseInt(customMinutes) || 25;
    if (minutes < 1 || minutes > 180) {
      Alert.alert('Invalid Time', 'Please enter between 1-180 minutes');
      return;
    }

    const seconds = minutes * 60;
    setTimeLeft(seconds);
    setTotalTime(seconds);
    setIsRunning(true);
    await scheduleNotification(seconds, 'Pomodoro Complete!');
  };

  const showToast = (message) => {
    Alert.alert('', message, [{ text: 'OK', style: 'cancel' }], { cancelable: true });
  };

  const handlePause = () => {
    setIsRunning(false);
    cancelNotification();
  };

  const handleResume = async () => {
    setIsRunning(true);
  };

  const handleSave = async () => {
    if (totalTime === 0) {
      Alert.alert('No Session', 'Please start a timer first');
      return;
    }

    const elapsedTime = totalTime - timeLeft;
    if (elapsedTime === 0) {
      Alert.alert('No Time Elapsed', 'Timer just started');
      return;
    }

    const saved = await saveSession(elapsedTime, 'pomodoro');
    if (saved) {
      Alert.alert(
        'Session Saved!',
        `Study time saved: ${formatTime(elapsedTime)}`,
        [
          {
            text: 'Continue Timer',
            style: 'cancel',
          },
          {
            text: 'Reset',
            onPress: async () => {
              setIsRunning(false);
              setTimeLeft(0);
              setTotalTime(0);
              showToast('Timer reset ↻');
            },
          },
        ]
      );
    }
  };

  const handleReset = async () => {
    if (totalTime > 0) {
      const elapsedTime = totalTime - timeLeft;
      Alert.alert(
        'Reset Timer',
        'Do you want to save this session before resetting?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Reset Without Saving',
            style: 'destructive',
            onPress: async () => {
              setIsRunning(false);
              setTimeLeft(0);
              setTotalTime(0);
            },
          },
          {
            text: 'Save & Reset',
            onPress: async () => {
              if (elapsedTime > 0) {
                await saveSession(elapsedTime, 'pomodoro');
              }
              setIsRunning(false);
              setTimeLeft(0);
              setTotalTime(0);
              Alert.alert('Success', 'Session saved and timer reset!');
            },
          },
        ]
      );
    } else {
      setIsRunning(false);
      setTimeLeft(0);
      setTotalTime(0);
      showToast('Timer reset ↻');
    }
  };

  const setPreset = (minutes) => {
    if (totalTime > 0) {
      Alert.alert('Timer Running', 'Please reset current timer first');
      return;
    }
    setCustomMinutes(minutes.toString());
  };

  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {timeLeft === 0 ? (
          <View style={styles.setupContainer}>
            <Text style={styles.setupTitle}>Set Your Focus Time</Text>
            
            <View style={styles.presets}>
              <TouchableOpacity style={styles.presetButton} onPress={() => setPreset(15)}>
                <Text style={styles.presetText}>15m</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetButton} onPress={() => setPreset(25)}>
                <Text style={styles.presetText}>25m</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetButton} onPress={() => setPreset(45)}>
                <Text style={styles.presetText}>45m</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetButton} onPress={() => setPreset(60)}>
                <Text style={styles.presetText}>60m</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.customContainer}>
              <Text style={styles.customLabel}>Custom Minutes</Text>
              <TextInput
                style={styles.input}
                value={customMinutes}
                onChangeText={setCustomMinutes}
                keyboardType="numeric"
                maxLength={3}
                placeholder="Enter minutes"
              />
            </View>
            
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Text style={styles.startButtonText}>Start Pomodoro</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.timerContainer}>
            <View style={styles.circleContainer}>
              <View style={styles.circle}>
                <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
                <Text style={styles.progress}>{Math.round(progressPercent)}%</Text>
              </View>
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  isRunning && styles.pauseButton
                ]}
                onPress={isRunning ? handlePause : handleResume}
              >
                <Text style={styles.buttonText}>
                  {isRunning ? 'Pause' : 'Resume'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.resetButton]}
                onPress={handleReset}
              >
                <Text style={styles.buttonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  setupContainer: {
    alignItems: 'center',
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 30,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
    justifyContent: 'center',
  },
  presetButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  presetText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  customContainer: {
    width: '100%',
    marginBottom: 30,
  },
  customLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  circle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  timer: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#dc2626',
    fontVariant: ['tabular-nums'],
  },
  progress: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '600',
  },
  buttonsContainer: {
    gap: 16,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#10b981',
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  resetButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
  },
  infoText: {
    fontSize: 14,
    color: '#991b1b',
    textAlign: 'center',
    lineHeight: 20,
  },
});