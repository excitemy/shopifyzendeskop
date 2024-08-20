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
const shopifyurl = process.env.SHOPIFY_URL; //which ip addresses do we have to white label for azure web app
const servicelayerurl = process.env.ServiceLayer_URL;

router.get('/hello', (req, res) => {
  res.send('Hello, World!');
});

console.log('SAP Auth Payload:', sapAuthPayload);

router.get('/auth/:customerId', async (req, res) => {
  const customerId = req.params.customerId;
  const customerEmail = req.query.email; // Extract the email from the query parameter

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
    Summary

    // Step 3: Extract the desired data using the provided email
    const customer = sapResponse.data;
    const contactEmployee = customer.ContactEmployees.find(emp => emp.E_Mail === customerEmail); // Use customerEmail from the query parameter

    if (!contactEmployee) {
      throw new Error('Contact employee not found');
    }

    // Prepare the JWT options and payload for Zendesk
    const jwtOptions = {
      header: { kid: zendeskkeyid },
      noTimestamp: true, // prevents iat in payload      
    };

    const jwtPayload = {
      scope: "user",
      name: `${contactEmployee.Name}`, // Using the Name from the ContactEmployees object
      email: contactEmployee.E_Mail, // Email from the specific contact
      external_id: contactEmployee.U_ContactId, // Assuming U_ContactId is the desired external ID
      phone: contactEmployee.Phone1, // Assuming the first contact's phone
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
