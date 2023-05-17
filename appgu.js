const express = require('express');
const app = express();
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cors = require('cors');

const zendeskPublicDomain = process.env.ZENDESK_PUBLIC_DOMAIN;
const zendeskSubDomain = process.env.ZENDESK_SUB_DOMAIN;
const zendeskJwtSecret = process.env.ZENDESK_JWT_SECRET;
const zendeskkeyid = process.env.ZENDESK_KEY_ID;
const zendeskJwtGuToken = process.env.ZENDESK_JWT_GUToken;
const zendeskUserName = process.env.ZENDESK_USERNAME;

router.use(cors({
  origin: (process.env.CORS_ORIGINS || '').split(','),
  methods: ['GET'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', `https://${zendeskPublicDomain}`);
  next();
});

router.get('/hello', (req, res) => {
  res.send('Hello, World!');
});

router.get('/auth/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Fetch the user's details from the Zendesk API
    const response = await axios.get(`https://${zendeskSubDomain}.zendesk.com/api/v2/users/${userId}.json`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${zendeskUserName}/token:${zendeskJwtGuToken}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });
    const user = response.data.user;
  
    const jwtOptions = {
      header: { kid: zendeskkeyid },
      noTimestamp: true, //prevents iat in payload      
    };
  
    const jwtPayload = {
      scope: "user",      
      name: user.name,
      email: user.email,
      phone: user.phone,
      company_name: user.company_name,
      external_id: user.external_id.toString(),
    };
  
    const token = jwt.sign(jwtPayload, zendeskJwtSecret, jwtOptions);
  
    res.json({ jwt: token });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred during authentication.');
  }
  
});

module.exports = router;
