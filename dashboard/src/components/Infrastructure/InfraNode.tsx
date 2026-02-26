import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

interface InfraNodeData {
  label: string;
  color: string;
  [key: string]: unknown;
}

function InfraNode({ data }: { data: InfraNodeData }) {
  const lines = (data.label as string).split('\n');
  return (
    <div style={{
      background: 'white',
      border: `2px solid ${data.color}`,
      borderRadius: 6,
      padding: '8px 12px',
      fontSize: 13,
      fontWeight: 600,
      color: '#2c3e50',
      minWidth: 140,
      textAlign: 'center',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: '#95a5a6' }} />
      <div>{lines[0]}</div>
      {lines[1] && <div style={{ fontSize: 11, fontWeight: 400, color: '#546e7a', marginTop: 2 }}>{lines[1]}</div>}
      <Handle type="source" position={Position.Right} style={{ background: '#95a5a6' }} />
    </div>
  );
}

export default memo(InfraNode);
