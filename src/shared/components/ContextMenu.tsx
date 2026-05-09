import { useState, useEffect } from 'react';

interface ContextMenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  visible: boolean;
  onClose: () => void;
}

export function ContextMenu({ items, x, y, visible, onClose }: ContextMenuProps) {
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    // Adjust position to keep menu within viewport
    const menuWidth = 180;
    const menuHeight = items.length * 32 + 8;
    
    let adjustedX = x;
    let adjustedY = y;
    
    if (x + menuWidth > window.innerWidth) {
      adjustedX = x - menuWidth;
    }
    if (y + menuHeight > window.innerHeight) {
      adjustedY = y - menuHeight;
    }
    
    setPosition({ x: adjustedX, y: adjustedY });
  }, [x, y, items.length]);

  useEffect(() => {
    if (!visible) return;
    
    const handleClick = () => onClose();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: '180px',
        background: 'var(--mica-layer-2)',
        backdropFilter: 'blur(20px)',
        borderRadius: '8px',
        border: '1px solid var(--mica-stroke)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
        zIndex: 10000,
        padding: '4px',
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => (
        item.separator ? (
          <div
            key={index}
            style={{
              height: '1px',
              background: 'var(--mica-stroke)',
              margin: '4px 8px',
            }}
          />
        ) : (
          <button
            key={index}
            onClick={() => {
              item.action();
              onClose();
            }}
            disabled={item.disabled}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: 'none',
              background: 'transparent',
              color: item.disabled ? 'var(--mica-text-disabled)' : 'var(--mica-text-primary)',
              fontSize: '13px',
              textAlign: 'left',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              opacity: item.disabled ? 0.5 : 1,
              transition: 'background 0.15s ease',
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.background = 'var(--mica-layer-3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {item.label}
          </button>
        )
      ))}
    </div>
  );
}
