/**
 * azure-dynamic-dns
 * by Sean F Quinn <sean@sfq.xyz>
 * 
 * A simple, daemonize-able Node.js script that updates DNS records in Azure DNS based on the currently-detected WAN IP for the network local to the device on which the service is running.
 * For installation/configuration information, see README.md
 * 
 * See LICENSE.md for licensing information
 */

// Require official Azure libraries to for abstracted API calls
const { DnsManagementClient } = require("@azure/arm-dns");
const { ClientSecretCredential } = require("@azure/identity");

// Require node-cron for daemonized operation at interval configured in .env
const cron = require('node-cron');

// Require built-in https module to facilitate communication with WAN IP echo service without adding an additional dependency
const https = require('https');

/**
 * Retrieves the WAN IP from the echo service
 * @async
 */
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

/**
 * Checks if the update is necessary and, if so, updates the Azure DNS record per the configuration in .env
 * @async
 */
const do_update = async (dry_run = false) => {
    // Instantiate a new Azure DnsManagementClient object for abstracted communication with the in-scope Azure DNS APIs
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
        // Evaluate & take action based on the data returned from both Promises above

        // Normally, we can reduce the verbosity of this equality check (which needs to guard against result[0] being zero-length or undefined) by using optional chaining (.?) available in Node v14.x and later.
        // It has instead been designed with two distinct expressions to prevent exclusion of earlier versions of Node unnecessarily
        if (result[0].length > 0 && !result[0].includes(result[1])) {
            if (dry_run) console.log(`[DRY RUN] Azure DNS ${process.env.RECORD_TYPE} record ${process.env.RELATIVE_RECORD_SET_NAME}.${process.env.ZONE_NAME} would have been updated from ${result[0]} to ${result[1]}`)
            else {
                client.recordSets.update(
                    process.env.RESOURCE_GROUP_NAME,
                    process.env.ZONE_NAME,
                    process.env.RELATIVE_RECORD_SET_NAME,
                    process.env.RECORD_TYPE,
                    {
                        aRecords: [{ ipv4Address: result[1] }]
                    }
                ).then(() => console.log(`Updated current WAN IP (${result[1]}) to Azure DNS ${process.env.RECORD_TYPE} record ${process.env.RELATIVE_RECORD_SET_NAME}.${process.env.ZONE_NAME}`));
            }
        }
        else console.log(`${dry_run ? '[DRY RUN] ' : ''}No update to DNS record necessary - target record value matches current WAN IP (${result[1]})`);
    });
}

// if run with the `--dry-run` switch, make sure to pass that to the do_update function to ensure no updates are actually made in the target Azure DNS records
if (['--dryrun', '--dry-run'].some(value => process.argv.includes(value))) do_update(true);
else {
    // schedule the cron job based on how it's configured in .env
    cron.schedule(process.env.CRON_REFRESH_INTERVAL, () => do_update(false));
    console.log(`Scheduled updates to configured Azure DNS record with the cron interval ${process.env.CRON_REFRESH_INTERVAL}`);
}