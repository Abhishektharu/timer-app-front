import * as Notifications from 'expo-notifications';

// Set notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestNotificationPermissions = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

export const scheduleNotification = async (delayInSeconds, title, body = '') => {
  try {
    // Cancel previous notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule new notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body || title,
        sound: 'default',
        badge: 1,
      },
      trigger: {
        seconds: delayInSeconds,
        type: 'time',
      },
    });
  } catch (error) {
    // Notification scheduling failed silently
  }
};

export const cancelNotification = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};