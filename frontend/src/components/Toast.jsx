import React, { useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X
} from 'lucide-react';
import './Toast.css';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(onClose, 3600);
    return () => clearTimeout(id);
  }, [toast, onClose]);

  if (!toast) return null;

  const type = ['success', 'error', 'warning', 'info'].includes(toast.type)
    ? toast.type
    : 'success';

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const titles = {
    success: 'Changes saved',
    error: 'Something went wrong',
    warning: 'Attention required',
    info: 'Information'
  };

  const Icon = icons[type];

  return (
    <div
      className={`toast toast-${type}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <span className="toast-icon"><Icon size={19} /></span>
      <span className="toast-content">
        <strong>{toast.title || titles[type]}</strong>
        <span>{toast.message}</span>
      </span>
      <button
        className="toast-close"
        type="button"
        aria-label="Dismiss notification"
        onClick={onClose}
      >
        <X size={16} />
      </button>
      <span className="toast-progress" />
    </div>
  );
}
