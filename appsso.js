const express = require('express');
const app = express();
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cors = require('cors');
const uuid = require('uuid');
const url = require('url');

const zendeskSubDomain = process.env.ZENDESK_SUB_DOMAIN;
const sharedKey = process.env.ZENDESK_JWT_SSOSECRET;
const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;
const shopifyurl = process.env.SHOPIFY_URL;


router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', `https://${shopifyurl}`);
  next();
});

router.use(cors({
  origin: (process.env.CORS_ORIGINS || '').split(','),
  methods: ['GET'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));


router.get('/hello', (req, res) => {
  res.send('Hello, World!');
});

router.get('/auth/:customerId', async (req, res) => {
  const customerId = req.params.customerId;

  try {
    const shopifyResponse = await axios.get(`https://${shopifyurl}/admin/customers/${customerId}.json`, {
      headers: {
        'X-Shopify-Access-Token': shopifyAccessToken,
        'Content-Type': 'application/json',
      },
    });

    const customer = shopifyResponse.data.customer;
    const jwtPayload = {  
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      phone: customer.phone,
      company_name: customer.company,
      iat: Math.floor(Date.now() / 1000),
      jti: uuid.v4(),
      external_id: customer.id.toString(), // Convert the customer.id to a string
    };

    // encode the JWT
    const token = jwt.sign(jwtPayload, sharedKey, {
      algorithm: 'HS256',
    });

    const redirect = `https://${zendeskSubDomain}.zendesk.com/access/jwt?jwt=${token}`;
    const query = url.parse(req.url, true).query;

    if (query.return_to) {
      redirect += `&return_to=${encodeURIComponent(query.return_to)}`;
    }

    res.writeHead(302, {
      Location: redirect,
    });

    res.end();
  } catch (error) {
    console.error('Error during authentication:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;