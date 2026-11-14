/*
 * This file is part of WebProxy <https://github.com/salarcode/SmartProxy>,
 * Copyright (C) 2023 Salar Khalilzadeh <salar2k@gmail.com>
 *
 * WebProxy is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * WebProxy is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with WebProxy.  If not, see <http://www.gnu.org/licenses/>.
 */
import { Debug, DiagDebug } from "../lib/Debug";
import { api } from "../lib/environment";
import { PolyFill } from "../lib/PolyFill";
import { SettingsOperation } from "./SettingsOperation";

export class UpdateManager {
	private static updateIsChecking = false;
	private static readonly updateCheckStorageKey = "lastUpdateCheckTimestamp";
	private static readonly updateCheckIntervalMs = 24 * 60 * 60 * 1000;
	private static lastCheckTimestamp: number = null;

	public static readUpdateInfo() {
		if (UpdateManager.updateIsChecking) {
			DiagDebug?.trace("Checking for update is already in progress...");
			return;
		}
		UpdateManager.updateIsChecking = true;

		if (UpdateManager.lastCheckTimestamp != null) {
			if (UpdateManager.isCheckThrottled(UpdateManager.lastCheckTimestamp)) {
				UpdateManager.updateIsChecking = false;
				return;
			}
			UpdateManager.performUpdateCheck();
			return;
		}

		// the timestamp survives service worker restarts, so storing it keeps
		// the update check from running on every background wake-up
		PolyFill.storageLocalGet(UpdateManager.updateCheckStorageKey, (result: any) => {
			const storedTimestamp = Number(result?.[UpdateManager.updateCheckStorageKey]) || 0;
			UpdateManager.lastCheckTimestamp = storedTimestamp;

			if (UpdateManager.isCheckThrottled(storedTimestamp)) {
				UpdateManager.updateIsChecking = false;
				return;
			}
			UpdateManager.performUpdateCheck();
		}, () => {
			UpdateManager.lastCheckTimestamp = 0;
			UpdateManager.performUpdateCheck();
		});
	}

	private static isCheckThrottled(lastCheckTimestamp: number): boolean {
		return lastCheckTimestamp > 0 &&
			(Date.now() - lastCheckTimestamp) < UpdateManager.updateCheckIntervalMs;
	}

	private static performUpdateCheck() {
		UpdateManager.lastCheckTimestamp = Date.now();
		PolyFill.storageLocalSet({ [UpdateManager.updateCheckStorageKey]: UpdateManager.lastCheckTimestamp });
		DiagDebug?.trace("Checking for update...");

		const updateInfoUrl = "https://api.github.com/repos/lytree/WebProxy/releases/latest";

		fetch(updateInfoUrl, {
			method: 'GET',
			headers: {
				'Accept': 'application/vnd.github+json'
			}
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Request failed with status ${response.status}`);
				}
				return response.json();
			})
			.then((result) => {
				DiagDebug?.trace("Checking for update result", result);
				checkForUpdate(result);
			})
			.catch((error) => {
				Debug.warn(`Checking for update has failed`, error);
			})
			.finally(() => {
				UpdateManager.updateIsChecking = false;
			});


		function checkForUpdate(release: any) {

			if (!release || !release.tag_name) {
				Debug.warn("Invalid update info has received", release);
				return;
			}
			let latestVersion: UpdateInfoType = {
				version: release.tag_name.replace(/^v/i, ""),
				versionName: release.name || release.tag_name,
				downloadPage: release.html_url
			};

			let manifestVersion = api.runtime.getManifest().version;

			// checking...
			if (UpdateManager.compareVersions(latestVersion.version, manifestVersion)) {
				DiagDebug?.trace("New update is found", latestVersion);

				SettingsOperation.saveUpdateInfo({
					updateIsAvailable: true,
					downloadPage: latestVersion.downloadPage,
					version: latestVersion.version,
					versionName: latestVersion.versionName,
					isBrowserSpecific: false
				});
			}
			else {

				SettingsOperation.saveUpdateInfo({
					updateIsAvailable: false,
					downloadPage: null,
					version: null,
					versionName: null,
					isBrowserSpecific: false
				});
			}
		}
	}
	private static compareVersions(a, b) {
		const pa = a.split('.').map(Number);
		const pb = b.split('.').map(Number);
		const len = Math.max(pa.length, pb.length);

		for (let i = 0; i < len; i++) {
			const na = pa[i] ?? 0;
			const nb = pb[i] ?? 0;
			if (na !== nb) return na > nb;
		}
		return false; // equal
	}
}

export type UpdateInfoType = {
	version: string,
	versionName: string,
	downloadPage: URL
}