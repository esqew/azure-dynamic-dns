const https = require('https');

module.exports = class Provider {
    name;
    method;
    url;

    constructor(obj) {
        Object.assign(this, obj);
    }

    /**
     * Retrieves the WAN IP from the echo service
     * @async
     */
    getResult() {
        return new Promise((resolve, reject) => {
            var req = https.get(this.url, response => {
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    return reject(new Error(`Status Code: ${response.statusCode}`));
                }

                var data = [];

                response.on('data', chunk => {
                    data.push(chunk);
                });

                response.on('end', () => resolve(Buffer.concat(data).toString().trim()));
            });
            req.on('error', reject);

            req.end();
        });
    }

    toString() {
        return `Provider (${this.name})`;
    }
};