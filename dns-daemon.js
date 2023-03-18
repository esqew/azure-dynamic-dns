/**
 * azure-dynamic-dns
 * by Sean F Quinn <sean@sfq.xyz>
 * 
 * A simple, daemonize-able Node.js script that updates DNS records in Azure DNS based on the currently-detected WAN IP for the network local to the device on which the service is running.
 * For installation/configuration information, see README.md
 * 
 * See LICENSE.md for licensing information
 */

// Require project-specific class definitions from ./lib
const ProviderArray = require('./lib/ProviderArray');

// Require official Azure libraries to for abstracted API calls
const { DnsManagementClient } = require("@azure/arm-dns");
const { ClientSecretCredential } = require("@azure/identity");

// Require node-cron for daemonized operation at interval configured in .env
const cron = require('node-cron');

var providers = ProviderArray.fromProvidersArray(require('./config/providers.json'));

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
            process.env.RELATIVE_RECORD_SET,
            process.env.RECORD_TYPE
        ).then(
            result => result[process.env.RECORD_TYPE.toLowerCase() + "Records"].map(obj => obj.ipv4Address) || []
        ).catch(err => {
            console.error(err);
        }),
        // Get the WAN IP of the current network by calling to an external IP echo service
        providers.getRandomProvider().getResult()
    ]).then(result => {
        // Evaluate & take action based on the data returned from both Promises above
        if (!result[0]?.includes(result[1])) {
            // Current record does not include the currently-detected WAN IP
            if (dry_run) console.log(`[DRY RUN] Azure DNS ${process.env.RECORD_TYPE} record ${process.env.RELATIVE_RECORD_SET}.${process.env.ZONE_NAME} would have been updated from ${result[0]} to ${result[1]}`)
            else {
                client.recordSets.update(
                    process.env.RESOURCE_GROUP_NAME,
                    process.env.ZONE_NAME,
                    process.env.RELATIVE_RECORD_SET_NAME,
                    process.env.RECORD_TYPE,
                    {
                        aRecords: [{ ipv4Address: result[1] }]
                    }
                ).then(() => console.log(`Updated current WAN IP (${result[1]}) to Azure DNS ${process.env.RECORD_TYPE} record ${process.env.RELATIVE_RECORD_SET}.${process.env.ZONE_NAME}`));
            }
        }
        else console.log(`${dry_run ? '[DRY RUN] ' : ''}No update to DNS record necessary - target record value matches current WAN IP (${result[1]})`);
    });
}

console.log(`Starting up...`);
// if run with the `--dry-run` switch, make sure to pass that to the do_update function to ensure no updates are actually made in the target Azure DNS records
if (['--dryrun', '--dry-run'].some(value => process.argv.includes(value))) do_update(true);
else {
    // schedule the cron job based on how it's configured in .env
    do_uopdate(false).then(() => cron.schedule(process.env.CRON_REFRESH_INTERVAL, () => do_update(false)));
    console.log(`Scheduled updates to configured Azure DNS record with the cron interval ${process.env.CRON_REFRESH_INTERVAL}`);
}