import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

// Define keyframes animation in a separate style block
const spinnerStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
`;

// Add the styles to the document head once
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = spinnerStyles;
  document.head.appendChild(styleElement);
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'medium', 
  color = 'currentColor' 
}) => {
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 40
  } as const;

  const pixelSize = sizeMap[size];

  return (
    <div 
      className="spinner-container" 
      style={{ 
        display: 'inline-block',
        position: 'relative',
        width: `${pixelSize}px`,
        height: `${pixelSize}px`
      }}
    >
      <div 
        className="spinner"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: `${pixelSize / 8}px solid ${color}`,
          borderTopColor: 'transparent',
          borderRadius: '50%'
        }}
      />
    </div>
  );
};
