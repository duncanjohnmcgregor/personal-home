/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      'i.scdn.co', // Spotify images
      'mosaic.scdn.co', // Spotify playlist images
      'image-cdn-ak.spotifycdn.com', // Spotify artist images
      'i1.sndcdn.com', // SoundCloud images
      'i2.sndcdn.com', // SoundCloud images
      'geo-media.beatport.com', // Beatport images
      'geo-pro.beatport.com', // Beatport pro images
    ],
  },
}

module.exports = nextConfig