require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const appemRouter = require('./appem');
const appssoRouter = require('./appsso');
const appguRouter = require('./appgu');

const shopifyurl = process.env.SHOPIFY_URL;

app.use(cors({
  origin: `https://${shopifyurl}`, // Directly use the Shopify URL
  methods: ['GET'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use('/appem', appemRouter);
app.use('/appsso', appssoRouter);
app.use('/appgu', appguRouter);

app.listen(process.env.PORT || 3009, () => {
  console.log(`Server listening on port ${process.env.PORT || 3009}`);
});
