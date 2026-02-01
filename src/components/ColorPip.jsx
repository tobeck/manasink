import styles from './ColorPip.module.css'

const COLOR_MAP = {
  W: { name: 'White', color: '#F8F6D8', border: '#ccc' },
  U: { name: 'Blue', color: '#0E68AB', border: '#0E68AB' },
  B: { name: 'Black', color: '#211D1E', border: '#444' },
  R: { name: 'Red', color: '#D3202A', border: '#D3202A' },
  G: { name: 'Green', color: '#00733E', border: '#00733E' },
  C: { name: 'Colorless', color: '#CBC2BF', border: '#999' },
}

export function ColorPip({ color, size = 'medium' }) {
  const colorInfo = COLOR_MAP[color] || COLOR_MAP.C
  
  return (
    <span 
      className={`${styles.pip} ${styles[size]}`}
      style={{ 
        backgroundColor: colorInfo.color,
        borderColor: colorInfo.border,
      }}
      title={colorInfo.name}
    />
  )
}

export function ColorIdentity({ colors = [], size = 'medium' }) {
  if (!colors || colors.length === 0) {
    return <ColorPip color="C" size={size} />
  }
  
  return (
    <div className={styles.identity}>
      {colors.map(color => (
        <ColorPip key={color} color={color} size={size} />
      ))}
    </div>
  )
}
