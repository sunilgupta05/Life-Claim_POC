import { COMPANY } from '../config/companyBrand'

const SIZES = {
  desktop: { height: 72, padding: '5px 8px' },
  mobile: { height: 60, padding: '4px 6px' },
}

/** Company logo — full mark visible on dark login panel */
export default function BrandLogo({ variant = 'desktop', style }) {
  const { height, padding } = SIZES[variant] || SIZES.desktop

  return (
    <div
      style={{
        display: 'inline-block',
        background: '#fff',
        borderRadius: '4px',
        padding,
        lineHeight: 0,
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        ...style,
      }}
    >
      <img
        src={COMPANY.logoPath}
        alt={COMPANY.name}
        style={{
          height,
          width: 'auto',
          maxWidth: '220px',
          display: 'block',
          objectFit: 'contain',
        }}
      />
    </div>
  )
}
