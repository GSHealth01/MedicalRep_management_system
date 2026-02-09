import React, { useState, useEffect } from 'react';

const NotificationPopup = ({ 
  message, 
  type = 'success', 
  duration = 3000, 
  onClose,
  show = false 
}) => {
  const [isVisible, setIsVisible] = useState(show);
  console.log('[DEBUG-Notification] Rendering with show:', show, 'message:', message, 'type:', type);

  useEffect(() => {
    console.log('[DEBUG-Notification] useEffect triggered, show:', show);
    setIsVisible(show);
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        console.log('[DEBUG-Notification] Auto-hide timer triggered');
        setIsVisible(false);
        onClose && onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const handleClose = () => {
    console.log('[DEBUG-Notification] handleClose called');
    setIsVisible(false);
    onClose && onClose();
  };

  if (!isVisible) {
    console.log('[DEBUG-Notification] Not visible, returning null');
    return null;
  }

  console.log('[DEBUG-Notification] Rendering notification popup');

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-400 text-green-700';
      case 'error':
        return 'bg-red-100 border-red-400 text-red-700';
      case 'warning':
        return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      case 'info':
        return 'bg-blue-100 border-blue-400 text-blue-700';
      default:
        return 'bg-green-100 border-green-400 text-green-700';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '✅';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`fixed top-4 right-4 p-4 border-l-4 rounded-lg shadow-lg max-w-sm w-full mx-4 ${getTypeStyles()}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-xl">{getIcon()}</span>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150"
            >
              <span className="text-lg">×</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for managing notifications
export const useNotification = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success', duration = 3000) => {
    setNotification({ message, type, duration, show: true });
  };

  const hideNotification = () => {
    setNotification(prev => prev ? { ...prev, show: false } : null);
  };

  const NotificationComponent = () => (
    <NotificationPopup
      {...notification}
      onClose={hideNotification}
    />
  );

  return {
    showNotification,
    hideNotification,
    NotificationComponent
  };
};

export default NotificationPopup;