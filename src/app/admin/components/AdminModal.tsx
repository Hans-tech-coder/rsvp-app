import { Loader2, AlertCircle, Trash2, CheckCircle2, HelpCircle } from 'lucide-react';
import { ReactNode } from 'react';

type ModalType = 'alert' | 'confirm';
type ModalVariant = 'danger' | 'success' | 'warning' | 'info';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: ModalType;
  variant?: ModalVariant;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export function AdminModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'alert',
  variant = 'info',
  isLoading = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: AdminModalProps) {
  if (!isOpen) return null;

  const icons = {
    danger: <Trash2 className="w-5 h-5 text-red-500" />,
    success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    warning: <AlertCircle className="w-5 h-5 text-orange-500" />,
    info: <HelpCircle className="w-5 h-5 text-blue-500" />
  };

  const getConfirmButtonStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'warning':
        return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-zinc-800">
        <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            {icons[variant]}
            {title}
          </h3>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 dark:text-zinc-400">
            {message}
          </p>
        </div>
        
        <div className="p-5 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/50 flex justify-end gap-3">
          {type === 'confirm' && (
            <button 
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={type === 'confirm' ? onConfirm : onClose}
            disabled={isLoading}
            className={`px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70 ${getConfirmButtonStyles()}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {type === 'alert' ? 'OK' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
