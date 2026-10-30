import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const sourceGlobals = {
	...globals.browser,
	...globals.webextensions,
	$: "readonly",
	jQuery: "readonly",
	browser: "readonly",
	debug: "readonly",
	environment: "readonly",
	jsGrid: "readonly",
	localizeHtmlPage: "readonly",
	messageBox: "readonly",
	Noty: "readonly",
	proxyImporter: "readonly",
	proxyModeType: "readonly",
	polyfill: "readonly",
	ruleImporter: "readonly",
	utils: "readonly",
};

// 沿用旧配置的告警级别，避免在大范围存量代码上引入阻塞性错误
const relaxedRules = {
	"no-console": "warn",
	"no-extra-semi": "warn",
	"no-useless-escape": "warn",
	"no-var": "warn",
	"no-debugger": "warn",
	"no-empty": "warn",
	"no-fallthrough": "warn",
	"no-unreachable": "warn",
	"no-case-declarations": "warn",
	"no-useless-assignment": "warn",
	"no-unassigned-vars": "warn",
	"no-setter-return": "warn",
};

export default [
	{
		ignores: ["extension/**", "build/**", "build-*/**"],
	},
	{
		files: ["src/**/*.js"],
		ignores: ["**/*.min.js", "src/ui/js/jsgrid.bootstrap.js", "src/ui/js/ProxyEngineChrome.js"],
		languageOptions: {
			ecmaVersion: 2021,
			sourceType: "script",
			globals: {
				...sourceGlobals,
				...globals.commonjs,
			},
		},
		rules: {
			...js.configs.recommended.rules,
			"no-undef": "warn",
			"no-unused-vars": "warn",
			...relaxedRules,
		},
	},
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parser: tseslint.parser,
			ecmaVersion: 2021,
			sourceType: "module",
			globals: sourceGlobals,
		},
		plugins: {
			"@typescript-eslint": tseslint.plugin,
		},
		rules: {
			...js.configs.recommended.rules,
			// TypeScript 自身负责未定义与未使用检查
			"no-undef": "off",
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": "warn",
			...relaxedRules,
		},
	},
	{
		files: ["scripts/**/*.mjs", "eslint.config.mjs"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...globals.node,
			},
		},
		rules: {
			...js.configs.recommended.rules,
			"no-console": "off",
		},
	},
];
