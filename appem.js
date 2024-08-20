const express = require('express'); //delete after fixing ssl
const app = express();
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cors = require('cors');

app.use(cors());

const sapUserName = process.env.SAP_USER_NAME;
const sapPassword = process.env.SAP_PASSWORD;
const sapCompanyDB = process.env.SAP_COMPANY_DB;
const zendeskJwtSecret = process.env.ZENDESK_JWT_SECRET; // Get this from Zendesk
const zendeskkeyid = process.env.ZENDESK_KEY_ID; // Get this from Zendesk
const shopifyurl = process.env.SHOPIFY_URL; // Which IP addresses to whitelist for Azure Web App
const servicelayerurl = process.env.ServiceLayer_URL;

router.get('/hello', (req, res) => {
  res.send('Hello, World!');
});

router.get('/auth/:customerId', async (req, res) => {
  const customerId = req.params.customerId;
  const customerEmail = req.query.email; // Extract the email from the query parameter

  try {
    // Temporary: Create an HTTPS agent to bypass certificate validation
    const https = require('https');
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    // Step 1: Authenticate with SAP Business One Service Layer
    const sapAuthPayload = {
      UserName: sapUserName,
      Password: sapPassword,
      CompanyDB: sapCompanyDB,
    };

    const sapAuthResponse = await axios.post(`https://${servicelayerurl}:50000/b1s/v1/Login`, sapAuthPayload, {
      httpsAgent: agent, // Use the HTTPS agent with disabled certificate verification
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const sessionId = sapAuthResponse.data.SessionId; // Extract the SessionId from the response

    // Step 2: Make an authenticated request to SAP Business One Service Layer
    const sapResponse = await axios.get(`https://${servicelayerurl}:50000/b1s/v1/BusinessPartners('${customerId}')?$select=CardCode,CardName,ContactEmployees`, {
      httpsAgent: agent, // Use the HTTPS agent here as well
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `B1SESSION=${sessionId};`, // Use the session ID in the Cookie header
      },
    });

    // Step 3: Extract the desired data using the provided email
    const customer = sapResponse.data;
    const contactEmployee = customer.ContactEmployees.find(emp => emp.E_Mail === customerEmail);

    if (!contactEmployee) {
      throw new Error('Contact employee not found');
    }

    // Prepare the JWT options and payload for Zendesk
    const jwtOptions = {
      header: { kid: zendeskkeyid },
      noTimestamp: true, // Prevents iat in payload
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
    console.error('Error during SAP interaction or JWT generation:', error.response ? error.response.data : error.message);
    res.status(500).send('An error occurred during authentication.');
  }
});

module.exports = router;
