# WebProxy Privacy Policy

Last updated: 2026-10-31

WebProxy is a browser extension that automatically enables or disables proxy
servers for the websites you visit, based on rules you configure. This privacy
policy explains what data the extension handles and how it is handled.

WebProxy is a fork of the open-source
[SmartProxy](https://github.com/salarcode/SmartProxy) project.

## Summary

- WebProxy does **not** collect, transmit, sell, or share personal data.
- There is **no** analytics, telemetry, advertising, or tracking code.
- All extension settings, rules, and credentials are stored locally in your browser.
- Network traffic only goes to servers **you** configure or explicitly add.

## Data handled by the extension

### Settings, rules, and credentials

Proxy server configurations, proxy rule lists, subscriptions, and proxy
authentication credentials are stored in your browser's local extension storage.
They are not sent to the developer.

If you enable sync, this data may be transferred to:

- your browser vendor's sync service, if you use built-in browser sync; or
- the WebDAV server that you configure yourself.

Those services are operated by third parties or by you, and their own privacy
policies apply.

### Websites you visit

The extension reads the URL of the active tab and network request metadata
locally, solely to decide whether a proxy rule matches. This processing happens
on your device. URLs and browsing history are not sent to the developer.

### Proxy traffic

When a proxy is active, your network requests are forwarded to the proxy server
you configured. The developer of WebProxy does not operate these proxy servers
and cannot see your traffic. The privacy policy of your proxy provider applies.

### Rule and proxy subscriptions

If you add a subscription URL, the extension requests that URL to download rules
or proxy server lists. The provider of that URL may receive standard HTTP
information such as your IP address, as with any web request.

### IP geolocation

Country information is resolved locally using the IP2Location LITE database
bundled with the extension. No IP address is sent to a geolocation service.

### Update checks

The extension periodically requests the latest release information from
`api.github.com` to check for updates. This request contains no
personal data beyond what is inherent in any HTTP request.

## Permissions

The extension requests browser permissions only to provide its core
functionality:

- proxy, webRequest, webRequestAuthProvider: apply proxy rules and authenticate
  with proxy servers;
- tabs, webNavigation, activeTab: detect the current website and apply rules;
- storage, unlimitedStorage: store settings, rules, and subscriptions locally;
- notifications, alarms: show status messages and run scheduled subscription
  refreshes;
- access to websites: apply proxy rules to the sites you choose.

## Data sharing and sale

WebProxy does not sell, rent, or share personal data with third parties. No data
is transferred to the developer's servers.

## Children's privacy

WebProxy does not knowingly collect any information from anyone, including
children under 13.

## Changes to this policy

This policy may be updated to reflect changes in the extension. The updated
version will be published at this URL with a new "Last updated" date.

## Contact

For privacy questions, open an issue at:

https://github.com/lytree/WebProxy/issues
