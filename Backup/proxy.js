const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

const shopifyurl = process.env.SHOPIFY_URL;
const WebAppName = process.env.WEBAPP_NAME; 

app.use(cors({
  origin: (process.env.CORS_ORIGINS || '').split(','),
  methods: ['GET'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// Define the routes to proxy
app.use('/auth', createProxyMiddleware({
  target: 'https://' + WebAppName + '.azurewebsites.net/appsso',
  changeOrigin: true,
  pathRewrite: {
    '^/auth': '' // Remove the '/auth' prefix from the URL
  },
}));

app.use('/', createProxyMiddleware({
  target: 'https://' + shopifyurl,
  changeOrigin: true,
}));

app.listen(3007, () => {
  console.log('Proxy server running on http://localhost:3007');
});