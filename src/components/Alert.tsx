import React, { useEffect, useState } from 'react';
import './Alert.css';

export interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number; // Auto-dismiss after this many milliseconds (0 = no auto-dismiss)
  onClose?: () => void;
  show?: boolean;
}

const Alert: React.FC<AlertProps> = ({
  type = 'info',
  message,
  title,
  duration = 5000,
  onClose,
  show = true
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsVisible(show);
    if (show) {
      setIsExiting(false);
    }
  }, [show]);

  useEffect(() => {
    if (duration > 0 && isVisible && !isExiting) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, isVisible, isExiting]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // Animation duration
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`alert alert-${type} ${isExiting ? 'alert-exiting' : ''}`}>
      <div className="alert-content">
        <div className="alert-icon">{getIcon()}</div>
        <div className="alert-text">
          {title && <div className="alert-title">{title}</div>}
          <div className="alert-message">{message}</div>
        </div>
        <button className="alert-close" onClick={handleClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default Alert;
