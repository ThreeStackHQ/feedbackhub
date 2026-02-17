/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@feedbackhub/db', '@feedbackhub/config'],
};

module.exports = nextConfig;
