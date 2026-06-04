import { Typography } from 'antd'
import { PlusOutlined, CloseOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function SetTabs({ sets, activeSetId, onSelect, onAdd, onRemove }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '12px 16px', borderBottom: '1px solid #2f4058',
      flexWrap: 'wrap',
    }}>
      {sets.map(set => {
        const active = set.id === activeSetId
        return (
          <div
            key={set.id}
            onClick={() => onSelect(set.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 6, cursor: 'pointer',
              border: `1px solid ${active ? set.color : '#465b78'}`,
              background: active ? `${set.color}20` : 'transparent',
              color: active ? set.color : '#d3dce8',
              fontSize: 14, fontWeight: active ? 700 : 500,
              transition: 'all 0.15s', userSelect: 'none',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: set.color, flexShrink: 0 }} />
            <Text style={{ color: 'inherit', fontSize: 14, fontWeight: 'inherit' }}>{set.name}</Text>
            {sets.length > 1 && (
              <CloseOutlined
                onClick={e => { e.stopPropagation(); onRemove(set.id) }}
                style={{ fontSize: 12, color: '#c1ccda', marginLeft: 2 }}
              />
            )}
          </div>
        )
      })}

      {sets.length < 4 && (
        <div
          onClick={onAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '7px 12px', borderRadius: 6, cursor: 'pointer',
            border: '1px dashed #465b78', color: '#c1ccda',
            fontSize: 14, transition: 'all 0.15s', userSelect: 'none',
          }}
        >
          <PlusOutlined style={{ fontSize: 12 }} />
          Compare
        </div>
      )}
    </div>
  )
}
