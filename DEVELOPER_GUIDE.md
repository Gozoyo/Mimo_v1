# MicroMove 开发与定制操作手册 (Developer Guide)

本手册是 MicroMove 项目的“施工图纸”。当前应用采用 `React 19` + `Vite` + `TailwindCSS` + `Capacitor` 构建。所有未来的架构升级、UI 迭代和功能拓展，均可直接在此底座上无缝进行。

---

## 1. 核心原理：跳转逻辑 (Routing)
本项目没有使用复杂的第三方路由库（如 React Router），而是采用了一套极其轻量且高效的**“状态机 (State Machine) 路由”**。

- **控制中心**：打开 `src/types.ts`，你会看到 `type AppView`。这里定义了应用中所有的“大页面”（如 `home`, `player`, `completion`, `auth` 等）。
- **如何跳转**：在 `src/App.tsx` 中，整个应用由 `const [view, setView]` 这个核心状态控制。
  你想跳转到任何页面，只需要调用一行代码，例如：
  `setView({ name: "player", session: ... })`
- **底部导航栏**：由 `<Shell>` 组件和 `activeTab` 控制（包含首页、动作库、我的）。

---

## 2. 新增页面 (Add New Pages)
如果未来你需要增加一个全新的独立页面（比如：“用户社区”、“运动排行榜”），请遵循以下 3 步：

1. **注册路由类型**：去 `src/types.ts` 中的 `AppView` 类型里，加上你的新页面名字，例如 `| { name: "community" }`。
2. **编写 UI 组件**：在 `App.tsx` 的最下方（或者新建一个 `Community.tsx` 文件），写你的 React 组件：
   ```tsx
   function CommunityScreen() {
     return <div className="animate-rise">这是全新的社区页面</div>;
   }
   ```
3. **挂载到主页面**：在 `App.tsx` 的主 `App()` 函数的 `if...else` 拦截区，加入：
   ```tsx
   if (view.name === "community") {
     return <Shell hideNav><CommunityScreen /></Shell>;
   }
   ```

---

## 3. 修改与替换图片资源 (Images)
所有应用内的静态图片（封面图、IP 演示图、引导页插图）**统一存放在项目根目录的 `public/` 文件夹下**。

- **快速替换**：如果是改现成的图片，直接把新的设计图（PNG/WebP）存入 `public/assets/...`，保持**同名覆盖**即可，代码连改都不用改。
- **引用路径**：在代码里引用图片时，永远使用绝对路径，例如 `<img src="/assets/ip/ip-1.png" />`。

---

## 4. 升级动态 IP 设计 (Mascot & Animations)
当你找画师做好了动态 IP（Lottie 动画），将应用从“静态图片”升级为“动态交互”的方法如下：

1. **安装库**：运行 `npm install lottie-react`。
2. **存放资产**：将做好的 `.json` 动画文件放入 `public/assets/lottie/`。
3. **改造代码**：找到原本渲染图片的地方（如 `Onboarding` 组件），将 `<img>` 标签替换为动态组件：
   ```tsx
   import Lottie from "lottie-react";
   import happyAnimation from "/assets/lottie/happy.json";

   // 状态绑定
   <Lottie animationData={streak > 0 ? happyAnimation : idleAnimation} />
   ```

---

## 5. 修改文案与定制弹窗 (Modals & Prompts)
- **文案修改 (Copywriting)**：应用内所有肉眼可见的文字（标题、描述、按钮词），全都被抽离在 `src/copy.ts` 中。**要改字，只改 `copy.ts`**，不需要去茫茫多的组件里翻找。
- **修改弹窗样式**：目前的“久坐提醒弹窗”是 `StandingPrompt` 组件。它使用 Tailwind 的固定定位（`fixed inset-0 z-30`）覆盖全屏。要修改它的颜色或圆角，直接修改它标签上的 `className`（例如把 `bg-white/90` 改成黑夜模式的 `bg-gray-900`）。

---

## 6. 新增带数据交互的大功能 (Adding New Features)
任何涉及用户数据存储的新功能（比如：记录每天喝水量），必须按以下层级贯通：

1. **数据库层 (Supabase)**：在 Supabase Dashboard 的 SQL Editor 中建表，例如新建 `water_logs` 表，并开启 RLS 权限控制（确保只有用户本人能修改自己的数据）。
2. **类型层 (`src/types.ts`)**：定义数据的 TypeScript 类型，例如 `type WaterLog = { amount: number, date: string }`。
3. **存储与同步层 (`src/storage.ts`)**：写一个 `saveWaterLog` 函数。在里面同时做两件事：
   - 存入 `window.localStorage`（保证断网也能秒开）。
   - 异步调用 `supabase.from('water_logs').insert(...)` 推送到云端。
4. **视图层 (`src/App.tsx`)**：在 UI 里写一个“打卡喝水”的按钮，点击时触发 `saveWaterLog`。

---

## 7. 终极落地：打包生成手机 App (Capacitor)
我们的代码库底层已经注入了跨平台 App 引擎 Capacitor。当你在浏览器里把所有功能都调试满意后，把它变成真实 App 的路径如下：

1. **生成打包文件**：在终端运行 `npm run build`，将 React 代码编译为生产环境产物（输出到 `dist` 目录）。
2. **同步到原生工程**：
   - 运行 `npx cap sync android` 同步至安卓工程。
   - 运行 `npx cap sync ios` 同步至苹果工程。
3. **编译出包**：
   - 使用 Android Studio 打开项目中的 `android` 文件夹，点击 `Build APK` 即可打包出 `.apk` 安装包。
   - 使用 Xcode 打开项目中的 `ios` 文件夹，配置好苹果开发者账号，即可编译到 iPhone 上运行。
4. **原生能力**：任何手机底层的能力（如**定时系统通知**、**底层震动马达**），只需要去 Capacitor 官方插件库寻找（如 `@capacitor/local-notifications`），在 React 代码中调用 API 即可穿透到手机底层。
