import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const Alert = ({ type, message, onClose }) => {
  const alertStyles = {
    success: 'bg-green-50 border-green-500 text-green-700',
    error: 'bg-red-50 border-red-500 text-red-700',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-700',
    info: 'bg-blue-50 border-blue-500 text-blue-700'
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
    warning: <AlertCircle className="h-5 w-5" />,
    info: <AlertCircle className="h-5 w-5" />
  };

  return (
    <div className={`fixed top-4 right-4 flex items-center p-4 mb-4 border-l-4 rounded-r z-50 ${alertStyles[type]}`}>
      <div className="mr-2">
        {icons[type]}
      </div>
      <div>{message}</div>
      <button onClick={onClose} className="ml-4 text-gray-500 hover:text-gray-700">
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Alert;