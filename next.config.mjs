/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals.push({
        "@napi-rs/canvas": "commonjs @napi-rs/canvas",
      });
    }
    return config;
  },
};

export default nextConfig;
