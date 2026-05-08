import React from 'react';

interface LogoProps {
  size?: number;
  withText?: boolean;
  textClassName?: string;
  iconClassName?: string;
  className?: string;
}

export const LogoIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="DryConfig"
  >
    <rect x="3" y="6" width="26" height="3.5" rx="0.5" fill="currentColor" />
    <rect x="3" y="11" width="26" height="10" rx="0.5" fill="currentColor" opacity="0.45" />
    <line x1="6" y1="14" x2="26" y2="14" stroke="currentColor" strokeWidth="0.6" opacity="0.6" strokeDasharray="1.5 1.5" />
    <line x1="6" y1="18" x2="26" y2="18" stroke="currentColor" strokeWidth="0.6" opacity="0.6" strokeDasharray="1.5 1.5" />
    <rect x="3" y="22.5" width="26" height="3.5" rx="0.5" fill="currentColor" />
  </svg>
);

export const Logo: React.FC<LogoProps> = ({
  size = 28,
  withText = true,
  textClassName = '',
  iconClassName = '',
  className = '',
}) => (
  <div className={`inline-flex items-center gap-2 ${className}`}>
    <LogoIcon size={size} className={`text-primary ${iconClassName}`} />
    {withText && (
      <span
        className={`font-bold tracking-tight text-primary ${textClassName}`}
        style={{ fontSize: size * 0.7 }}
      >
        Dry<span className="text-accent">Config</span>
      </span>
    )}
  </div>
);

export default Logo;
