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
│   ├── unified-title-menu.css   # 所有游戏统一的 Title & Pause 菜单样式
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
│   └── toenow-sdk.js            # 统一生命周期、存储同步与事件总线
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
2. 建立 `index.html`，引入统一 SDK 与样式。
3. 包含统一标题栏或卡片中的最高分/最高关卡展示元素（ID 建议为 `title-best-score`、`title-best-wave`、`title-best-level`）。
4. 包含统一的开始按钮（如 `id="btn-start"` 或 `id="btn-start-game"`）。
5. 包含统一的结束界面，并集成统一分享按钮与结算格式：
   ```html
   <section id="gameover-screen" class="overlay-screen unified-gameover-screen" role="dialog" aria-modal="true">
     <div class="modal-card">
       <div class="modal-kicker">TIME EXPIRED</div>
       <h2 class="modal-title">GAME OVER</h2>
       <div class="stats-grid">
         <div class="stat-tile">
           <span class="stat-label">FINAL SCORE</span>
           <span class="stat-value highlight" id="gameover-score">0</span>
         </div>
       </div>
       <div class="modal-actions">
         <button type="button" id="btn-retry" data-start="true">PLAY AGAIN</button>
         <button type="button" id="btn-share-score" class="action-btn">SHARE SCORE</button>
         <button type="button" id="btn-gameover-title" class="secondary-btn">EXIT TO HUB</button>
       </div>
     </div>
   </section>
   ```

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

// 游戏结束时结算（自动处理防作弊、过滤练习模式与 Hub 通信）：
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
3. 运行 `npm test` 确保全量测试通过。

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
