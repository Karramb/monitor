const { createProxyMiddleware } = require('http-proxy-middleware');

const target = process.env.API_BASE_URL || 'http://localhost:8000';

module.exports = function(app) {
  app.use(
    ['/api', '/media'],
    createProxyMiddleware({
      target,
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq) => {
        console.log('Proxying:', proxyReq.path); // Логирование для отладки
      },
      pathRewrite: {
        '^/media': '/media' // Явно указываем перезапись пути
      }
    })
  );
};