import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
          borderRadius: 7,
          color: '#FFFFFF',
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: -1,
          fontFamily: 'sans-serif',
        }}
      >
        E
      </div>
    ),
    { ...size },
  );
}
