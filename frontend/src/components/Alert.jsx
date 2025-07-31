import { useEffect, useState } from 'react';
import './Alert.css';
import { getAlertDuration } from '../config/environment.js';

const Alert = ({ 
  type = 'info', 
  message, 
  duration = getAlertDuration(), 
  onClose, 
  show = true 
}) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
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
    <div className={`alert alert-${type} ${isVisible ? 'alert-show' : 'alert-hide'}`}>
      <div className="alert-content">
        <span className="alert-icon">{getIcon()}</span>
        <span className="alert-message">{message}</span>
        <button className="alert-close" onClick={handleClose}>
          ×
        </button>
      </div>
      <div className="alert-progress"></div>
    </div>
  );
};

export default Alert; 