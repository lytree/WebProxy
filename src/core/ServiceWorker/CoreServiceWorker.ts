/** Chromium-based browsers (Chrome, Edge, Opera) run the background as a service worker */

import { Debug } from "../../lib/Debug";
import { Core } from "../Core";

self.addEventListener("activate", (event) => {
	Debug.log('CoreServiceWorker.activate DONE');
});

self.addEventListener("install", (event) => {
	Debug.log('CoreServiceWorker.install...', event);
	Core.initializeFromServiceWorker();
	Debug.log('CoreServiceWorker.install DONE');
});
