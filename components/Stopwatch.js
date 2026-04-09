import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  AppState 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveSession } from '../utils/storage';

export default function StopwatchScreen() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  
  const intervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const isRunningRef = useRef(false);
  const timeRef = useRef(0);
  const backgroundStartTimeRef = useRef(null);

  useEffect(() => {
    isRunningRef.current = isRunning;
    timeRef.current = time;
  }, [isRunning, time]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 1);
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
  }, [isRunning]);

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
        setTime(prev => prev + elapsed);
        backgroundStartTimeRef.current = null;
      }
    }

    appStateRef.current = nextAppState;
    setAppState(nextAppState);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const showToast = (message) => {
    Alert.alert('', message, [{ text: 'OK', style: 'cancel' }], { cancelable: true });
  };

  const handleSave = async () => {
    if (time === 0) {
      Alert.alert('No Time', 'Please start the timer first');
      return;
    }

    const saved = await saveSession(time, 'stopwatch');
    if (saved) {
      Alert.alert(
        'Session Saved!', 
        `Study time saved: ${formatTime(time)}`,
        [
          {
            text: 'Continue',
            style: 'cancel',
          },
          {
            text: 'Reset',
            onPress: () => {
              setIsRunning(false);
              setTime(0);
              backgroundStartTimeRef.current = null;
              showToast('Timer reset ↻');
            },
          },
        ]
      );
    }
  };

  const handleReset = () => {
    if (time > 0) {
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
            onPress: () => {
              setIsRunning(false);
              setTime(0);
              backgroundStartTimeRef.current = null;
              showToast('Timer reset ↻');
            },
          },
          {
            text: 'Save & Reset',
            onPress: async () => {
              await saveSession(time, 'stopwatch');
              setIsRunning(false);
              setTime(0);
              backgroundStartTimeRef.current = null;
              Alert.alert('Success', 'Session saved and timer reset!');
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.timerContainer}>
          <Text style={styles.timer}>{formatTime(time)}</Text>
          <Text style={styles.label}>
            {isRunning ? 'Recording...' : time > 0 ? 'Paused' : 'Ready to Start'}
          </Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              isRunning && styles.pauseButton
            ]}
            onPress={handleStartPause}
          >
            <Text style={styles.buttonText}>
              {isRunning ? 'Pause' : time > 0 ? 'Resume' : 'Start'}
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
  timerContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  timer: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#2563eb',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  label: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    fontWeight: '500',
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
  disabledText: {
    opacity: 0.5,
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 40,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
    lineHeight: 20,
  },
});