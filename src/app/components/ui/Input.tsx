import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  helperText,
  disabled = false,
  required = false,
  leftIcon,
  rightIcon,
  className = '',
  ariaLabel,
  ariaDescribedBy,
  ...rest
}, ref) => {
  const id = rest.id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const describedBy = [ariaDescribedBy, errorId, helperId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="text-neutral-300 text-bold mb-2"
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        {/* Left icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            {leftIcon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-label={ariaLabel}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={required}
          className={`
            w-full min-h-[44px] px-4 py-2
            bg-neutral-800 text-neutral-100 text-regular
            border rounded-lg
            transition-colors duration-200
            placeholder:text-neutral-500
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-neutral-900
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-900
            ${error
              ? 'border-error-500 focus:ring-error-500'
              : 'border-neutral-750 focus:border-primary-500'
            }
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
          `}
          {...rest}
        />

        {/* Right icon */}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p id={errorId} className="text-error-500 text-xs mt-1" role="alert">
          {error}
        </p>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p id={helperId} className="text-neutral-400 text-xs mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
