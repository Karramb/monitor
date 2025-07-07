const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq) => {
        console.log('Proxying request to:', proxyReq.path);
      },
      onError: (err) => {
        console.error('Proxy error:', err);
      }
    })
  );
};