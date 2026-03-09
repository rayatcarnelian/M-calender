/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['yt-search', 'cheerio', 'ffmpeg-static'],
};

export default nextConfig;
