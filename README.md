## WebProxy

[![license](https://img.shields.io/github/license/salarcode/SmartProxy.svg)](https://github.com/salarcode/SmartProxy/blob/master/LICENSE) [![Crowdin](https://d322cqt584bo4o.cloudfront.net/smartproxy/localized.svg)](https://crowdin.com/project/smartproxy)

#### Download From Store

 * [![Mozilla Add-on](https://img.shields.io/amo/v/smartproxy.svg)](https://addons.mozilla.org/en-US/firefox/addon/smartproxy/) [Firefox Desktop and Android Extension](https://addons.mozilla.org/en-US/firefox/addon/smartproxy)
 * [![Chrome Web Store](https://img.shields.io/chrome-web-store/v/jogcnplbkgkfdakgdenhlpcfhjioidoj.svg)](https://chrome.google.com/webstore/detail/smartproxy/jogcnplbkgkfdakgdenhlpcfhjioidoj) [Chrome Extension](https://chrome.google.com/webstore/detail/smartproxy/jogcnplbkgkfdakgdenhlpcfhjioidoj)
 * [![Edge Extension](https://img.shields.io/badge/dynamic/json?label=edge%20add-on&prefix=v&query=$.version&url=https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/canbjhbbhfggbdfgpddpnckdjgfcbnpb)](https://microsoftedge.microsoft.com/addons/detail/canbjhbbhfggbdfgpddpnckdjgfcbnpb) [Edge Extension](https://microsoftedge.microsoft.com/addons/detail/canbjhbbhfggbdfgpddpnckdjgfcbnpb)

#### Origin / 来源
This project is a modified fork of the open-source SmartProxy extension. The original source is retained below:

- Original project: https://github.com/salarcode/SmartProxy
- This repository: https://github.com/lytree/WebProxy

#### What is WebProxy
WebProxy is a Firefox/Chrome extension based on WebExtensions/Chrome Extensions technology.

It uses patterns to automatically define rules to proxify your web experience. With WebProxy, you don't need to change your proxy manually and turn it on and off. You can add your desired website to the proxy rules list with just one click. After that, when you visit that specific website, WebProxy will act and all you data for that website will be transferred though the proxy, without you doing anything.

What's more, WebProxy is inspired by AutoProxy and AutoProxy-ng and that are now considered legacy. WebProxy is completely written from ground up using WebExtensions and provides more functionality than those proxies.

##### Highlights
- Automatically detect when to enable or disable proxy to certain websites based on rule patterns
- Easily switch between many proxy servers as your active proxy server setting
- Easily with one click add current site to your proxy list
- View current website items and requests and decide whether to proxify them with one click
- Easily switch between proxy modes and enable proxy for all domains
- Proxy API is supported through subscriptions
- Backup/Restore settings and rules

#### How to translate
If you are interested to have WebProxy in your language or it is not translated completely you can head to https://crowdin.com/project/smartproxy then login with Google or Github and there by clicking your language start translating right away.

#### How to build/test:
Requirements

    Node.js + pnpm
    Firefox or Chrome browser

Run the app

    pnpm install
    pnpm dev-firefox    # build + watch + launch Firefox via web-ext
    pnpm dev            # build + watch + launch Chromium via web-ext

Build output is written to the `extension/` directory. Choose the target browser with the build script:

    build-ch (Chrome)   build-ed (Edge)   build-op (Opera)
    build-ff (Firefox)  build-ff-unlisted  build-ff-android  build-th (Thunderbird)

Append `:watch` to a browser build (e.g. `pnpm run build-ff:watch`) to rebuild on change.

Code quality and packaging:

    pnpm typecheck      # tsc --noEmit
    pnpm lint           # ESLint flat config
    pnpm pack           # extension.zip + extension.crx + extension.xpi

Run the matching browser build before `pnpm pack` (crx for Chromium targets, xpi for Firefox/Thunderbird).

To install in **Firefox** follow these instructions:

https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/

1.	build the project using `pnpm run build-ff` command
2.	open Firefox
3.	enter "about:debugging" in the URL bar
4.	click "Load Temporary Add-on"
5.	open the `extension/` directory and select any file inside the extension.

To install in **Google Chrome** follow these instructions:

https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked

1.	build the project using `pnpm run build-ch` command
2.	Open the Extension Management page by navigating to chrome://extensions.
3.	The Extension Management page can also be opened by clicking on the Chrome menu, hovering over More Tools then selecting Extensions.
4.	Enable Developer Mode by clicking the toggle switch next to Developer mode.
5.	Click the LOAD UNPACKED button and select the `extension/` directory.

#### Publish to Microsoft Edge Add-ons

The Edge package is built with `pnpm run build-ed`; `pnpm run pack:zip` produces `extension.zip` for store upload.

Manual submission (first release):

1. Sign in to [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/public/login) and create the extension product.
2. Copy the **Product ID** from the extension overview page.
3. Upload `extension.zip` under the package section and submit for review.

Automated updates via the [Microsoft Edge Add-ons Publish API](https://learn.microsoft.com/microsoft-edge/extensions/update/api/using-addons-api) (v1.1):

1. In Partner Center, open **Microsoft Edge > Publish API** and create API credentials.
2. Add these repository secrets:

   | Secret | Description |
   | --- | --- |
   | `EDGE_PRODUCT_ID` | Product ID (GUID) of the published extension |
   | `EDGE_CLIENT_ID` | Client ID from the Publish API page |
   | `EDGE_API_KEY` | API key from the Publish API page |

3. Push a `v*` tag (for example `v1.0.0`) or run the **Publish to Microsoft Edge Add-ons** workflow manually. The workflow builds the Edge package, uploads it to the draft submission, waits for processing, then publishes it.

The API can only update an existing product; the initial submission must be done in Partner Center.

#### Attribution

WebProxy uses [IP2Location LITE](https://lite.ip2location.com) for IP geolocation. Database is not included in the repo due to licensing requirements. 

