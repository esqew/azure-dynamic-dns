require('dotenv').config();

const { DnsManagementClient, ARecord } = require("@azure/arm-dns");
const { ClientSecretCredential } = require("@azure/identity");
const cron = require('node-cron');
const https = require('https');

const getWANIP = async () => {
    return new Promise((resolve, reject) => {
        var req = https.get(`https://icanhazip.com/`, response => {
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

cron.schedule(process.env.CRON_REFRESH_INTERVAL, async () => {
    const client = new DnsManagementClient(new ClientSecretCredential(process.env.TENANT_ID, process.env.CLIENT_ID, process.env.CLIENT_SECRET), process.env.AZURE_SUBSCRIPTION_ID);
    const wanIP = await getWANIP();
    const result = await client.recordSets.update(
        process.env.RESOURCE_GROUP_NAME,
        process.env.ZONE_NAME,
        process.env.RELATIVE_RECORD_SET_NAME,
        process.env.RECORD_TYPE,
        {
            aRecords: [{ ipv4Address: wanIP }]
        }
    );
    console.log(`Updated WAN IP (${wanIP}) to Azure DNS record ${process.env.RELATIVE_RECORD_SET_NAME}.${process.env.ZONE_NAME}`);
});
console.log(`Scheduled updates to configured Azure DNS record with the cron interval ${process.env.CRON_REFRESH_INTERVAL}`);