import React, { createContext, useContext, useState, useCallback } from 'react';
import Alert from '../components/Alert';
import type { AlertProps } from '../components/Alert';

interface AlertContextType {
  showAlert: (props: Omit<AlertProps, 'show'>) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertState extends AlertProps {
  id: string;
}

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertState[]>([]);

  const showAlert = useCallback((props: Omit<AlertProps, 'show'>) => {
    const id = Date.now().toString();
    const newAlert: AlertState = {
      ...props,
      id,
      show: true,
    };
    
    setAlerts(prev => [...prev, newAlert]);
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => {
    showAlert({
      type: 'success',
      message,
      title,
      duration: 4000,
    });
  }, [showAlert]);

  const showError = useCallback((message: string, title?: string) => {
    showAlert({
      type: 'error',
      message,
      title,
      duration: 6000, // Errors stay longer
    });
  }, [showAlert]);

  const showWarning = useCallback((message: string, title?: string) => {
    showAlert({
      type: 'warning',
      message,
      title,
      duration: 5000,
    });
  }, [showAlert]);

  const showInfo = useCallback((message: string, title?: string) => {
    showAlert({
      type: 'info',
      message,
      title,
      duration: 4000,
    });
  }, [showAlert]);

  const hideAlert = useCallback((id?: string) => {
    if (id) {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    } else {
      setAlerts([]);
    }
  }, []);

  const handleAlertClose = useCallback((id: string) => {
    hideAlert(id);
  }, [hideAlert]);

  return (
    <AlertContext.Provider value={{
      showAlert,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      hideAlert,
    }}>
      {children}
      
      {/* Render all alerts */}
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          type={alert.type}
          message={alert.message}
          title={alert.title}
          duration={alert.duration}
          show={alert.show}
          onClose={() => handleAlertClose(alert.id)}
        />
      ))}
    </AlertContext.Provider>
  );
};
