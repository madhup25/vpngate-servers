require('rootpath')();
const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const cors = require('cors')
const compression = require('compression')
const morgan = require('morgan')
const helmet = require('helmet')
const rateLimiter = require('_middleware/rate-limiter')
const speedLimiter = require('_middleware/speed-limiter')
const getVpnList = require('_helpers/get-vpn-list')
const cron = require("node-cron");

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use(compression())
app.use(morgan('common'))
app.use(helmet());
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));


const getDate = (unix) => {
    return `${new Date(unix).toUTCString()}`
}

let servers = []
let countries = {}
let lastUpdated = null

console.log("Getting initial cache...")
getVpnList().then(vpnList => {
    servers = vpnList.servers
    countries = vpnList.countries
    lastUpdated = Date.now()
    console.log(`Cache added at ${getDate(lastUpdated)}`)
})

// API Routes
// Home Route
app.get('/', rateLimiter, speedLimiter, async (req, res) => {
    return res.json({
        app: 'vpngate-servers',
        description: "When you call the this API, the system will check for cache (max 5 mins ago) and returns the data. Getting latest data may take a few seconds.",
        servers: 'visit /servers to get the full list',
        country: 'visit /servers?country=<shortcode> and pass country short code as query parameter. Invalid code will return no results.',
        countries,
    })
})

// Get all Servers and filter by country
app.get('/servers', rateLimiter, speedLimiter, async (req, res) => {
    let data
    let country = req.query.country
    if(country && country.length) data = servers.filter(vpn => vpn.countryshort.toLowerCase()===country)
    else data = servers
    return res.json({
        count: data.length, 
        lastUpdated: getDate(lastUpdated),
        countries,
        data,
    })
})


// Get data every 5 mins.
cron.schedule("*/5 * * * *", async () => {
    console.log("Updating Cache...")
    let vpnList = getVpnList()
    servers = vpnList.servers
    countries = vpnList.countries
    lastUpdated = Date.now()
    console.log(`Cache updated at ${getDate(lastUpdated)}.`)
})


// Error Handler
function errorHandler(err, req, res, next) {
    switch (true) {
        case typeof err === 'string':
            // custom application error
            const is404 = err.toLowerCase().endsWith('not found');
            const statusCode = is404 ? 404 : 400;
            return res.status(statusCode).json({ message: err });
        case err.name === 'ValidationError':
            // mongoose validation error
            return res.status(400).json({ message: err.message });
        case err.name === 'UnauthorizedError':
            // jwt authentication error
            return res.status(401).json({ message: 'Unauthorized' });
        default:
            return res.status(500).json({ message: err.message });
    }
}

app.use(errorHandler);

// App Listener
app.listen(port, () => console.log(`App live on port ${port}!`))