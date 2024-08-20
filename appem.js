const express = require('express');
const app = express();
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cors = require('cors');


const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;
const zendeskJwtSecret = process.env.ZENDESK_JWT_SECRET;
const zendeskkeyid = process.env.ZENDESK_KEY_ID;
const shopifyurl = process.env.SHOPIFY_URL;


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

    const jwtOptions = {
      header: { kid: zendeskkeyid },
      noTimestamp: true, //prevents iat in payload      
    };

    const customer = shopifyResponse.data.customer;
    const jwtPayload = {
      scope: "user",      
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      external_id: customer.id.toString(), // Convert the customer.id to a string
      phone: customer.phone,
      company_name: customer.company,
    };

    const token = jwt.sign(jwtPayload, zendeskJwtSecret, jwtOptions);

    res.json({ jwt: token });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred during authentication.');
  }
});

module.exports = router;
