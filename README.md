# Dynamic Azure DNS Daemon
A Node.js-based daemon that refreshes Azure DNS records based on the detected WAN IP of the local network to the executing device. Useful for maintaining up-to-date DNS records which are pointing networks whose WAN IPs are dynamic in nature (think home networks).

## Installation and configuration
> *See full instructions in [`doc/installation.md`](./doc/installation.md).*

**TL;DR**: Create a service principal and assign it the `DNS Zone Contributor` role (or the more restrictive role outlined by the included [`dns-record-contributor.json`](./doc/dns-record-contributor.json) role definition). Configure your [`example.env`](./example.env), re-name to `.env`, run the script with the `--dry-run` switch to test, then daemonize `index.js` with `pm2` (or any other similar tool you prefer).

## To-dos

### Configurable WAN IP echo service provider
Currently, the script is pegged to the WAN IP echo service at `https://icanhazip.com`. This presents several potential issues (among others) over the longer-term:

  1. The service can disappear or cease to function as expected at any time (for example, the relatively recent decommissioning of the [WhatIsMyIPAddress.com API](https://whatismyipaddress.com/api))
  2. A given IP echo service can be inaccessible or otherwise non-functional in certain geographic regions due to routing issues, deliberate blocking of the services within corporate networks or certain geopolitical areas (i.e., China)

  To mitigate these potential pitfalls, better configuration of the provider should be possible on an instance-by-instance basis.

### IPv6 support
There's currently no support for IPv6 addresses or AAAA DNS records. With the (slow) global uptake of IPv6 over time, future-proofing this daemon with this support shouldn't be too much of a lift.

## License
This package is licensed under the standard MIT License. See [`LICENSE.md`](LICENSE.md) for more information.