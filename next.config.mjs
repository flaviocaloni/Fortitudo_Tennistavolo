/** @type {import('next').NextConfig} */
const nextConfig = {
  // evita che Turbopack risalga oltre la cartella del progetto
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
