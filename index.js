/**
 * azure-dynamic-dns
 * by Sean F Quinn <sean@sfq.xyz>
 * 
 * A simple, daemonize-able Node.js script that updates DNS records in Azure DNS based on the currently-detected WAN IP for the network local to the device on which the service is running.
 * For installation/configuration information, see README.md
 * 
 * See LICENSE.md for licensing information
 */

require('dotenv').config();

const { DnsManagementClient } = require("@azure/arm-dns");
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

const do_update = async () => {
    const client = new DnsManagementClient(new ClientSecretCredential(process.env.TENANT_ID, process.env.CLIENT_ID, process.env.CLIENT_SECRET), process.env.AZURE_SUBSCRIPTION_ID);
    
    // Asynchronously retrieve both the current IP for the target Azure DNS record to be updated and the WAN IP
    Promise.all([
        // Retrieve the current value of the target record in Azure DNS to be updated
        client.recordSets.get(
            process.env.RESOURCE_GROUP_NAME,
            process.env.ZONE_NAME,
            process.env.RELATIVE_RECORD_SET_NAME,
            process.env.RECORD_TYPE
        ).then(result => result.aRecords.map(obj => obj.ipv4Address) || []),
        // Get the WAN IP of the current network by calling to an external IP echo service
        getWANIP()
    ]).then(result => {
        // Normally, we can reduce the verbosity of this equality check (which needs to guard against result[0] being zero-length or undefined) by using optional chaining (.?) available in Node v14.x and later.
        // It has instead been designed with two distinct expressions to prevent exclusion of earlier versions of Node unnecessarily
        if (result[0].length > 0 && !result[0].includes(result[1]))
            client.recordSets.update(
                process.env.RESOURCE_GROUP_NAME,
                process.env.ZONE_NAME,
                process.env.RELATIVE_RECORD_SET_NAME,
                process.env.RECORD_TYPE,
                {
                    aRecords: [{ ipv4Address: result[1] }]
                }
            ).then(() => console.log(`Updated current WAN IP (${result[1]}) to Azure DNS ${process.env.RECORD_TYPE} record ${process.env.RELATIVE_RECORD_SET_NAME}.${process.env.ZONE_NAME}`));
        else
            console.log(`No update to DNS record necessary - target record value matches current WAN IP (${result[1]})`);
    });
}

cron.schedule(process.env.CRON_REFRESH_INTERVAL, do_update);
console.log(`Scheduled updates to configured Azure DNS record with the cron interval ${process.env.CRON_REFRESH_INTERVAL}`);