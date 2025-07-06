/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // 개발 환경에서는 CSP 비활성화
    if (process.env.NODE_ENV === "development") {
      return [];
    }

    // 프로덕션에서만 CSP 설정
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' 'inline-speculation-rules'; object-src 'none';"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
