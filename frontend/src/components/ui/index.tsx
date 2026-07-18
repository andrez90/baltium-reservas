import React from 'react';
import type { InputHTMLAttributes, ButtonHTMLAttributes, SelectHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

// ==========================================
// BUTTON COMPONENT
// ==========================================
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary',
    secondary: 'bg-secondary text-white hover:opacity-90 focus:ring-secondary',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-border bg-transparent text-foreground hover:bg-panel focus:ring-foreground',
    ghost: 'bg-transparent hover:bg-panel text-foreground focus:ring-foreground',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!isLoading && Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
};

// ==========================================
// INPUT COMPONENT
// ==========================================
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon: Icon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-foreground/80 tracking-wide uppercase">{label}</label>}
      <div className="relative w-full">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground/45">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          ref={ref}
          className={`w-full text-sm rounded-lg bg-panel/50 border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-foreground/35 ${Icon ? 'pl-9' : ''} ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs font-medium text-red-500 mt-0.5">{error}</span>}
    </div>
  );
});
Input.displayName = 'Input';

// ==========================================
// SELECT COMPONENT
// ==========================================
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  options,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-foreground/80 tracking-wide uppercase">{label}</label>}
      <select
        ref={ref}
        className={`w-full text-sm rounded-lg bg-panel border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs font-medium text-red-500 mt-0.5">{error}</span>}
    </div>
  );
});
Select.displayName = 'Select';

// ==========================================
// BADGE COMPONENT
// ==========================================
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    error: 'bg-red-500/10 text-red-500 border border-red-500/20',
    info: 'bg-sky-500/10 text-sky-500 border border-sky-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
    neutral: 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20',
  };

  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full select-none ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// ==========================================
// MODAL / DIALOG COMPONENT
// ==========================================
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Dialog box */}
      <div className="relative w-full max-w-lg mx-auto my-6 px-4 z-50 animate-slide-up">
        <div className="border border-panel-border rounded-xl shadow-2xl relative flex flex-col w-full bg-background outline-none focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border rounded-t-xl">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <button
              className="p-1 ml-auto bg-transparent border-0 text-foreground/50 hover:text-foreground float-right text-xl leading-none font-semibold outline-none focus:outline-none transition-colors"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          {/* Body */}
          <div className="relative p-6 flex-auto max-h-[75vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// TOAST ALERT COMPONENT
// ==========================================
export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

export const Toast: React.FC<ToastMessage & { onClose: (id: string) => void }> = ({
  id,
  title,
  description,
  type = 'success',
  onClose,
}) => {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  };

  const borders = {
    success: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200',
    error: 'border-red-500/30 bg-red-950/20 text-red-200',
    info: 'border-blue-500/30 bg-blue-950/20 text-blue-200',
  };

  return (
    <div className={`flex items-start gap-3 p-4 border rounded-xl shadow-lg w-85 animate-slide-up glass ${borders[type]}`}>
      <span className="text-lg">{icons[type]}</span>
      <div className="flex-1 flex flex-col gap-0.5">
        <h4 className="text-sm font-semibold">{title}</h4>
        {description && <p className="text-xs opacity-75">{description}</p>}
      </div>
      <button 
        onClick={() => onClose(id)} 
        className="text-xs font-bold opacity-60 hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </div>
  );
};
