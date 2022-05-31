# Dynamic Azure DNS Daemon
A Node.js-based daemon that refreshes Azure DNS records based on the detected WAN IP of the local network to the executing device. Useful for maintaining up-to-date DNS records which are pointing networks whose WAN IPs are dynamic in nature (think home networks).

## Installation and configuration
*To be completed - documentation work is ongoing in the `docs/installation` branch.*

## To-dos

### Configurable WAN IP echo service provider
Currently, the script is pegged to the WAN IP echo service at `https://icanhazip.com`. This presents several potential issues over the longer-term:

  1. The service can disappear or cease to function as expected at any time (for example, the relatively recent decommissionning of the [WhatIsMyIPAddress.com API](https://whatismyipaddress.com/api))
  2. A given IP echo service can be inaccessible or otherwise non-functional in certain geographic regions due to routing issues, deliberate blocking of the services within corporate networks or certain geopolitical areas (i.e., China)

  To mitigate these potential pitfalls, better configuration of the provider should be possible on an instance-by-instance basis.

## License
This package is licensed under the standard MIT License. See [`LICENSE.md`](LICENSE.md) for more information.