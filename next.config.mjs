/** @type {import('next').NextConfig} */
function getSupabaseRemotePattern() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return {
      protocol: parsed.protocol.replace(':', '') || 'https',
      hostname: parsed.hostname,
    };
  } catch {
    return null;
  }
}

const supabasePattern = getSupabaseRemotePattern();

const nextConfig = {
  // Permite testar pelo celular na rede local sem emitir aviso de cross-origin no terminal
  allowedDevOrigins: [
    '10.149.7.56',
    '10.149.7.56:3000',
    '10.149.7.56:3001',
    '10.102.42.16',
    '10.102.42.16:3000',
    '10.102.42.16:3001',
    'localhost:3000',
    'localhost:3001',
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      ...(supabasePattern ? [supabasePattern] : []),
    ],
  },
};

export default nextConfig;
