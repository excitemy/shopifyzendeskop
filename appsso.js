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
const sapUserName = process.env.SAP_USER_NAME;
const sapPassword = process.env.SAP_PASSWORD;
const sapCompanyDB = process.env.SAP_COMPANY_DB;
const servicelayerurl = process.env.ServiceLayer_URL;

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
    // Step 1: Authenticate with SAP Business One Service Layer
    const sapAuthPayload = {
      UserName: sapUserName,
      Password: sapPassword,
      CompanyDB: sapCompanyDB,
    };

    const sapAuthResponse = await axios.post(`https://${servicelayerurl}:50000/b1s/v1/Login`, sapAuthPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const sessionId = sapAuthResponse.data.SessionId; // Extract the SessionId from the response

    // Step 2: Make an authenticated request to SAP Business One Service Layer
    const sapResponse = await axios.get(`https://${servicelayerurl}:50000/b1s/v1/BusinessPartners('${customerId}')?$select=CardCode,CardName,ContactEmployees`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `B1SESSION=${sessionId};`, // Use the session ID in the Cookie header
      },
    });

    const customer = sapResponse.data;
    const jwtPayload = {  
      name: `${customer.CardName}`, // Assuming CardName is the full name
      email: customer.ContactEmployees[0]?.E_Mail, // Assuming the first contact's email
      phone: customer.ContactEmployees[0]?.Phone1, // Assuming the first contact's phone
      company_name: customer.CardName, // Assuming CardName is the company name
      iat: Math.floor(Date.now() / 1000),
      jti: uuid.v4(),
      external_id: customerId, // Use the customerId as the external ID
    };

    // Encode the JWT
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
