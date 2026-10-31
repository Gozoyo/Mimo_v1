# 🚀 【MicroMove】Supabase 团队云端对接与协同开发操作手册

欢迎各位伙伴接入 MicroMove 统一云端后台！通过本项目配置的 **Supabase**，我们将实现**网页端 (Web)、Codex/AI 插件端以及手机 App 端的数据 100% 互通**（任一端打卡，全端秒级同步）。

为了让网页制作组与插件开发组快速打通连接，避免卡在配置上，请按本手册步骤操作。

---

## 📌 一、 核心连接配置（一秒复制）

所有端（网页端、插件端、移动端）统一连接以下云端实例：

```env
# 1. Supabase 项目基础地址 (Project URL)
VITE_SUPABASE_URL=https://cdpgjujgovomsqsgxzqz.supabase.co

# 2. Supabase 客户端公钥 (Publishable Key / Anon Key)
VITE_SUPABASE_ANON_KEY=sb_publishable_BBFoLf-tOardisfL_YRYLw_m3ZUK1R3
```

> 💡 **安全提示**：此 Key 为只读/受限公钥（受底层 RLS 行级安全策略保护），可安全放入浏览器、插件前端和移动端代码中，但**切勿混淆或向外提供 Secret 管理员密钥**。

---

## 🌐 二、 网页端制作组（Web 前端）完整对接步骤

### 步骤 1：配置环境变量
在你的前端工程根目录下，新建或编辑 `.env.local` 文件，粘贴上述配置：
```bash
VITE_SUPABASE_URL=https://cdpgjujgovomsqsgxzqz.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_BBFoLf-tOardisfL_YRYLw_m3ZUK1R3
```

### 步骤 2：安装 Supabase 官方 SDK
如果尚未安装，在工程根目录终端运行：
```bash
npm install @supabase/supabase-js
```

### 步骤 3：初始化 Supabase 客户端
在 `src/supabase.ts` 中写入以下单例客户端代码：
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ 警告: 未检测到 Supabase 环境变量，请检查 .env.local 配置！");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 步骤 4：核心业务调用示例代码

#### ① 用户注册与登录（认证模块）
```typescript
import { supabase } from './supabase';

// 用户注册
export async function handleSignUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

// 用户密码登录
export async function handleSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

// 退出登录
export async function handleSignOut() {
  await supabase.auth.signOut();
}
```

#### ② 写入运动打卡记录（同步到云端）
```typescript
import { supabase } from './supabase';

export async function uploadSession(sessionData: {
  id: string;
  source: string;
  completedAt: string;
  date: string;
  plannedDurationSec: number;
  actualCompletedSec: number;
  movementCount: number;
  targetAreas: string[];
  exerciseIds: string[];
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.warn("用户未登录，仅保存在本地 localStorage");
    return;
  }

  const { error } = await supabase.from('completed_sessions').insert({
    ...sessionData,
    user_id: session.user.id
  });

  if (error) {
    console.error("同步到云端失败:", error.message);
  } else {
    console.log("打卡记录已成功同步至 Supabase！");
  }
}
```

#### ③ 获取用户运动历史数据
```typescript
export async function fetchMySessions() {
  const { data, error } = await supabase
    .from('completed_sessions')
    .select('*')
    .order('completed_at', { ascending: false });

  if (error) throw error;
  return data; // 仅返回当前登录用户自己的打卡记录
}
```

### 步骤 5：启动与联调
```bash
npm run dev
```
打开浏览器访问控制台，注册新用户即可看到打卡数据实时进入云端。

---

## 🤖 三、 Codex / AI 插件组完整对接步骤

### 场景 A：开发独立 Codex 插件 / VS Code 扩展 / 浏览器扩展

1. **环境与依赖**：
   在插件工程中同样安装 `@supabase/supabase-js`。
2. **处理存储适配（Storage Adapter）**：
   * 浏览器网页默认使用 `window.localStorage` 存储登录态。
   * **若插件运行在 Node.js / VS Code 进程 / Service Worker 中**，请传入插件存储适配器：
     ```typescript
     import { createClient } from '@supabase/supabase-js';

     export const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, {
       auth: {
         persistSession: true,
         // 例如 VS Code 插件可使用 context.globalState:
         storage: {
           getItem: (key) => context.globalState.get(key) || null,
           setItem: (key, val) => context.globalState.update(key, val),
           removeItem: (key) => context.globalState.update(key, undefined),
         }
       }
     });
     ```

### 场景 B：使用 Codex / Cursor 编写代码（防止 AI 幻觉乱写字段）

为了让 AI（Codex、Cursor、Claude Dev、Copilot）严格按照真实的数据库字段编写代码，**请将以下数据库表结构告知 AI**：

#### 核心数据表结构清单：
1. **`preferences` (用户微运动偏好表)**：
   * `user_id` (UUID，主键，外键关联 auth.users)
   * `duration_min` (整数，偏好拉伸时长，单位分钟)
   * `session_duration_sec` (整数，偏好单次时长，单位秒)
   * `exercise_types` (字符串数组，如 `["拉伸"]`)
   * `target_areas` (字符串数组，如 `["肩颈", "腰背"]`)
   * `space` (字符串，空间大小：`"小空间" | "中空间" | "大空间"`)
   * `intensity` (字符串，运动强度：`"温和" | "中等"`)
   * `movement_mode` (字符串，可选：`"seated" | "standing"`)
   * `updated_at` (时间戳)

2. **`completed_sessions` (打卡记录表)**：
   * `id` (TEXT / UUID，主键)
   * `user_id` (UUID，关联用户)
   * `source` (TEXT，来源：`"home_recommendation" | "exercise_library"`)
   * `completed_at` (时间戳)
   * `date` (DATE，如 `2026-10-23`)
   * `planned_duration_sec` (整数，计划秒数)
   * `actual_completed_sec` (整数，实际完成秒数)
   * `movement_count` (整数，动作数量)
   * `target_areas` (字符串数组，锻炼部位)
   * `exercise_ids` (字符串数组，动作 ID 列表)

3. **`liked_exercises` (收藏动作表)**：
   * `user_id` (UUID)、`group_id` (TEXT)、`liked_at` (时间戳)

> 💡 **进阶技巧**：终端运行以下命令，可直接生成官方强类型 TypeScript 声明：
> ```bash
> npx supabase gen types typescript --project-id cdpgjujgovomsqsgxzqz > src/types_db.ts
> ```

---

## 🛡️ 四、 团队协作必读：权限与避坑规范

### 1. 钥匙权限分级（至关重要）
* 🟢 **Publishable Key (`sb_publishable_...`)**：**前端专用公钥**。可以提交到前端代码，所有人都能调用，但它的权限被后端的 RLS（行级安全）牢牢锁死。
* 🔴 **Secret Key (`sb_secret_...` / `service_role`)**：**全库最高管理员权限**。会绕过所有安全策略直接读写任何用户数据。**严禁放入前端代码、严禁提交到 Git、严禁私发给非运维人员！**

### 2. 为什么我查询 `completed_sessions` 查不到别人数据？
* 因为我们启用了 **RLS（Row Level Security 行级安全机制）**。
* 任何用户通过 SDK 发起查询时，PostgreSQL 底层会自动校验 `auth.uid() = user_id`。**用户只能看到且只能修改自己的数据**，完全无需前端写多余的过滤逻辑，云端天然隔离。

### 3. 本地免验证测试
* 开发阶段，控制台已将 `Confirm email`（邮箱验证）放宽，大家在本地网页或插件上**随意输入一个邮箱和 6 位密码即可秒级注册并登录测试**，无需等待接收激活邮件。

### 4. 免费版休眠防坑指南
* **触发条件**：若团队连续 **7 天** 没有向 Supabase 发送任何请求，免费版容器会自动休眠挂起（接口会返回 521 / 502）。
* **一键唤醒**：联系管理员登录 [Supabase 控制台](https://supabase.com/dashboard)，在项目卡片上点击 **「Restore project」**，等待 1 分钟即可全自动恢复，数据 100% 完整无损。

---

祝各位开发顺畅！如有配置问题随时在项目群内沟通！
