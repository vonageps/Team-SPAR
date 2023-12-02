var express = require('express');
var cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var app = express();
app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
const Vonage = require('@vonage/server-sdk');
require('dotenv').config();
app.listen(3000);

app.get('/', (req, res) => {
    res.json(200);
});

var url = 'https://flight-support-agent-nulkr.run-ap-south1.goorm.site';
let requestId = null;

const ncco = [
    {
        action: 'talk',
        text:
            '<speak> \
					<p>Welcome to Meta Airways! Please provide the PNR number of your flight for Verification.</p>\
				</speak>',
    },

    {
        action: 'input',
        eventUrl: [url + '/webhooks/dtmf'],
        type: ['dtmf'],
        dtmf: {
            timeout: 5,
            maxDigits: 4,
            submitOnHash: true,
        },
    },
];

app.post('/webhooks/dtmf', (req, res) => {
    const Vonage_API_KEY = process.env.API_KEY;
    const Vonage_API_SECRET = process.env.API_SECRET;
    const Vonage_APPLICATION_ID = process.env.APPLICATION_ID;
    const Vonage_PRIVATE_KEY = process.env.PRIVATE_KEY;
    let usernumber = 0;

    const vonage = new Vonage(
        {
            apiKey: Vonage_API_KEY,
            applicationId: Vonage_APPLICATION_ID,
            privateKey: Vonage_PRIVATE_KEY,
            apiSecret: Vonage_API_SECRET,
        },
        { debug: true }
    );

    const dtmf = req.body.dtmf;
    const { digits, timed_out } = dtmf;
    console.log(digits);
    console.log(process.env.PNRNUM);

    if (digits === process.env.PNRNUM) {
        console.log('PNR is correct');
        usernumber = process.env.RECIPIENT_NUMBER;
        var ncco = [
            {
                action: 'talk',
                text: 'Thank you for the PIN Numer, This is a valid PIN number',
            },
            {
                action: 'input',
                eventUrl: [url + '/webhooks/verify'],
            },
        ];
        res.json(ncco);
    } else {
        console.log('PNR is incorrect');
        var ncco = [
            {
                action: 'talk',
                text: 'You are not Verified, pleaes provide correct PNR number',
            },
        ];
        res.json(ncco);
    }
});

app.post('/webhooks/verify', (req, res) => {
    const Vonage_API_KEY = process.env.API_KEY;
    const Vonage_API_SECRET = process.env.API_SECRET;
    const Vonage_APPLICATION_ID = process.env.APPLICATION_ID;
    const Vonage_PRIVATE_KEY = process.env.PRIVATE_KEY;

    const vonage = new Vonage(
        {
            apiKey: Vonage_API_KEY,
            applicationId: Vonage_APPLICATION_ID,
            privateKey: Vonage_PRIVATE_KEY,
            apiSecret: Vonage_API_SECRET,
        },
        { debug: true }
    );

    console.log('verify');
    // const dtmf = req.body.dtmf;
    // const { digits, timed_out } = dtmf;

    console.log(req.body.dtmf);
    console.log(process.env.PNRNUM);

    //Send Verification Code
    vonage.verify.request(
        {
            number: process.env.RECIPIENT_NUMBER,
            brand: process.env.BRAND_NAME,
            api_secret: process.env.API_SECRET,
        },
        (err, result) => {
            if (err) {
                console.error(err);
            } else {
                requestId = result.request_id;
                console.log('Verification request sent', result);
            }
        }
    );

    var ncco = [
        {
            action: 'talk',
            text:
                'We have sent a verification code to your registered mobile number, please enter the code to verify your identity',
        },
        {
            action: 'input',
            eventUrl: [url + '/webhooks/check'],
            type: ['dtmf'],
            dtmf: {
                timeout: 10,
                maxDigits: 4,
                submitOnHash: true,
            },
        },
    ];
    res.json(ncco);
});

app.post('/webhooks/check', (req, res) => {
    const Vonage_API_KEY = process.env.API_KEY;
    const Vonage_API_SECRET = process.env.API_SECRET;
    const Vonage_APPLICATION_ID = process.env.APPLICATION_ID;
    const Vonage_PRIVATE_KEY = process.env.PRIVATE_KEY;

    const vonage = new Vonage(
        {
            apiKey: Vonage_API_KEY,
            applicationId: Vonage_APPLICATION_ID,
            privateKey: Vonage_PRIVATE_KEY,
            apiSecret: Vonage_API_SECRET,
        },
        { debug: true }
    );

    console.log('Check');
    const dtmf = req.body.dtmf;
    const { digits, timed_out } = dtmf;

    console.log(dtmf);
    console.log(process.env.PNRNUM);

    //Check Verification Code
    vonage.verify.check(
        {
            request_id: requestId,
            code: digits,
        },
        (err, result) => {
            if (err) {
                console.error(err);
            } else {
                console.log('Verification check result', result);
            }
        }
    );

    var ncco = [
        {
            action: 'talk',
            text:
                'Thank you for the verification. You are a verified caller. Please let us know how can we help you today?',
        },
        {
            action: 'talk',
            bargeIn: true,
            text:
                '<speak> \
					<p> Press 1, if you would like informatoin about your cancelled flight</p> \
					<p> Press 2, to explore alterate flght options, discuss rebooking possibiliteis or refund.</p> \
				</speak>',
        },
        {
            action: 'input',
            eventUrl: [url + '/webhooks/Converse'],
        },
    ];
    res.json(ncco);
});

app.post('/webhooks/converse', (req, res) => {
    const Vonage_API_KEY = process.env.API_KEY;
    const Vonage_API_SECRET = process.env.API_SECRET;
    const Vonage_APPLICATION_ID = process.env.APPLICATION_ID;
    const Vonage_PRIVATE_KEY = process.env.PRIVATE_KEY;

    const vonage = new Vonage(
        {
            apiKey: Vonage_API_KEY,
            applicationId: Vonage_APPLICATION_ID,
            privateKey: Vonage_PRIVATE_KEY,
            apiSecret: Vonage_API_SECRET,
        },
        { debug: true }
    );

    //Send SMS using Vonage SMS API
    console.log('converse');
    const dtmf = req.body.dtmf;
    const msg = "Flight Name: Meta Airways \
				Flight PNR: 3261 \
				Flight Status: Cancelled \
				Reason: Bad Weather";

    if (dtmf === '1') {
        vonage.message.sendSms(
            process.env.VONAGE_NUMBER,
            process.env.RECIPIENT_NUMBER,
            msg,
            (err, responseData) => {
                if (err) {
                    console.log(err);
                } else {
                    if (responseData.messages[0]['status'] === '0') {
                        console.log('Message sent successfully.');
                    } else {
                        console.log(
                            `Message failed with error: ${responseData.messages[0]['error-text']}`
                        );
                    }
                }
            }
        );
    }
});

app.get('/webhooks/inbound-call', (req, res) => {
    res.json(ncco);
});

app.get('/webhooks/status', (req, res) => {
    res.json(200);
});
