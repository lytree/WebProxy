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
export var bootstrap: any;
export var jQuery: any;
export var messageBox: any;

if (typeof (window) != 'undefined') {
	bootstrap = window["bootstrap"];
	jQuery = window["jQuery"];
	messageBox = window["messageBox"];
}
else {
	bootstrap = {};
	jQuery = {};
	messageBox = {};
}