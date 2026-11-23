import { environment } from "../../lib/environment";

environment.browserConfig = {
    name: "Thunderbird",
    marketName: "GitHub",
    marketUrl: "https://github.com/lytree/WebProxy"
};
environment.notSupported.setProxySettings = true;
environment.initialConfig.displayTooltipOnBadge = false;