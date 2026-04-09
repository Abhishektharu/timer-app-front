import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@timer_sessions';

export const saveSession = async (duration, type = 'stopwatch') => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();

    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    const sessions = existing ? JSON.parse(existing) : {};

    if (!sessions[today]) {
      sessions[today] = [];
    }

    sessions[today].push({
      duration,
      type,
      timestamp,
    });

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return true;
  } catch (error) {
    console.error('Error saving session:', error);
    return false;
  }
};

export const getSessions = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error getting sessions:', error);
    return {};
  }
};

// Helper to calculate total duration for a date or date range
const calculateTotal = (sessions, dateKeys) => {
  return dateKeys.reduce((total, dateKey) => {
    const daySessions = sessions[dateKey] || [];
    return total + daySessions.reduce((sum, s) => sum + s.duration, 0);
  }, 0);
};

export const getTodayTotal = async () => {
  try {
    const sessions = await getSessions();
    const today = new Date().toISOString().split('T')[0];
    return calculateTotal(sessions, [today]);
  } catch (error) {
    console.error('Error getting today total:', error);
    return 0;
  }
};

export const getWeeklyData = async () => {
  try {
    const sessions = await getSessions();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      const total = calculateTotal(sessions, [dateKey]);

      weekData.push({
        date: dateKey,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        total,
      });
    }

    return weekData;
  } catch (error) {
    console.error('Error getting weekly data:', error);
    return [];
  }
};

// Helper to get days in a specific month
const getMonthDays = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getMonthlyData = async () => {
  try {
    const sessions = await getSessions();
    const monthData = [];
    const today = new Date();
    const daysInMonth = getMonthDays(today.getFullYear(), today.getMonth());

    for (let week = 0; week < 4; week++) {
      const startDay = week * 7 + 1;
      const endDay = Math.min((week + 1) * 7, daysInMonth);

      let weekTotal = 0;
      for (let day = startDay; day <= endDay; day++) {
        const date = new Date(today.getFullYear(), today.getMonth(), day);
        const dateKey = date.toISOString().split('T')[0];
        weekTotal += calculateTotal(sessions, [dateKey]);
      }

      const startDate = new Date(today.getFullYear(), today.getMonth(), startDay);
      const endDate = new Date(today.getFullYear(), today.getMonth(), endDay);
      const dateRange = `${startDate.getMonth() + 1}/${startDay}-${endDate.getMonth() + 1}/${endDay}`;

      monthData.push({
        date: dateRange,
        day: `W${week + 1}`,
        total: weekTotal,
      });
    }

    return monthData;
  } catch (error) {
    console.error('Error getting monthly data:', error);
    return [];
  }
};

export const getAllSessions = async () => {
  try {
    const sessions = await getSessions();
    const allSessions = [];

    Object.keys(sessions).forEach(date => {
      sessions[date].forEach(session => {
        allSessions.push(session);
      });
    });

    allSessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return allSessions;
  } catch (error) {
    console.error('Error getting all sessions:', error);
    return [];
  }
};

export const getMonthData = async (month, year) => {
  try {
    const sessions = await getSessions();
    const monthData = [];
    const daysInMonth = getMonthDays(year, month);

    for (let week = 0; week < 4; week++) {
      const startDay = week * 7 + 1;
      const endDay = Math.min((week + 1) * 7, daysInMonth);

      let weekTotal = 0;
      for (let day = startDay; day <= endDay; day++) {
        const date = new Date(year, month, day);
        const dateKey = date.toISOString().split('T')[0];
        weekTotal += calculateTotal(sessions, [dateKey]);
      }

      const startDate = new Date(year, month, startDay);
      const endDate = new Date(year, month, endDay);
      const dateRange = `${startDate.getMonth() + 1}/${startDay}-${endDate.getMonth() + 1}/${endDay}`;

      monthData.push({
        date: dateRange,
        day: `W${week + 1}`,
        total: weekTotal,
      });
    }

    return monthData;
  } catch (error) {
    console.error('Error getting month data:', error);
    return [];
  }
};

export const getWeekTotal = async () => {
  try {
    const sessions = await getSessions();
    const dateKeys = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dateKeys.push(date.toISOString().split('T')[0]);
    }

    return calculateTotal(sessions, dateKeys);
  } catch (error) {
    console.error('Error getting week total:', error);
    return 0;
  }
};

export const getMonthTotal = async () => {
  try {
    const sessions = await getSessions();
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = getMonthDays(year, month);

    const dateKeys = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      dateKeys.push(date.toISOString().split('T')[0]);
    }

    return calculateTotal(sessions, dateKeys);
  } catch (error) {
    console.error('Error getting month total:', error);
    return 0;
  }
};

export const getAllMonthsData = async () => {
  try {
    const sessions = await getSessions();
    const monthsData = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const daysInMonth = getMonthDays(year, month);

      const dateKeys = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        dateKeys.push(dateObj.toISOString().split('T')[0]);
      }

      const monthTotal = calculateTotal(sessions, dateKeys);
      const dateRange = `${monthNames[month]} 1-${daysInMonth}, ${year}`;

      monthsData.push({
        month: monthNames[month],
        year: year,
        monthYear: `${monthNames[month]} ${year}`,
        dateRange: dateRange,
        hours: Math.round((monthTotal / 3600) * 10) / 10,
        timestamp: date.getTime(),
      });
    }

    return monthsData;
  } catch (error) {
    console.error('Error getting all months data:', error);
    return [];
  }
};