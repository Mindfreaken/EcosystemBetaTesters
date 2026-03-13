"use client";

// Next.js version of src/components/GlowCircularButton.tsx using CSS Modules
import React, { ButtonHTMLAttributes, CSSProperties } from 'react';
import styles from './GlowCircularButton.module.css';

// Augment CSSProperties to include our custom property
declare module 'react' {
  interface CSSProperties {
    '--glow-color'?: string;
    '--glow-pos-x'?: string;
    '--glow-pos-y'?: string;
  }
}

interface GlowCircularButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  glowColor?: string;
  children: React.ReactNode;
  style?: CSSProperties;
}

export const glowCircularNotificationBadgeClass = styles['notification-badge'];

const GlowCircularButton: React.FC<GlowCircularButtonProps> = ({
  glowColor = '#4f8',
  children,
  style,
  ...props
}) => {
  return (
    <button
      className={styles['glow-circular-button']}
      style={{
        '--glow-color': glowColor,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        margin: '0 6px',
        padding: 0,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        outline: 'none',
        ...style,
      }}
      onMouseDown={(e) => {
        const button = e.currentTarget;
        button.style.transform = 'scale(0.95)';
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        const button = e.currentTarget;
        button.style.transform = 'scale(1)';
        button.blur();
        props.onMouseUp?.(e);
      }}
      onMouseLeave={(e) => {
        const button = e.currentTarget;
        button.style.transform = 'scale(1)';
        props.onMouseLeave?.(e);
      }}
      onFocus={(e) => {
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        props.onBlur?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default GlowCircularButton;


