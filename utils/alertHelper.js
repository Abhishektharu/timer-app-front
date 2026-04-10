let alertRef = null;

export const setAlertRef = (ref) => {
  alertRef = ref;
};

export const showAlert = (title, message, buttons = []) => {
  if (alertRef && alertRef.current) {
    alertRef.current.alert(title, message, buttons);
  }
};
