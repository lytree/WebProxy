## WebProxy

[![license](https://img.shields.io/github/license/salarcode/SmartProxy.svg)](https://github.com/salarcode/SmartProxy/blob/master/LICENSE)

#### 来源

本项目基于开源浏览器扩展 SmartProxy 修改而来，原始来源保留如下：

- 原项目：https://github.com/salarcode/SmartProxy
- 本仓库：https://github.com/lytree/WebProxy

#### WebProxy 是什么

WebProxy 是一个基于 WebExtensions / Chrome Extensions 技术实现的 Firefox / Chrome 浏览器扩展。

它通过规则模式自动决定何时为某个网站启用代理。使用 WebProxy，你无需手动切换代理的开关：只需一键即可把目标网站加入代理规则列表，之后访问该网站时，WebProxy 会自动让该网站的所有数据经由代理传输。

此外，WebProxy 的设计灵感来自现已过时的 AutoProxy 与 AutoProxy-ng。WebProxy 完全基于 WebExtensions 从零实现，并提供比这些旧方案更丰富的功能。

##### 主要功能

- 根据规则模式自动判断何时对特定网站启用或停用代理
- 在多个代理服务器之间轻松切换当前使用的代理
- 一键将当前网站加入代理列表
- 查看当前网站的条目与请求，并一键决定是否为它们启用代理
- 轻松切换代理模式，并可对全部域名启用代理
- 通过订阅支持 Proxy API
- 备份 / 恢复设置与规则

#### 如何参与翻译

如果你希望 WebProxy 支持你的语言，或现有翻译不完整，可前往 https://crowdin.com/project/smartproxy ，使用 Google 或 GitHub 账号登录，然后选择你的语言即可开始翻译。

#### 如何构建 / 调试

环境要求

    Node.js + pnpm
    Firefox 或 Chrome 浏览器

运行项目

    pnpm install
    pnpm dev-firefox    # 构建 + 监听 + 通过 web-ext 启动 Firefox
    pnpm dev            # 构建 + 监听 + 通过 web-ext 启动 Chromium

构建产物输出到 `extension/` 目录，通过构建脚本选择目标浏览器：

    build-ch (Chrome)   build-ed (Edge)   build-op (Opera)
    build-ff (Firefox)  build-ff-unlisted  build-ff-android  build-th (Thunderbird)

在浏览器构建命令后追加 `:watch`（例如 `pnpm run build-ff:watch`）即可在修改后自动重新构建。

代码质量与打包：

    pnpm typecheck      # tsc --noEmit
    pnpm lint           # ESLint flat config
    pnpm pack           # 生成 extension.zip + extension.crx + extension.xpi

在执行 `pnpm pack` 之前请先运行对应的浏览器构建（Chromium 系生成 crx，Firefox / Thunderbird 生成 xpi）。

在 **Firefox** 中安装：

https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/

1. 使用 `pnpm run build-ff` 命令构建项目
2. 打开 Firefox
3. 在地址栏输入 "about:debugging"
4. 点击 "Load Temporary Add-on"
5. 打开 `extension/` 目录，选择其中的任意文件

在 **Google Chrome** 中安装：

https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked

1. 使用 `pnpm run build-ch` 命令构建项目
2. 打开 Chrome，访问 chrome://extensions 进入扩展管理页面
3. 也可以点击 Chrome 菜单，依次选择“更多工具”与“扩展程序”打开该页面
4. 打开右上角的“开发者模式”开关
5. 点击“加载已解压的扩展程序”，选择 `extension/` 目录

#### 发布到 Microsoft Edge 加载项商店

Edge 版本的包通过 `pnpm run build-ed` 构建；`pnpm run pack:zip` 会生成用于商店上传的 `extension.zip`。

手动提交（首次发布）：

1. 登录 [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/public/login) 并创建扩展产品。
2. 从扩展概览页面复制 **Product ID**。
3. 在“程序包”区域上传 `extension.zip` 并提交审核。

通过 [Microsoft Edge 加载项发布 API](https://learn.microsoft.com/microsoft-edge/extensions/update/api/using-addons-api)（v1.1）实现自动更新：

1. 在 Partner Center 中依次进入 **Microsoft Edge > 发布 API**，创建 API 凭据。
2. 添加以下仓库密钥：

   | 密钥 | 说明 |
   | --- | --- |
   | `EDGE_PRODUCT_ID` | 已发布扩展的 Product ID（GUID） |
   | `EDGE_CLIENT_ID` | 发布 API 页面中的 Client ID |
   | `EDGE_API_KEY` | 发布 API 页面中的 API Key |

3. 推送 `v*` 标签（例如 `v1.0.0`），或手动运行 **Publish to Microsoft Edge Add-ons** 工作流。该工作流会构建 Edge 包、上传到草稿提交、等待处理完成，然后发布。

该 API 只能更新已存在的产品，首次提交必须通过 Partner Center 完成。

#### 致谢

WebProxy 使用 [IP2Location LITE](https://lite.ip2location.com) 进行 IP 地理位置解析。由于许可要求，数据库未包含在仓库中。
