import { useEffect } from 'react';
import './Notification.css';

export interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  autoHide?: boolean;
  duration?: number;
}

const Notification = ({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  autoHide = true, 
  duration = 5000 
}: NotificationProps) => {
  useEffect(() => {
    if (isVisible && autoHide) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHide, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`notification notification-${type} ${isVisible ? 'show' : ''}`}>
      <div className="notification-content">
        <span className="notification-message">{message}</span>
        <button className="notification-close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default Notification; 