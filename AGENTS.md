# Toenow Architecture & Game Integration Specification

本文件为 Toenow 认知游戏套件（Cognitive Games Suite）的系统架构与新游戏集成规范。任何新增小游戏、重构或修改现有游戏时，**必须严格遵循本规范**。

---

## 1. 核心架构与目录结构

整个项目分为主枢纽（Hub / Portal）、游戏主体（Games）、共享基础设施（Shared SDK）、公共资源（Assets）与测试工具（Tests & Tools）。

```text
toenow/
├── index.html                   # 主 Hub 入口 (Game Portal, 包含游戏网格与 iframe 视窗)
├── package.json                 # 项目依赖与自动化测试脚本
├── assets/                      # 全局静态资源 (预览封面图、统一菜单样式表等)
│   ├── unified-title-menu.css   # 共用 Title、Pause 与 Game Over 样式
│   └── <game-id>-preview.png    # 游戏封面图 (推荐 png/svg 格式)
├── games/                       # 独立小游戏目录
│   └── <game-id>/
│       ├── index.html           # 游戏主页面 (可单页打包，亦可分模块)
│       ├── style.css            # 游戏专属样式 (可选)
│       └── game.js / engine.js  # 游戏逻辑与引擎 (可选)
├── shared/                      # 全局公共 SDK (兼容浏览器与 Node.js 测试环境)
│   ├── toenow-levels.js         # 难度等级 (5 Tiers)、波次映射、Practice 模态框、Score 存储 Key 注册
│   ├── toenow-security.js       # 反作弊校验、行为时序检测、广告 Token 验证
│   ├── toenow-platform.js       # 跨平台环境检测 (全屏、触控、广告等集成抽象)
│   ├── toenow-sdk.js            # 统一生命周期、存储同步与事件总线
│   ├── toenow-screen-config.js  # 游戏名称、文案与画面 ID；仅存放数据
│   └── toenow-screens.js        # ToenowScreens：唯一的开始与结束画面渲染 library
├── tests/                       # 自动化测试用例 (Node.js test runner)
│   ├── games-runtime.test.cjs   # 检查各小游戏语法与 DOM 初始化
│   ├── practice-mode.test.cjs   # 检查练习模式不覆盖记录
│   ├── toenow-sdk.test.cjs      # SDK 测试
│   └── ...
└── tools/                       # 开发、关卡生成与本地服务器工具
```

---

## 2. 独立运行与 Hub 嵌入双重支持

每个游戏在架构上必须满足：
1. **独立运行 (Standalone)**：在浏览器直接打开 `games/<game-id>/index.html` 能够完整游玩，拥有完整的 UI 交互、本地分数持久化与练习模式。
2. **嵌入运行 (Iframe Embedded)**：被主页 `index.html` 作为 `<iframe>` 载入时，能够通过 `postMessage` 向上级 Hub 同步最高分、最高波次，并支持 Hub 控制的返回、重新开始等操作。

---

## 3. Toenow 共享 SDK 规范

### 3.1 引入文件与顺序
在每个游戏的 `index.html` 的 `<head>` 或 `<body>` 头部，必须按顺序引入共享模块与统一样式：

```html
<link rel="stylesheet" href="../../assets/unified-title-menu.css">

<!-- Shared SDK Dependencies (必须遵循顺序) -->
<script src="../../shared/toenow-levels.js"></script>
<script src="../../shared/toenow-security.js"></script>
<script src="../../shared/toenow-platform.js"></script>
<script src="../../shared/toenow-sdk.js"></script>

<!-- Localization：目录必须先于语言运行时 -->
<script src="../../shared/toenow-i18n-core.js"></script>
<script src="../../shared/toenow-i18n-games-a.js"></script>
<script src="../../shared/toenow-i18n-games-b.js"></script>
<script src="../../shared/toenow-i18n.js"></script>

<!-- Shared Screens：配置必须先于渲染 library，且先于游戏代码 -->
<script src="../../shared/toenow-screen-config.js"></script>
<script src="../../shared/toenow-screens.js"></script>
```

### 3.2 难度系统与波次划分 (5 Tiers Standard)
全平台统一分为 5 个难度等级，定义于 `shared/toenow-levels.js`：
* **Level 1 (Beginner)**: Wave 1 - 5 (`startWave: 1`)
* **Level 2 (Intermediate)**: Wave 6 - 10 (`startWave: 6`)
* **Level 3 (Advanced)**: Wave 11 - 15 (`startWave: 11`)
* **Level 4 (Expert)**: Wave 16 - 20 (`startWave: 16`)
* **Level 5 (Master)**: Wave 21+ (`startWave: 21`)

使用 `ToenowLevels.getLevelInfo(currentWave)` 获取当前关卡的等级对象与徽章文本（如 `LVL 2 · INTERMEDIATE`）。

### 3.3 存储 Keys 与数据隔离规范
每个游戏必须拥有唯一且隔离的 LocalStorage 键名：
* 存储键名由 `shared/toenow-levels.js` 中的 `GAME_STORAGE_KEYS` 统一管理。
* 命名惯例：`<game_id_clean>_best_score` 与 `<game_id_clean>_best_wave`。
* 严禁直接无规则写入通用的 `high_score`。

### 3.4 练习模式 (Practice Mode) 铁律
游戏提供练习模式让玩家选择波次起跑（通过 `ToenowLevels.setupPracticeMode` 渲染选关）。
* **保护原则**：在 `isPracticeMode = true` 状态下，**严禁向 LocalStorage 写入或覆盖最高分 (Best Score) 和最高关卡 (Best Wave)**。
* Hub 在收到 `GAME_OVER` 消息时，若 `payload.isPractice === true` 会忽略分数持久化。

### 3.5 开始与结束画面必须调用 ToenowScreens（强制）

**每个新增游戏都必须使用 `shared/toenow-screens.js`（`ToenowScreens`）生成开始画面与游戏结束画面。仅引用共同 CSS、做出相似外观，不算符合规范。**

* 开始与结束画面的 HTML／JSX 模板、成绩格式、五级徽章及分享按钮逻辑，只能由共用 library 实现。**禁止在游戏目录复制模板、自行建立另一套画面组件，或在游戏内重复格式化标题记录与结算 UI。**
* 游戏只提供文案／配置、最高分／波次等数据，以及开始、练习、重玩和返回标题的回呼；游戏本身仍负责玩法、计时、储存与 SDK 结算。
* 游戏特有的名称、分类、description、How to Play、Tips 与元素 ID，登记在 `shared/toenow-screen-config.js`；配置只存数据，不放 HTML 或渲染代码。新增文案必须有中英文语言目录条目。
* 普通 HTML 游戏可用 `ToenowScreens.mount(gameId)` 生成两个画面后绑定游戏操作；需要回呼的集成使用 `renderTitle(host, gameId, options)` 和 `renderGameOver(host, gameId, options)`。
* React 等框架只能提供 host 容器与生命周期 adapter，仍必须调用同一个 library；卸载时调用返回的 `destroy()`，不得另写 React 版模板。
* 标题记录必须调用 `ToenowScreens.updateTitle(gameId, { bestScore, bestWave })`；结算必须调用 `ToenowScreens.updateGameOver(gameId, { score, bestScore, wave, combo, reason })`。等级由共用五级映射计算；没有连击机制的游戏传 `combo: null`。`reason` 使用 `GAME OVER` 或 `TIME EXPIRED`。
* `mount`／`render*` 负责生成画面，**不会自动切换游戏状态**。游戏生命周期必须正确切换容器的 `active`／`hidden` 状态；时间归零必须启用结束画面，重玩或返回标题必须关闭结束画面。不得为了显示画面而复制一份模板。
* 共用结束画面统一为四格成绩（分数、最高分、到达波次、最高连击）、本次 Level 1–5，以及「再玩一次／分享成绩／标题画面」三个按钮；变更结构或外观时修改共用 library／样式，不能只修改单个游戏。

当前 `animal-rescue-train` 是既有的明确例外，暂保留原有开始与结束流程；其余现有游戏及**所有新增游戏**均受上述规则约束。此例外不自动适用于其他游戏。

---

## 4. 新增游戏完整集成 Checklist (New Game Checklist)

添加新游戏时，必须按以下步骤操作：

### Step 1: 注册存储 Key
在 [shared/toenow-levels.js](file:///c:/Users/HsinYuChen/source/repos/toenow/shared/toenow-levels.js) 的 `GAME_STORAGE_KEYS` 添加新游戏：
```javascript
'new-game-id': { score: 'new_game_best_score_v1', wave: 'new_game_best_wave_v1' }
```

### Step 2: 创建游戏目录与页面
1. 建立 `games/<new-game-id>/` 目录。
2. 在 `shared/toenow-screen-config.js` 登记游戏文案及 `titleId`、`endId`、`headingId`、`startId`、`retryId`、`returnId`、`fields` 等配置，沿用现有配置结构。
3. 建立 `index.html`，按 3.1 引入 SDK、语言模块、画面配置与 `ToenowScreens`。
4. 页面只声明空容器，ID 必须与画面配置相符；**不要复制任何标题卡片或结算卡片 HTML**：
   ```html
   <section id="title-screen" data-toenow-screen="title"></section>
   <section id="gameover-screen" data-toenow-screen="gameover"></section>
   ```
5. 在容器存在后、游戏查询生成的按钮／元素之前，调用 `ToenowScreens.mount('new-game-id')`，或按 3.5 使用带回呼的 `renderTitle`／`renderGameOver`。开始按钮、最高分记录、结算卡片与分享按钮全部由 library 生成；练习选择使用共用 `ToenowLevels`。
6. 连接游戏操作与画面状态切换：进入标题时更新标题记录，游戏结束时传入实际结算数据并显示结束画面，重玩／返回标题时关闭结束画面；同时验证中英文切换。

### Step 3: 初始化 SDK 与生命周期管理
在游戏逻辑中实例化 `ToenowGameSDK`：
```javascript
const sdk = new ToenowGameSDK({
  gameId: 'new-game-id',
  category: 'puzzle', // 或 memory / reflex / math / logic
  onStart: () => { startGame(); },
  onPause: () => { pauseGame(); },
  onResume: () => { resumeGame(); },
  onRestart: () => { restartGame(); }
});

// 游戏负责传数据，共用 library 负责画面；不能自行写结算卡片 HTML。
ToenowScreens.updateGameOver('new-game-id', {
  score: currentScore,
  bestScore: savedBestScore,
  wave: currentWave,
  combo: peakCombo, // 无连击机制时传 null
  reason: 'TIME EXPIRED'
});
const endHost = document.getElementById('gameover-screen');
endHost.classList.remove('hidden');
endHost.classList.add('active');

// SDK 另行处理防作弊、练习模式过滤与 Hub 通信，画面 library 不取代 SDK。
sdk.handleGameOver({
  score: currentScore,
  wave: currentWave,
  isPractice: isPracticeMode
});
```

### Step 4: 在 Hub (主页) 注册
在根目录 [index.html](file:///c:/Users/HsinYuChen/source/repos/toenow/index.html) 中：
1. 在 `GAMES` 配置数组中添加卡片对象：
   ```javascript
   {
     id: 'new-game-id',
     title: '游戏名称',
     category: 'puzzle', // 分类标签
     desc: '简要介绍',
     preview: 'assets/new-game-id-preview.png',
     url: 'games/new-game-id/index.html',
     scoreKey: 'new_game_best_score_v1',
     waveKey: 'new_game_best_wave_v1'
   }
   ```
2. 将游戏预览图放入 `assets/<new-game-id>-preview.png`。

### Step 5: 添加与更新自动化测试
1. 在 [tests/games-runtime.test.cjs](file:///c:/Users/HsinYuChen/source/repos/toenow/tests/games-runtime.test.cjs) 中的 `GAMES` 列表加入该游戏及开始按钮 ID，确保基本 DOM 初始化与语法通过。
2. 在 [tests/practice-mode.test.cjs](file:///c:/Users/HsinYuChen/source/repos/toenow/tests/practice-mode.test.cjs) 中添加该游戏的练习模式测试。
3. 将新游戏加入 `tests/toenow-screens.test.cjs` 的共用画面覆盖范围，验证调用同一个 library、没有复制模板或单独格式化等级，并验证标准成绩字段与三个按钮。
4. 更新 `tools/verify-shared-screens-browser.cjs` 的游戏结束测试 hook，验证实际游戏生命周期；新增配置会进入全部游戏的共用 DOM 与尺寸比较。
5. 运行 `npm test` 与共用画面浏览器回归，确保开始／结束画面的中英文、桌面／手机尺寸、重玩、分享、返回标题、iframe 与练习模式记录保护全部通过。浏览器测试使用配置好的 Playwright runtime，并通过 `TOENOW_TEST_URL` 指定本地服务地址：
   ```bash
   node tools/verify-shared-screens-browser.cjs
   ```

---

## 5. UI / UX 与响应式规范

1. **响应式自适应**：
   * 必须在 `<head>` 包含 `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`。
   * 支持触摸（Touch）与鼠标点击操作，Canvas 或容器建议使用 CSS `aspect-ratio` 或动态自适应缩放（Resize Handler）。
2. **退出/返回 Hub**：
   * 提供明显的「Back to Hub」或「Menu」按钮。
   * 若处于 iframe 内部，应触发 `window.parent.postMessage({ type: 'CLOSE_GAME' }, '*')` 或 `sdk.exitToHub()`。

---

## 6. 验证与回归命令

开发与修改后的必要命令：

* **自动化测试**（必须无报错通过）：
  ```bash
  npm test
  ```
* **本地调试服务**：
  ```bash
  npm run serve
  ```
  然后在浏览器访问 `http://localhost:8080` (或控制台输出的对应端口) 测试 Hub 与独立模式。
