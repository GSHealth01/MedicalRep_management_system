import React from 'react';

const ConfirmDialog = ({ 
  isOpen, 
  title = "Confirmation", 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  onConfirm, 
  onCancel,
  type = "warning" // warning, danger, info
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          iconBg: 'bg-red-100',
          iconBorder: 'border-red-400',
          confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          title: 'text-red-800'
        };
      case 'warning':
        return {
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          iconBorder: 'border-yellow-400',
          confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          title: 'text-yellow-800'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          iconBorder: 'border-blue-400',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          title: 'text-blue-800'
        };
      default:
        return {
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          iconBorder: 'border-yellow-400',
          confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          title: 'text-yellow-800'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center mb-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${styles.iconBg} ${styles.iconBorder} border-2`}>
            <span className="text-xl">{styles.icon}</span>
          </div>
          <div className="ml-4">
            <h3 className={`text-lg font-medium ${styles.title}`}>
              {title}
            </h3>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 text-sm leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${styles.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for managing confirmation dialogs
export const useConfirm = () => {
  const [confirmState, setConfirmState] = React.useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "warning",
    onConfirm: null,
    onCancel: null
  });

  const showConfirm = ({ 
    title = "Confirmation", 
    message, 
    confirmText = "Confirm", 
    cancelText = "Cancel", 
    type = "warning",
    onConfirm 
  }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
          onConfirm && onConfirm();
        },
        onCancel: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  const ConfirmDialogComponent = confirmState.isOpen ? (
    <ConfirmDialog
      {...confirmState}
      onConfirm={confirmState.onConfirm}
      onCancel={confirmState.onCancel}
    />
  ) : null;

  return {
    showConfirm,
    ConfirmDialogComponent
  };
};

export default ConfirmDialog;