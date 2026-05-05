# pixel-welcome · 多媒体作品集站点

手绘感交互首页（WebGL 球体菜单）、项目详情与 About 浮层。技术栈：**React 19**、**Vite 8**、**Tailwind CSS 4**、**GSAP**、**WebGL2**（InfiniteMenu）。

## 开发

```bash
npm install
npm run dev
```

```bash
npm run build   # 生产构建
npm run preview # 本地预览构建结果
```

## 资源与目录（Vite / 部署）

- **所有作品资源入库在 `src/assets/`**：`about/`（About 星球）、`p1/` … `p8/`，各目录放 `cover.jpg|png`、图集、以及可选的 **`video.mp4`**。
- 封面与媒体路径由 **`src/data/contentConfig.js`** 通过 **`import.meta.glob('../assets/...')`** 在构建期解析，InfiniteMenu 与详情页共用同一套数据，无需再使用 `public/assets` 符号链接。
- **请勿**在 `.gitignore` 中排除 `src/assets/`（当前未排除），以便 GitHub 与 **Vercel** 能带上封面与本地视频。

## 视频：本地与 YouTube 混合

- 在 **`src/data/portfolioData.js`** 里为每个项目（及 `aboutOrbCard`）预留 **`youtubeId`**（可为空字符串 `''`；支持 11 位 id 或 `youtu.be` / `watch?v=` 链接）。
- **详情页逻辑**：若配置了有效的 `youtubeId`，优先渲染 **YouTube iframe**（`youtube-nocookie`）；否则若存在 **`video.mp4`**，则播放该本地文件；再其余文件按画廊展示。
- **现状说明**：支持**本地大文件与 YouTube 链接混用**；大体积视频后续可逐步改为只填 `youtubeId`，减少仓库体积。

## 部署（Vercel）

根目录选择本仓库，构建命令 `npm run build`，输出目录 `dist`。路由为 SPA 时请保留项目内已配置的 `vercel.json` / `public/_redirects` 等规则（若已存在）。

**注意：** 构建产物必须能只靠本仓库解析——请勿在 CSS/JS 里 `@import` 或引用**仓库外的路径**（例如上一级的 `../css/`）。画册补充样式已放在 **`src/styles/gallery-shared.css`**。

---

基于 Vite React 模板；若需 TypeScript 与更严的 ESLint，可参考 [Vite TS 模板](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts)。
