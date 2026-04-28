import { ImageResponse } from 'next/og';
import { BRAND } from '@/lib/brand';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BRAND.colors.slate,
          borderRadius: 40,
          fontSize: 108,
          fontWeight: 800,
          letterSpacing: -8,
          fontFamily: 'Georgia, serif',
        }}
      >
        <span style={{ display: 'flex', color: BRAND.colors.white }}>e</span>
        <span style={{ display: 'flex', color: BRAND.colors.coral }}>t</span>
      </div>
    ),
    { ...size },
  );
}
