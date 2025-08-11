// Simple test to check if the application is working
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5002,
    path: '/',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    res.on('data', (chunk) => {
        console.log(`Body: ${chunk.length} bytes received`);
    });
    
    res.on('end', () => {
        console.log('Test completed successfully!');
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();

