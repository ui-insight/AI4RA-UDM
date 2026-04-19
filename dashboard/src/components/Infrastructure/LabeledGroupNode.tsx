import { memo } from 'react';

interface LabeledGroupNodeData {
  label: string;
  color: string;
  [key: string]: unknown;
}

function LabeledGroupNode({ data }: { data: LabeledGroupNodeData }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: `${data.color}14`,
      border: `1.5px dashed ${data.color}`,
      borderRadius: 8,
      position: 'relative',
      boxSizing: 'border-box',
    }}>
      <div style={{
        position: 'absolute',
        top: -10,
        left: 12,
        background: 'white',
        padding: '0 8px',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.3,
        color: data.color,
      }}>
        {data.label}
      </div>
    </div>
  );
}

export default memo(LabeledGroupNode);
