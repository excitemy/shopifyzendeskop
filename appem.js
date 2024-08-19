const express = require('express');
const app = express();
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cors = require('cors');

app.use(cors());

const sapUserName = process.env.SAP_USER_NAME;
const sapPassword = process.env.SAP_PASSWORD;
const sapCompanyDB = process.env.SAP_COMPANY_DB;
const zendeskJwtSecret = process.env.ZENDESK_JWT_SECRET; //get this from zendesk
const zendeskkeyid = process.env.ZENDESK_KEY_ID; //get this from zendesk //remember to activate new footer // and do gu and sso
const shopifyurl = process.env.SHOPIFY_URL;


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

    const sapAuthResponse = await axios.post('https://${shopifyurl}:50000/b1s/v1/Login', sapAuthPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const sessionId = sapAuthResponse.data.SessionId; // Extract the SessionId from the response

    // Step 2: Make an authenticated request to SAP Business One Service Layer
    const sapResponse = await axios.get(`https://${shopifyurl}:50000/b1s/v1/BusinessPartners('${customerId}')?$select=CardCode,CardName,ContactEmployees`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `B1SESSION=${sessionId};`, // Use the session ID in the Cookie header
      },
    });

    // Prepare the JWT options and payload for Zendesk
    const jwtOptions = {
      header: { kid: zendeskkeyid },
      noTimestamp: true, // prevents iat in payload      
    };

    const customer = sapResponse.data;
    const jwtPayload = {
      scope: "user",
      name: `${customer.CardName}`, // Assuming the CardName is the full name
      email: customer.ContactEmployees[0]?.E_Mail, // Assuming the first contact's email
      external_id: customerId, // Use the customerId as the external ID
      phone: customer.ContactEmployees[0]?.Phone1, // Assuming the first contact's phone
      company_name: customer.CardName, // Assuming CardName is the company name
    };

    const token = jwt.sign(jwtPayload, zendeskJwtSecret, jwtOptions);

    res.json({ jwt: token });
  } catch (error) {
    console.error('Error during SAP interaction or JWT generation:', error);
    res.status(500).send('An error occurred during authentication.');
  }
});

module.exports = router;
