/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // บังคับให้ Vercel รู้ว่าต้องใช้ Output แบบปกติ
  output: 'standalone', 
};

export default nextConfig;