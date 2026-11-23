import { environment } from "../../lib/environment";

environment.browserConfig = {
    name: "Firefox",
    marketName: "GitHub",
    marketUrl: "https://github.com/lytree/WebProxy"
};

if (typeof (navigator) != 'undefined' && navigator?.userAgent?.toLowerCase().includes("mobile")) {
    environment.notSupported.keyboardShortcuts = true;
    environment.initialConfig.displayTooltipOnBadge = false;
    environment.mobile = true;
}