const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Safaricom Credentials
const consumerKey = 'mrxhEccpfHHYyNbVktAHOxw3KYdhTRmylgJtfgUQ14JOda1F';
const consumerSecret = 'Uv3d4hWdtC3C11qbVyiTk2gITeHc2MlXpBVXEGTEtZpZtqjHcTqXhfk8A5hsG2iC';
const shortcode = '174379'; // Default shortcode
const passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2c2cb45bdbcf1033c6d58d28ef42d5e5';

// Root Endpoint
app.get('/', (req, res) => {
    console.log('Root endpoint accessed');
    res.send('Welcome to the STK Push Application!');
});

// STK Push Endpoint
app.post('/stkpush', async (req, res) => {
    const { phone } = req.body;
    const amount = 1; // Set the amount to charge

    try {
        // Step 1: Get Access Token
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
        const tokenResponse = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            { headers: { Authorization: `Basic ${auth}` } }
        );
        const accessToken = tokenResponse.data.access_token;

        // Step 2: Generate Timestamp and Password
        const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

        // Step 3: Send the STK Push
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
                CallBackURL: 'https://your-callback-url.com', // Replace with your callback URL
                AccountReference: 'TestPayment',
                TransactionDesc: 'Payment of goods',
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        // Response for Successful STK Push
        res.status(200).json({
            message: 'STK Push sent successfully',
            data: stkResponse.data,
        });
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to send STK Push' });
    }
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
