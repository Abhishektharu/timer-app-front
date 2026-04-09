import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Text, 
  TouchableOpacity,
  RefreshControl 
} from 'react-native';
import YearlyChart from '../components/YearlyChart';

import { SafeAreaView } from 'react-native-safe-area-context';
import { getTodayTotal, getWeeklyData, getMonthlyData, getAllSessions, getMonthData, getWeekTotal, getMonthTotal,getAllMonthsData } from '../utils/storage';

export default function Home() {
  const [refreshing, setRefreshing] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [viewMode, setViewMode] = useState('week'); // 'week', 'month', or 'months'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonthData, setSelectedMonthData] = useState([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [allMonthsData, setAllMonthsData] = useState([]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (viewMode === 'months') {
      loadMonthData(selectedMonth, selectedYear);
    }
  }, [selectedMonth, selectedYear, viewMode]);

  const loadData = async () => {
    const total = await getTodayTotal();
    setTodayTotal(total);
    
    const weekly = await getWeeklyData();
    setWeeklyData(weekly);

    const monthly = await getMonthlyData();
    setMonthlyData(monthly);

    const sessions = await getAllSessions();
    setAllSessions(sessions);

    // Calculate totals
    const wTotal = await getWeekTotal();
    setWeekTotal(wTotal);

    const mTotal = await getMonthTotal();
    setMonthTotal(mTotal);

    // Get all months data
    const monthsData = await getAllMonthsData();
    setAllMonthsData(monthsData);
  };

  const loadMonthData = async (month, year) => {
    const data = await getMonthData(month, year);
    setSelectedMonthData(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  let currentData = [];
  if (viewMode === 'week') {
    currentData = weeklyData;
  } else if (viewMode === 'month') {
    currentData = monthlyData;
  } else if (viewMode === 'months') {
    currentData = selectedMonthData;
  }
  
  const maxValue = Math.max(...currentData.map(d => d.total), 1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Today's Summary */}
        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>Today Total Study Time</Text>
          <Text style={styles.todayTime}>{formatTime(todayTotal)}</Text>
          <Text style={styles.todayDate}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'week' && styles.toggleButtonActive]}
            onPress={() => setViewMode('week')}
          >
            <Text style={[styles.toggleText, viewMode === 'week' && styles.toggleTextActive]}>
              Last 7 Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'month' && styles.toggleButtonActive]}
            onPress={() => setViewMode('month')}
          >
            <Text style={[styles.toggleText, viewMode === 'month' && styles.toggleTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'months' && styles.toggleButtonActive]}
            onPress={() => setViewMode('months')}
          >
            <Text style={[styles.toggleText, viewMode === 'months' && styles.toggleTextActive]}>
              All Months
            </Text>
          </TouchableOpacity>
        </View>

        {/* Month Selector (only show when in 'months' view) */}
        {viewMode === 'months' && (
          <View style={styles.monthSelectorCard}>
            <Text style={styles.monthSelectorLabel}>Select Month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
              {months.map((month, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.monthButton,
                    selectedMonth === index && styles.monthButtonActive
                  ]}
                  onPress={() => setSelectedMonth(index)}
                >
                  <Text style={[
                    styles.monthButtonText,
                    selectedMonth === index && styles.monthButtonTextActive
                  ]}>
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            {viewMode === 'week' ? 'Weekly Overview' : viewMode === 'month' ? 'Monthly Overview' : `${months[selectedMonth]} Overview`}
          </Text>
          <View style={styles.chart}>
            {currentData.map((day, index) => {
              const heightPercent = maxValue > 0 ? (day.total / maxValue) * 100 : 0;

              // Format label based on view mode
              let displayLabel = day.day;
              if (viewMode === 'week' && day.date) {
                const dateObj = new Date(day.date);
                const month = dateObj.getMonth() + 1;
                const dateNum = dateObj.getDate();
                displayLabel = `${month}/${dateNum} ${day.day}`;
              } else if ((viewMode === 'month' || viewMode === 'months') && day.date) {
                displayLabel = day.date;
              }

              return (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    {day.total > 0 && (
                      <Text style={styles.barLabel}>{formatTime(day.total)}</Text>
                    )}
                    <View
                      style={[
                        styles.bar,
                        { height: Math.max(heightPercent, 2) + '%' }
                      ]}
                    />
                  </View>
                  <Text style={styles.dayLabel}>{displayLabel}</Text>

                </View>
              );
            })}
          </View>
        </View>

        

        {/* Statistics Section */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Study Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Today</Text>
              <Text style={styles.statValue}>{formatTime(todayTotal)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>This Week</Text>
              <Text style={styles.statValue}>{formatTime(weekTotal)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>This Month</Text>
              <Text style={styles.statValue}>{formatTime(monthTotal)}</Text>
            </View>
          </View>
        </View>

        <YearlyChart data={allMonthsData} />
        
        {/* Recent Sessions - Limited to 5 */}
        <View style={styles.sessionsCard}>
          <Text style={styles.sessionsTitle}>Recent Sessions</Text>
          {allSessions.length === 0 ? (
            <Text style={styles.noSessions}>No sessions yet. Start studying!</Text>
          ) : (
            allSessions.slice(0, 5).map((session, index) => (
              <View key={index} style={styles.sessionItem}>
                <View style={styles.sessionLeft}>
                  <View style={[
                    styles.sessionType,
                    { backgroundColor: session.type === 'pomodoro' ? '#dc2626' : '#2563eb' }
                  ]}>
                    <Text style={styles.sessionTypeText}>
                      {session.type === 'pomodoro' ? 'P' : 'S'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.sessionTime}>{formatTime(session.duration)}</Text>
                    <Text style={styles.sessionDate}>{formatDateTime(session.timestamp)}</Text>
                  </View>
                </View>
                <Text style={styles.sessionDuration}>
                  {session.type === 'pomodoro' ? 'Pomodoro' : 'Stopwatch'}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  todayCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  todayLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  todayTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  todayDate: {
    fontSize: 13,
    color: '#9ca3af',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  toggleTextActive: {
    color: '#fff',
  },
  monthSelectorCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  monthSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  monthScroll: {
    flexDirection: 'row',
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
    minWidth: 50,
    alignItems: 'center',
  },
  monthButtonActive: {
    backgroundColor: '#2563eb',
  },
  monthButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  monthButtonTextActive: {
    color: '#fff',
  },
  chartCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    width: '80%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  bar: {
    width: '100%',
    backgroundColor: '#3b82f6',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '600',
  },
  sessionsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  noSessions: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    paddingVertical: 20,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionType: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTypeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sessionTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sessionDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  sessionDuration: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
});