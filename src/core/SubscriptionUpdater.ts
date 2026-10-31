/*
 * This file is part of WebProxy <https://github.com/salarcode/SmartProxy>,
 * Copyright (C) 2022 Salar Khalilzadeh <salar2k@gmail.com>
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
import { Settings } from "./Settings";
import { ProxyImporter } from "../lib/ProxyImporter";
import { SettingsOperation } from "./SettingsOperation";
import { RuleImporter } from "../lib/RuleImporter";
import { ProxyEngine } from "./ProxyEngine";
import { ImportedProxyRule, ProxyRulesSubscription, ProxyServer, SubscriptionStats } from "./definitions";
import { Utils } from "../lib/Utils";
import { PolyFill } from "../lib/PolyFill";
import { api } from "../lib/environment";
import { CountryCode } from "../lib/CountryCode";

export class SubscriptionUpdater {
	private static serverSubscriptionTimers: SubscriptionTimerType[] = [];
	private static rulesSubscriptionTimers: SubscriptionTimerType[] = [];

	private static readonly ServerAlarmPrefix = "smartproxy-server-subscription:";
	private static readonly RulesAlarmPrefix = "smartproxy-rules-subscription:";

	public static async reloadEmptyServerSubscriptions() {
		/// Read subscriptions that are enabled but have no proxy
		/// This method is async to prevent unnecessary blocking

		for (let subscription of Settings.current.proxyServerSubscriptions) {
			if (!subscription.enabled)
				continue;

			// ignore if already have proxies
			if (subscription.proxies != null && subscription.proxies.length)
				continue;

			SubscriptionUpdater.readServerSubscription(subscription.name);
		}
	}

	public static setServerSubscriptionsRefreshTimers() {
		// -------------------------
		// Proxy Server Subscriptions
		let serverExistingNames: string[] = [];
		for (let subscription of Settings.current.proxyServerSubscriptions) {
			DiagDebug?.trace("updateServerSubscriptions", `enabled:` + subscription.enabled, 'refreshRate:' + subscription.refreshRate);

			// if disabled or refresh is not requested
			if (!subscription.enabled || !(subscription.refreshRate > 0)) {
				let existingTimerInfo = SubscriptionUpdater.getServerSubscriptionIdTimer(subscription.name);
				if (existingTimerInfo?.timer) {
					SubscriptionUpdater.cancelTimer(existingTimerInfo.timer.timerId);

					// remove from array
					SubscriptionUpdater.serverSubscriptionTimers.splice(existingTimerInfo.index, 1);
				}
				continue;
			}

			// it should be active, don't remove it
			serverExistingNames.push(subscription.name);

			let shouldCreate = false;
			let serverTimerInfo = SubscriptionUpdater.getServerSubscriptionIdTimer(subscription.name);
			if (serverTimerInfo == null) {
				// should be created
				shouldCreate = true;
			} else {

				// should be updated if rates are changed
				if (serverTimerInfo.timer.refreshRate != subscription.refreshRate) {
					shouldCreate = true;
					SubscriptionUpdater.cancelTimer(serverTimerInfo.timer.timerId);

					// remove from array
					SubscriptionUpdater.serverSubscriptionTimers.splice(serverTimerInfo.index, 1);
				}
			}

			if (shouldCreate) {
				let interval = subscription.refreshRate * 60 * 1000;
				let firstFetchTimeoutMs: number;

				if (subscription.stats?.lastTryIsoDate) {
					const timeSinceLastTry = Date.now() - (new Date(subscription.stats.lastTryIsoDate)).getTime();

					firstFetchTimeoutMs = Math.max(0, interval - timeSinceLastTry);
				} else {
					firstFetchTimeoutMs = 0;
				}

				const timerId = SubscriptionUpdater.scheduleTimer(
					SubscriptionUpdater.ServerAlarmPrefix + subscription.name,
					interval,
					firstFetchTimeoutMs,
					() => SubscriptionUpdater.readServerSubscription(subscription.name));

				const timerObj = {
					timerId: timerId,
					subscriptionId: subscription.name,
					refreshRate: subscription.refreshRate
				}
				SubscriptionUpdater.serverSubscriptionTimers.push(timerObj);
			}
		}
		// remove the remaining timers
		let remainingTimers = SubscriptionUpdater.serverSubscriptionTimers.filter(timer => {
			// not used or removed. Just unregister it then remove it
			if (serverExistingNames.indexOf(timer.subscriptionId) === -1) {
				SubscriptionUpdater.cancelTimer(timer.timerId);
				return false;
			}

			// it is created or updated, don't remove it
			return true;
		});
		SubscriptionUpdater.serverSubscriptionTimers = remainingTimers;
	}

	private static readServerSubscription(subscriptionName: string) {
		Debug.log("readServerSubscription", subscriptionName);
		if (!subscriptionName)
			return;

		let subscription = Settings.current.proxyServerSubscriptions.find(item => item.name === subscriptionName);
		if (!subscription) {
			// the subscription is removed.
			//remove the timer
			let serverTimerInfo = SubscriptionUpdater.getServerSubscriptionIdTimer(subscriptionName);

			if (!serverTimerInfo)
				return;

			clearInterval(serverTimerInfo.timer.timerId);
			SubscriptionUpdater.serverSubscriptionTimers.splice(serverTimerInfo.index, 1);
			return;
		}
		if (!subscription.stats) {
			subscription.stats = new SubscriptionStats();
		}

		ProxyImporter.readFromServer(subscription,
			function (response: {
				success: boolean,
				message: string,
				result: ProxyServer[]
			}) {
				if (!response) return;

				if (response.success) {
					let count = response.result.length;

					subscription.proxies = response.result;
					subscription.totalCount = count;

					SubscriptionStats.updateStats(subscription.stats, true);

					SettingsOperation.saveAllSync(false);

					// Fire-and-forget: update country codes for proxy servers
					SubscriptionUpdater.updateProxyServersCountryCode(subscription.proxies);

				} else {
					SubscriptionStats.updateStats(subscription.stats, false);
					Debug.warn("Failed to read proxy server subscription: " + subscriptionName);
				}
			},
			function (error: Error) {
				SubscriptionStats.updateStats(subscription.stats, false, error);
				Debug.warn("Failed to read proxy server subscription: " + subscriptionName, subscription, error);
			});
	}

	public static async reloadEmptyRulesSubscriptions() {
		/// Read subscriptions that are enabled but have no rules defined
		/// This method is async to prevent unnecessary blocking

		for (const profile of Settings.current.proxyProfiles) {
			if (!profile.rulesSubscriptions)
				continue;

			for (const subscription of profile.rulesSubscriptions) {
				if (!subscription.enabled)
					continue;

				// ignore if already have proxies
				if ((subscription.proxyRules != null && subscription.proxyRules.length) ||
					(subscription.whitelistRules != null && subscription.whitelistRules.length))
					continue;

				SubscriptionUpdater.readRulesSubscription(subscription);
			}
		}
	}

	public static setRulesSubscriptionsRefreshTimers() {
		// -------------------------
		// Proxy Rules Subscriptions
		let ruleExistingIds: string[] = [];
		for (const profile of Settings.current.proxyProfiles) {
			if (!profile.rulesSubscriptions)
				continue;

			for (const subscription of profile.rulesSubscriptions) {

				// if disabled or refresh is not requested
				if (!subscription.enabled || !(subscription.refreshRate > 0)) {
					// remove existing timers
					let existingTimerInfo = SubscriptionUpdater.getRulesSubscriptionIdTimer(subscription.id);
					if (existingTimerInfo?.timer) {
						SubscriptionUpdater.cancelTimer(existingTimerInfo.timer.timerId);

						// remove from array
						SubscriptionUpdater.rulesSubscriptionTimers.splice(existingTimerInfo.index, 1);
					}

					continue;
				}

				// it should be active, don't remove it
				ruleExistingIds.push(subscription.id);

				let shouldCreate = false;
				let ruleTimerInfo = SubscriptionUpdater.getRulesSubscriptionIdTimer(subscription.id);
				if (ruleTimerInfo == null) {
					// should be created
					shouldCreate = true;
				} else {

					// should be updated if rates are changed
					if (ruleTimerInfo.timer.refreshRate != subscription.refreshRate) {
						shouldCreate = true;
						SubscriptionUpdater.cancelTimer(ruleTimerInfo.timer.timerId);

						// remove from array
						SubscriptionUpdater.rulesSubscriptionTimers.splice(ruleTimerInfo.index, 1);
					}
				}

				if (shouldCreate) {
					let interval = subscription.refreshRate * 60 * 1000;
					let firstFetchTimeoutMs: number;

					if (subscription.stats?.lastTryIsoDate) {
						const timeSinceLastTry = Date.now() - (new Date(subscription.stats.lastTryIsoDate)).getTime();

						firstFetchTimeoutMs = Math.max(0, interval - timeSinceLastTry);
					} else {
						firstFetchTimeoutMs = 0;
					}

					const timerId = SubscriptionUpdater.scheduleTimer(
						SubscriptionUpdater.RulesAlarmPrefix + subscription.id,
						interval,
						firstFetchTimeoutMs,
						() => SubscriptionUpdater.readRulesSubscription(subscription));

					const timerObj = {
						timerId: timerId,
						subscriptionId: subscription.id,
						refreshRate: subscription.refreshRate
					}
					SubscriptionUpdater.rulesSubscriptionTimers.push(timerObj);
				}
			}
		}
		// remove the remaining timers
		let remainingTimers = SubscriptionUpdater.rulesSubscriptionTimers.filter(timer => {
			// not used or removed. Just unregister it then remove it
			if (ruleExistingIds.indexOf(timer.subscriptionId) === -1) {
				SubscriptionUpdater.cancelTimer(timer.timerId);
				return false;
			}

			// it is created or updated, don't remove it
			return true;
		});
		SubscriptionUpdater.rulesSubscriptionTimers = remainingTimers;
	}

	private static readRulesSubscription(subscription: ProxyRulesSubscription) {
		Debug.log("readRulesSubscription", subscription.name);
		if (!subscription || !subscription.name)
			return;

		if (!subscription) {
			// the subscription is removed.
			//remove the timer
			let rulesTimerInfo = SubscriptionUpdater.getRulesSubscriptionIdTimer(subscription.id);

			if (!rulesTimerInfo)
				return;

			clearInterval(rulesTimerInfo.timer.timerId);
			SubscriptionUpdater.rulesSubscriptionTimers.splice(rulesTimerInfo.index, 1);
			return;
		}
		if (!subscription.stats) {
			subscription.stats = new SubscriptionStats();
		}

		RuleImporter.readFromServerAndImport(subscription,
			(importResult: {
				success: boolean;
				message: string;
				rules: {
					whiteList: ImportedProxyRule[];
					blackList: ImportedProxyRule[];
				};
			}) => {
				if (!importResult) return;

				if (importResult.success) {

					subscription.proxyRules = importResult.rules.blackList;
					subscription.whitelistRules = importResult.rules.whiteList;
					subscription.totalCount = importResult.rules.blackList.length + importResult.rules.whiteList.length;

					SubscriptionStats.updateStats(subscription.stats, true);

					SettingsOperation.saveAllSync(false);

					ProxyEngine.notifyProxyRulesChanged();

				} else {
					SubscriptionStats.updateStats(subscription.stats, false);
					Debug.warn("Failed to read proxy rules subscription: " + subscription.name);
				}
			},
			function (error: Error) {
				SubscriptionStats.updateStats(subscription.stats, false, error);
				Debug.warn("Failed to read proxy rules subscription: " + subscription.name, subscription, error);
			});
	}

	private static usesAlarms(): boolean {
		return !!(api?.alarms?.create && api?.alarms?.onAlarm?.addListener);
	}

	/** Schedules a subscription refresh. Alarms are used when available so the
	 * background service worker is not kept alive by long-running timers. */
	private static scheduleTimer(alarmName: string, intervalMs: number, firstFetchTimeoutMs: number, callback: Function): any {
		if (SubscriptionUpdater.usesAlarms()) {
			const periodInMinutes = Math.max(1, Math.round(intervalMs / 60000));
			// delay is recalculated from the last fetch, so re-creating the alarm
			// on every wake-up does not push the next refresh forward
			const delayInMinutes = Math.max(1, Math.round(firstFetchTimeoutMs / 60000));

			api.alarms.create(alarmName, {
				delayInMinutes: delayInMinutes,
				periodInMinutes: periodInMinutes
			});
			return alarmName;
		}

		// Fallback for environments without alarms support
		return setInterval(callback, intervalMs);
	}

	private static cancelTimer(timerId: any) {
		if (!timerId)
			return;

		if (typeof timerId === "string" && SubscriptionUpdater.usesAlarms())
			api.alarms.clear(timerId);
		else
			clearInterval(timerId);
	}

	public static handleAlarm(alarm: any) {
		const alarmName: string = alarm?.name;

		if (!alarmName || !Settings.current)
			return;

		if (alarmName.startsWith(SubscriptionUpdater.ServerAlarmPrefix)) {
			SubscriptionUpdater.readServerSubscription(alarmName.substring(SubscriptionUpdater.ServerAlarmPrefix.length));
			return;
		}

		if (alarmName.startsWith(SubscriptionUpdater.RulesAlarmPrefix)) {
			const subscriptionId = alarmName.substring(SubscriptionUpdater.RulesAlarmPrefix.length);

			for (const profile of Settings.current.proxyProfiles) {
				const subscription = profile.rulesSubscriptions?.find(item => item.id === subscriptionId);
				if (subscription) {
					SubscriptionUpdater.readRulesSubscription(subscription);
					return;
				}
			}

			// the subscription is removed, stop the alarm
			api.alarms.clear(alarmName);
		}
	}

	private static _getSubscriptionIdTimer(timers: SubscriptionTimerType[], id: string)
		: {
			timer: SubscriptionTimerType,
			index: number
		} {
		let index = timers.findIndex(timer => timer.subscriptionId === id);
		if (index >= 0) {
			return {
				timer: timers[index],
				index: index
			};
		}
		return null;
	}

	private static getServerSubscriptionIdTimer(id: string)
		: {
			timer: SubscriptionTimerType,
			index: number
		} {
		return SubscriptionUpdater._getSubscriptionIdTimer(SubscriptionUpdater.serverSubscriptionTimers, id);
	}

	private static getRulesSubscriptionIdTimer(id: string)
		: {
			timer: SubscriptionTimerType,
			index: number
		} {
		return SubscriptionUpdater._getSubscriptionIdTimer(SubscriptionUpdater.rulesSubscriptionTimers, id);
	}

	public static async updateProxyServerSubscriptionsCountryCode(save: boolean = true) {
		// Update country codes for all proxy server subscriptions
		const proxyServerSubscriptions = Settings.current.proxyServerSubscriptions;

		for (const subscription of proxyServerSubscriptions) {
			if (!subscription.enabled || !subscription.proxies || !subscription.proxies.length) {
				continue;
			}

			// Update country codes for this subscription's proxies (don't save yet)
			await SubscriptionUpdater.updateProxyServersCountryCode(subscription.proxies, false);
		}

		// Save once at the end if any updates were made
		if (save) {
			SettingsOperation.saveAllSync(false);
		}
	}

	public static async updateProxyServersCountryCode(proxies: ProxyServer[], save: boolean = true) {
		if (!proxies || !proxies.length) return;

		let updated = false;

		try {
			let proxiesToUpdate: any[] = [];
			for (const proxy of proxies) {
				// Skip if already has country code or no host
				if (proxy.countryCode || !proxy.host) continue;

				let ipAddress = proxy.host;

				// Check if host is already an IP address
				if (!Utils.isIPRelaxed(proxy.host)) {
					// Need to resolve hostname to IP
					try {
						// Use Promise wrapper for DNS resolve
						const dnsResult = await new Promise<any>((resolve, reject) => {
							PolyFill.dnsResolve(proxy.host, [], resolve, reject);
						});

						if (dnsResult?.addresses?.length > 0) {
							ipAddress = dnsResult.addresses[0];
						} else {
							continue; // Skip if DNS resolution failed
						}
					} catch (dnsError) {
						// DNS resolution not supported or failed, skip this proxy
						continue;
					}
				}

				// Check if IP is local/private
				if (Utils.isLocalIP(ipAddress)) {
					proxy.countryCode = "LOCAL";
					updated = true;
					continue;
				}

				proxiesToUpdate.push({
					proxy,
					ipAddress
				});
			}

			if (proxiesToUpdate.length > 0) {
				CountryCode.ensureInitialized(() => {
					for (const item of proxiesToUpdate) {
						// Get country code from IP
						const countryInfo = CountryCode.getRecord(item.ipAddress);
						if (countryInfo?.isoCode) {
							item.proxy.countryCode = countryInfo.isoCode;
							updated = true;
						}
					}

					// Save if any proxy was updated
					if (updated && save) {
						SettingsOperation.saveAllSync(false);
					}
				})
			}
		} catch (error) {
			Debug.warn("Failed to update subscription servers country code", error);
		}
	}
}

type SubscriptionTimerType = { timerId: any, subscriptionId: string, refreshRate: number };

// Registering the alarm handler at module level keeps it attached across
// service worker restarts, so scheduled subscription refreshes keep working.
if (api?.alarms?.onAlarm?.addListener) {
	api.alarms.onAlarm.addListener(SubscriptionUpdater.handleAlarm);
}