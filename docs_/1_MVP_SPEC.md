# 微运动习惯 MVP v1 Specification for Codex

## 0. Implementation Goal

Build a Chinese, mobile-first web app MVP for **微运动习惯 / Micro Movement Habit**.

This product is not a fitness challenge app. It helps office workers and digital nomads who work at computers take a short, low-friction micro-movement break during work.

The core experience:

1. First-time users complete a required onboarding preference survey.
2. Later, when they open the app, they see a clear start modal/card.
3. The app generates a 3–10 minute movement session based on the saved preferences.
4. Each movement lasts 30 seconds.
5. The timer automatically moves to the next movement.
6. After the session, the app shows immediate feedback: completed time, today's total time, streak, number of movements, and main body area.

Use the current repository's tech stack if it already exists. If starting from scratch, use:

- React
- TypeScript
- Tailwind CSS
- localStorage for data persistence

Do **not** implement backend, authentication, database, real push notifications, AI coach, smartwatch integration, PC plugin, community ranking, or leaderboard.

---

## 1. Product Scope

### MVP v1 target context

- Chinese interface
- Office / desk-work context
- Users: computer-based office workers and digital nomads
- No differentiation between office workers and digital nomads in this version
- All movements should be office-friendly, short, and low-friction

### Product positioning

The app should feel like:

- A short break during work
- Practical and low-pressure
- Clean and useful
- Slightly empathetic to working people
- Helpful for getting one's work state back

The app should **not** feel like:

- Fitness competition
- Weight-loss / fat-burning training
- Gym workout
- Cute over-healing emotional companion
- Game-like ranking system
- Aggressive self-discipline product

---

## 2. Pages / Modules

Implement these pages or modules:

1. `Onboarding` — first-time preference survey
2. `Home / Start` — home screen with start modal/card
3. `Temporary Adjust` — temporary settings for the current session only
4. `Exercise Player` — timed movement execution
5. `Completion` — immediate feedback page
6. `Library` — movement library
7. `Profile` — preferences and stats

Bottom tab navigation:

- 开始
- 动作库
- 我的

---

## 3. Data Storage

Use `localStorage`.

### Preferences

Store user preferences as:

```ts
type Preferences = {
  durationMin: number; // 3-10
  targetAreas: ("肩颈" | "手腕与前臂" | "背部与腰部" | "腿部与髋部")[];
  space: "小空间" | "中空间";
  intensity: "温和" | "中等";
  reminderFrequency: "每45分钟" | "每60分钟" | "每90分钟" | "暂不提醒";
  updatedAt: string;
};
```

Storage key suggestion:

```ts
"microMovement.preferences"
```

### Sessions

Store completed sessions as:

```ts
type CompletedSession = {
  id: string;
  completedAt: string; // ISO string
  date: string; // local YYYY-MM-DD
  plannedDurationSec: number;
  actualCompletedSec: number;
  movementCount: number;
  targetAreas: string[];
  exerciseIds: string[];
};
```

Storage key suggestion:

```ts
"microMovement.sessions"
```

---

## 4. First-time Flow

On app load:

1. Check whether preferences exist in localStorage.
2. If no preferences exist:
   - Show onboarding.
   - Onboarding is required.
   - Do not provide a skip button.
3. If preferences exist:
   - Show Home / Start page.
   - Show the start modal/card.

Preferences do not expire automatically. Users can edit them from Profile. The "one month" idea is only a user research period and should not be implemented as an expiration rule.

---

## 5. Onboarding

Use Chinese UI.

Onboarding has 5 required questions.

### Question 1: Session duration

Title:

```text
你希望每次休息多久？
```

Control:

- Slider
- Range: 3–10 minutes
- Default: 5 minutes

Helper copy:

```text
不用很久，几分钟就够身体换个状态。
```

### Question 2: Target body areas

Title:

```text
你最想优先照顾哪里？
```

Control:

- Multi-select cards

Options:

- 肩颈
- 手腕与前臂
- 背部与腰部
- 腿部与髋部

Rules:

- At least one option must be selected.
- Default: 肩颈.
- If multiple areas are selected, the session generator should rotate among selected areas.

### Question 3: Available movement space

Title:

```text
你工作时方便活动的空间？
```

Control:

- Single-select cards

Options:

- 小空间：主要坐着，动作不能太明显
- 中空间：可以站起来，桌边活动一下

### Question 4: Intensity

Title:

```text
你希望动作强度？
```

Control:

- Single-select cards

Options:

- 温和：只想松一下，不想费力
- 中等：可以稍微活动开一点

### Question 5: Reminder preference

Title:

```text
你希望多久被提醒一次？
```

Control:

- Single-select cards

Options:

- 每45分钟
- 每60分钟
- 每90分钟
- 暂不提醒

Important:

- Save this preference only.
- Do not implement real system notifications in MVP v1.

### Onboarding completion button

```text
开始我的第一组微运动
```

After completion:

- Save preferences to localStorage.
- Navigate to Home.

---

## 6. Home / Start Modal

Home should display a clear start modal or main CTA card.

### Title

```text
该松一下了
```

### Subtitle

```text
坐太久了，先用几分钟把状态接回来。
```

### Preference summary

Show the saved preference summary clearly, for example:

```text
本次推荐：5分钟｜肩颈优先｜小空间｜温和
```

If multiple target areas are selected:

```text
本次推荐：5分钟｜肩颈、手腕优先｜小空间｜温和
```

### Actions

Primary button:

```text
开始放松
```

Secondary button:

```text
本次调整
```

Text link:

```text
修改长期偏好
```

### Interaction

- Click `开始放松`: generate a session from saved preferences and enter Exercise Player.
- Click `本次调整`: open Temporary Adjust page/modal. Changes only apply to the current session and do not overwrite stored preferences.
- Click `修改长期偏好`: go to Profile / preference edit mode. Saved changes overwrite localStorage preferences.

---

## 7. Temporary Adjust

Allow the user to temporarily adjust:

- `durationMin`
- `targetAreas`
- `space`
- `intensity`

Do not include `reminderFrequency` here.

After the user confirms temporary adjustment:

- Generate session using temporary preferences.
- Do not overwrite long-term preferences.
- Enter Exercise Player.

Button copy:

```text
按这次设置开始
```

---

## 8. Session Generation Rules

Each exercise lasts exactly 30 seconds.

The session duration selected by the user is a hard constraint.

```ts
desiredCount = durationMin * 2
plannedDurationSec = durationMin * 60
```

Examples:

- 3 minutes = 6 movements
- 5 minutes = 10 movements
- 10 minutes = 20 movements

### Priority rules

1. **Duration is a hard constraint**
   - Final exercise count must equal `desiredCount`.
   - Total planned duration must equal `durationMin * 60`.
   - Never exceed the selected duration.

2. **Body area is the main personalization factor**
   - Prioritize exercises whose `category` or `targetAreas` match selected `targetAreas`.
   - If multiple areas are selected, rotate among selected areas.

3. **Space is more important than intensity**
   - If user selected `小空间`, prioritize exercises where `space === "小空间"`.
   - If there are not enough small-space exercises, allow `中空间` exercises with `visibility !== "高"`; currently all provided exercises use visibility `"低"` or `"中"`.
   - If user selected `中空间`, allow both `小空间` and `中空间`.

4. **Intensity is matched after space**
   - Prefer exercises matching selected `intensity`.
   - If not enough, use the adjacent intensity.
   - If the user selected `温和`, avoid too many `中等` movements.
   - If the user selected `中等`, `温和` movements can be used as fillers.

5. **If there are not enough matching exercises**
   - Add other `officeFriendly === true` exercises.
   - Prefer `visibility === "低"`.
   - If still not enough, repeat low-risk exercises.
   - Avoid repeating the exact same exercise consecutively.

6. **Never exceed the selected duration**
   - It is acceptable to repeat movements if needed to reach exact duration.
   - It is not acceptable to generate a shorter or longer planned session.

### Implementation note

The exercise library currently contains 18 exercises. A 10-minute session needs 20 exercise slots. Therefore, repetition must be supported.

---

## 9. Exercise Player

Each exercise screen must include:

1. Exercise name
2. Progress indicator, e.g. `动作 3 / 10`
3. Image area
4. 30-second countdown
5. Instructions
6. Safety caution
7. Controls

### Image behavior

Each exercise has:

```ts
image: "/assets/exercises/{id}.png"
```

If the image file does not exist:

- Show a soft placeholder card.
- Placeholder text:

```text
动作示意图待替换
```

Do not use a battery image as the exercise demonstration.

The future image area will be replaced with real human photos, short videos, or clear line drawings.

### Timer behavior

1. When a new exercise starts, countdown automatically starts from 30 seconds.
2. When countdown reaches 0, automatically go to the next exercise.
3. After the final exercise reaches 0, automatically navigate to Completion.
4. `暂停` pauses the timer.
5. `继续` resumes the timer.
6. `跳过` goes to the next exercise.
7. `上一个` goes back to the previous exercise and restarts that movement from 30 seconds.
8. On the first exercise, `上一个` can be disabled or replaced with `返回首页`.
9. If the user exits to Home before the session finishes, do not save the session as completed.

### Completed time tracking

Maintain `actualCompletedSec`.

- Increment it only while the timer is running.
- If the user pauses, do not increment.
- If the user skips, do not count skipped remaining time.
- Save a completed session only after the final exercise ends and Completion page is reached.

---

## 10. Completion Page

After the final exercise, automatically show Completion.

The page must display:

1. 本次完成时长  
   Example: `本次完成 5 分钟`

   If the user skipped movements, show the actual completed time based on `actualCompletedSec`.

2. 今日累计时长  
   Example: `今天累计 8 分钟`

3. 连续天数 streak  
   Example: `连续 3 天`

4. 本次完成动作数  
   Example: `完成 10 个动作`

5. 本次重点部位  
   Example: `肩颈优先`

6. One short positive feedback sentence.

### Feedback copy style

Use practical, work-break style copy. Avoid overly sweet, overly healing, or aggressive self-discipline copy.

Good examples:

```text
状态接回来了，继续也不用硬扛。
坐太久的那部分，先松开一点了。
这不是打断工作，是帮你把状态接回来。
几分钟够了，身体已经换了个状态。
```

Avoid:

```text
燃起来
挑战自己
满电人生
你超棒宝宝
坚持就是胜利
自律改变人生
打败别人
```

### Buttons

- `回到首页`
- `再来一组`

### Streak logic

A day counts if the user completes at least one session that day.

Use local date string:

```ts
YYYY-MM-DD
```

Calculate streak by consecutive local dates.

---

## 11. Library

Display all exercises from `src/data/exercises.ts`.

### Top filters

- 全部
- 肩颈
- 手腕与前臂
- 背部与腰部
- 腿部与髋部

### Exercise card fields

Each exercise card should show:

- Image or placeholder
- Exercise name
- Category
- Target areas
- 30秒
- Position
- Space
- Intensity

### Exercise details

Clicking an exercise should open a detail view or expanded panel that shows:

- Image or placeholder
- Name
- Category
- Target areas
- Instructions
- Caution
- Optional source link if convenient
- Button: `试做这个动作`

If implementing `试做这个动作`:

- Start a single-exercise 30-second player.
- After it ends, show a simple completion state or return to the exercise detail.

---

## 12. Profile

Profile page should show:

1. Current preference summary  
   Example:

   ```text
   5分钟｜肩颈优先｜小空间｜温和｜每60分钟
   ```

2. Today's total completed micro-movement time

3. Current streak

4. Simple history list  
   Show:
   - Date
   - Completed duration
   - Target areas
   - Movement count

5. Edit preferences entry

Editing preferences can reuse the onboarding UI in edit mode.

After saving:

- Update localStorage preferences.
- Return to Profile or Home.

---

## 13. Visual Style

### Overall feel

- Chinese
- Mobile-first
- Clean
- Lightweight
- Office-friendly
- Practical
- Low-friction
- Calm but not overly soft

### Avoid

- High-saturation gym-app style
- Strong orange-pink gradients everywhere
- Excessive lightning/battery/game visuals
- Leaderboards
- Competitive streak pressure
- Childish cute mascot dominating the experience
- Overly emotional healing copy

### Recommended palette

- Cream / warm white background
- Soft green
- Warm yellow
- Low-saturation coral
- Pale lavender gray
- Dark gray text

CTA buttons can be visible and motivating, but the whole page should not feel visually loud.

---

## 14. Safety Copy

Show this general safety copy somewhere in Exercise Player and/or onboarding:

```text
动作做到有轻微拉伸感即可，不要拉到疼。如出现疼痛、头晕、麻木或明显不适，请立即停止。
```

This MVP is not medical advice. Users with injuries, chronic pain, dizziness, numbness, or medical conditions should be cautious and seek professional advice when needed.

---

## 15. Exercise Data File

Create this file:

```text
src/data/exercises.ts
```

Use the exact data structure provided in the generated `exercises.ts`.

Do not invent additional exercises in MVP v1 unless needed as fallback. If fallback is needed, repeat low-risk existing exercises rather than inventing new ones.

---

## 16. Acceptance Checklist

The implementation is acceptable when:

- First-time user must complete onboarding.
- Preferences are saved to localStorage.
- Returning user sees Home / Start modal directly.
- Start modal shows a clear preference summary.
- `开始放松` generates a session matching the saved preferences.
- `本次调整` changes only the current session.
- `修改长期偏好` changes saved preferences.
- Each exercise has a 30-second timer.
- Timer auto-advances to the next exercise.
- Final exercise auto-advances to Completion.
- Pause / resume works.
- Skip works and skipped time is not counted.
- Previous works and restarts previous movement at 30 seconds.
- Completion saves a completed session.
- Completion shows actual completed time, today's total, streak, movement count, and target areas.
- Library displays all exercises and category filters work.
- Profile shows preferences, today's total, streak, and history.
- Missing exercise images show placeholders.
- UI is Chinese, mobile-first, clean, office-friendly, and not like a gym challenge app.
