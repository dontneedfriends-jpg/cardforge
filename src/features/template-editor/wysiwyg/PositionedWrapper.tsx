import { useNode } from '@craftjs/core';

interface PositionedWrapperProps {
  children: React.ReactNode;
}

export function PositionedWrapper({ children }: PositionedWrapperProps) {
  const { x, y, width, height, rotation, opacity, zIndex, visible } = useNode((node) => ({
    x: node.data.props.x ?? 0,
    y: node.data.props.y ?? 0,
    width: node.data.props.width ?? 100,
    height: node.data.props.height ?? 100,
    rotation: node.data.props.rotation ?? 0,
    opacity: node.data.props.opacity ?? 1,
    zIndex: node.data.props.zIndex ?? 0,
    visible: node.data.props.visible !== false,
  }));

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        opacity,
        zIndex,
        cursor: 'move',
      }}
    >
      {children}
    </div>
  );
}
