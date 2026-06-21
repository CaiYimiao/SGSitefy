/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow remote photos pulled from Google Places / Facebook / object storage.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
