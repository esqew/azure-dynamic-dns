# Installation
> These instructions assume that you already have a working Azure DNS zone. If the specific record targeted by the value you provide in `.env` doesn't exist within the specified DNS zone, it will be created for you.

### Azure set-up
1. Sign in to the [Azure portal](https://portal.azure.com) and [create an App Registration for the daemon](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade). Give it a descriptive name (I used `ddns-daemon`) and leave all other settings at their default values, then click *Register*.

   This process wil generate a unique `Application (client) ID` and a `Directory (tenant) ID`, which should be displayed on the resulting blade. Save these values for later, you'll need them to successfully configure your daemon.
   
   In addition to these values, you'll need an *App secret* to complete the setup process.

2. From the left-hand menu, click the `Certificates & secrets` menu option.

3. On the resulting screen, open the `Client secrets` tab, then select `+ New client secret`.

   My recommendation is to set the `Description` field to a value that will indiciate the physical location of the installation of your daemon, but you should pick one that is meaningful to you in the event you need to invalidate it in the future. Set an appropriate Expiration (as of this writing, the longest secret expiration period you can select is 2 years from the current date).

   Once you've got all that, click the `Add` button. The new client secret should be displayed in the table - copy this for use later when configuring your daemon.

You've now created your service principal, but now you need to grant it access to make changes to your Azure DNS configuration.

4. Open the DNS Zone resource you're looking to target with the script in the Azure Portal, then navigate to its `Access control` blade. In the `Access control` blade, click `+ Add` &rarr; `Add role assignment`.

5. Pick the `DNS Zone Contributor` role, then select the `Next` button.

    > **Note:** For those operating with a more strict security posture, you might want to evaluate the permissions that this role provides and instead create a custom role with a "least-privilege"-conformant role. If that applies to you, consider adding a custom role to your subscription based on the JSON provided in [`dns-record-contributor.json`](./dns-record-contributor.json) and selecting that role instead.

6. On the resulting screen, click the `+ Select members` link; from the resulting blade, search for and select the service principal you created in Step 1. Click the `Review + assign` button.

7. Using the authentication information generated in steps 1 and 3 above, complete the empty fields in the `example.env` file. Re-name the file to `.env`. Finally, provide values for each of the other configuration parameters as necessary in your installation.

8. Run `node ./index.js --dry-run` to test your configuration and ensure that you don't get any unexpected errors with your current configuration. Rinse and repeat until the output matches your expectation.

***Congratulations!*** Your installation is ready to go. You can test the installation by running `node index.js` and waiting for your `cron` interval to hit. Once you're satisfied, you can daemonize the process with `pm2` or a similar utility. Remember to rotate your service principal's app secret at the interval you've specified in Step 3!