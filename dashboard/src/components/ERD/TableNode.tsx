import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { HighlightState } from '../../types';

const stateStyles: Record<HighlightState, { bg: string; border: string; borderWidth: number; opacity: number }> = {
  none:     { bg: '#ffffff', border: '#667eea', borderWidth: 2, opacity: 1 },
  selected: { bg: '#f0e6ff', border: '#764ba2', borderWidth: 3, opacity: 1 },
  parent:   { bg: '#e3f2fd', border: '#4A90E2', borderWidth: 3, opacity: 1 },
  child:    { bg: '#fff3e0', border: '#e67e22', borderWidth: 3, opacity: 1 },
  dim:      { bg: '#ffffff', border: '#667eea', borderWidth: 2, opacity: 0.15 },
};

interface TableNodeData {
  label: string;
  state: HighlightState;
  [key: string]: unknown;
}

function TableNode({ data }: { data: TableNodeData }) {
  const s = stateStyles[data.state] || stateStyles.none;
  return (
    <div style={{
      background: s.bg,
      border: `${s.borderWidth}px solid ${s.border}`,
      borderRadius: 6,
      padding: '8px 16px',
      opacity: s.opacity,
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      minWidth: 100,
      textAlign: 'center',
    }}>
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden', width: 0, height: 0 }} />
      <span style={{
        fontWeight: 'bold',
        fontSize: 14,
        color: '#2c3e50',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        {data.label}
      </span>
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden', width: 0, height: 0 }} />
    </div>
  );
}

export default memo(TableNode);
