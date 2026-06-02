import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '好顧',
    short_name: '好顧',
    description: '讓照顧者快速整理長輩照顧現況，並一鍵同步給家人了解',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf9f6',
    theme_color: '#2F8F83',
    icons: [
      { src: '/haogu-icon.png', sizes: '192x192', type: 'image/png' },
      { src: '/haogu-icon.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
