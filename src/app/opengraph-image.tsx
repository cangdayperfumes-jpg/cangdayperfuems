import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Royal Perfumes | Luxury Fragrances';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontFamily: 'serif',
            fontWeight: 'bold',
            marginBottom: 20,
          }}
        >
          R
        </div>
        <div
          style={{
            fontSize: 60,
            fontFamily: 'sans-serif',
            letterSpacing: 10,
            textTransform: 'uppercase',
          }}
        >
          Royal Perfumes
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
