import { Text, makeStyles } from '@fluentui/react-components';
import { useCanvasStore } from '../../../store/canvasStore';
import { useCallback, useState } from 'react';
import type { CanvasElement } from '../../../store/canvasStore';

const useStyles = makeStyles({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '8px',
    overflow: 'auto',
    height: '100%',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    ':hover': {
      background: 'var(--colorNeutralBackground1Hover)',
    },
  },
  selected: {
    background: 'var(--colorBrandBackground)',
    color: 'var(--colorNeutralForegroundOnBrand)',
  },
  hidden: {
    opacity: 0.4,
    textDecoration: 'line-through',
  },
  chevron: {
    width: '14px',
    flexShrink: 0,
    textAlign: 'center' as const,
    fontSize: '10px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  child: {
    paddingLeft: '24px',
  },
  typeBadge: {
    fontSize: '9px',
    padding: '1px 4px',
    borderRadius: '3px',
    background: 'var(--colorNeutralBackground3)',
    color: 'var(--colorNeutralForeground3)',
    flexShrink: 0,
  },
  groupBadge: {
    background: 'var(--colorBrandBackground2)',
    color: 'var(--colorNeutralForegroundOnBrand)',
  },
});

interface TreeItem extends CanvasElement {
  depth: number;
  children: TreeItem[];
}

function buildTree(elements: CanvasElement[]): TreeItem[] {
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const tree: TreeItem[] = [];
  const map = new Map<string, TreeItem>();

  for (const el of sorted) {
    map.set(el.id, { ...el, depth: 0, children: [] });
  }

  for (const el of sorted) {
    const node = map.get(el.id)!;
    if (el.parentId && map.has(el.parentId)) {
      node.depth = (map.get(el.parentId)?.depth ?? 0) + 1;
      map.get(el.parentId)!.children.push(node);
    } else {
      tree.push(node);
    }
  }

  return tree;
}

function renderTree(
  nodes: TreeItem[],
  selectedId: string | null,
  onSelect: (id: string) => void,
  collapsed: Set<string>,
  onToggle: (id: string) => void,
  styles: ReturnType<typeof useStyles>
): React.ReactNode[] {
  const result: React.ReactNode[] = [];

  for (const node of nodes) {
    const isSelected = selectedId === node.id;
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsed.has(node.id);
    const isGroup = node.props?.childrenIds?.length > 0;

    result.push(
      <div
        key={node.id}
        className={`${styles.item} ${isSelected ? styles.selected : ''} ${!node.visible ? styles.hidden : ''}`}
        style={{ paddingLeft: `${8 + (node.depth ?? 0) * 20}px` }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <span
            className={styles.chevron}
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
          >
            {isCollapsed ? '▸' : '▾'}
          </span>
        ) : (
          <span className={styles.chevron} />
        )}
        <span className={`${styles.typeBadge} ${isGroup ? styles.groupBadge : ''}`}>
          {isGroup ? 'Group' : node.type.charAt(0).toUpperCase() + node.type.slice(1)}
        </span>
        {node.type === 'icon' && node.props?.iconName && (
          <span style={{ color: 'var(--colorNeutralForeground3)', fontSize: '10px' }}>
            {node.props.iconName}
          </span>
        )}
        {node.type === 'text' && node.props?.text && (
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {node.props.text}
          </span>
        )}
        {node.type === 'field' && node.props?.fieldName && (
          <span style={{ color: 'var(--colorBrandForeground1)', fontSize: '10px' }}>
            {'{{'}{node.props.fieldName}{'}}'}
          </span>
        )}
      </div>
    );

    if (hasChildren && !isCollapsed) {
      result.push(...renderTree(node.children, selectedId, onSelect, collapsed, onToggle, styles));
    }
  }

  return result;
}

export function LayersPanel() {
  const styles = useStyles();
  const elements = useCanvasStore((state) => state.elements);
  const selectedId = useCanvasStore((state) => state.selectedId);
  const selectElement = useCanvasStore((state) => state.selectElement);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const handleSelect = useCallback((id: string) => {
    selectElement(id);
  }, [selectElement]);

  const handleToggle = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const tree = buildTree(elements);

  return (
    <div className={styles.panel}>
      <Text size={200} weight="semibold" style={{ padding: '4px 8px' }}>Layers</Text>
      {tree.length > 0 ? (
        renderTree(tree, selectedId, handleSelect, collapsed, handleToggle, styles)
      ) : (
        <Text size={200} style={{ color: 'var(--colorNeutralForeground2)', padding: '4px 8px' }}>
          Drag elements onto the card
        </Text>
      )}
    </div>
  );
}
