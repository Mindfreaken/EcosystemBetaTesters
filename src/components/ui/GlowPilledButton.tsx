"use client";

// Next.js version of src/components/GlowPilledButton.tsx using CSS Modules
import React, { MouseEvent } from 'react';
import styles from './GlowPilledButton.module.css';

interface GlowPilledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  glowColor?: string;
  icon?: React.ReactNode;
  label?: string;
  children?: React.ReactNode;
  contentGap?: number;      // px gap between icon and label
  iconSize?: number;        // px size for embedded icon
}

const GlowPilledButton: React.FC<GlowPilledButtonProps> = ({
  glowColor,
  icon,
  label,
  children,
  onMouseMove,
  onMouseLeave,
  style,
  className,
  contentGap,
  iconSize,
  ...restProps
}) => {
  const handleGlowEffect = (event: MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();

    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);

    button.style.setProperty('--glow-pos-x', `${x}%`);
    button.style.setProperty('--glow-pos-y', `${y}%`);

    if (glowColor) {
      button.style.setProperty('--glow-color', glowColor);
    } else {
      button.style.removeProperty('--glow-color');
    }

    if (onMouseMove) onMouseMove(event);
  };

  const resetGlowEffect = (event: MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    button.style.setProperty('--glow-pos-x', '50%');
    button.style.setProperty('--glow-pos-y', '50%');
    if (glowColor) button.style.removeProperty('--glow-color');

    if (onMouseLeave) onMouseLeave(event);
  };

  return (
    <button
      className={`${styles['glow-pilled-button']} ${className ? className : ''}`}
      onMouseMove={handleGlowEffect}
      onMouseLeave={resetGlowEffect}
      style={style}
      {...restProps}
    >
      {(icon || label) && (
        <div className={styles['button-content']} style={contentGap ? { gap: `${contentGap}px` } : undefined}>
          {icon && (
            <span
              className={styles['button-icon']}
              style={iconSize ? { width: iconSize, height: iconSize } : undefined}
            >
              {/* If icon is an SVG element from lucide, size prop might control it; otherwise inline size will constrain */}
              {icon}
            </span>
          )}
          {label && <span className={styles['button-label']}>{label}</span>}
        </div>
      )}
      {children}
    </button>
  );
};

export default GlowPilledButton;


