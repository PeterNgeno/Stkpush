require('dotenv').config(); // Load environment variables

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Use environment variables for credentials
const consumerKey = process.env.CONSUMER_KEY;
const consumerSecret = process.env.CONSUMER_SECRET;
const shortcode = process.env.SHORTCODE;
const passkey = process.env.PASSKEY;
const callbackURL = process.env.CALLBACK_URL; // Get the callback URL from .env

// Add a route for the root path
app.get('/', (req, res) => {
    res.send('Server is running!');  // Message to show when visiting root path
});

app.post('/stkpush', async (req, res) => {
    const { phone } = req.body;
    const amount = 1; // Set the amount to charge

    try {
        // Get the access token
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
        const tokenResponse = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            { headers: { Authorization: `Basic ${auth}` } }
        );
        const accessToken = tokenResponse.data.access_token;

        // Create a timestamp
        const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

        // Send the STK Push
        const stkResponse = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            {
                BusinessShortCode: shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: amount,
                PartyA: phone,
                PartyB: shortcode,
                PhoneNumber: phone,
                CallBackURL: callbackURL, // Use the callback URL from the .env file
                AccountReference: 'TestPayment',
                TransactionDesc: 'Payment of goods',
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        res.status(200).json({ message: 'STK Push sent successfully', data: stkResponse.data });
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to send STK Push' });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
