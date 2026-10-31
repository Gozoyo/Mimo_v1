# Codex 任务说明：重建动作数据库 + 生成动作封面 + 复刻动作详情页

## 任务背景

当前项目中的旧动作 JSON / exercise database 和最新确认的动作清单差别较大。  
请不要基于旧 JSON 猜测式修改，也不要保留旧动作内容。

本次任务的 source of truth 是本文档中的最终动作清单，以及 `public/exercise-demo-pages/` 中的最终动作页面图片。

核心目标：

1. 找到当前项目中的旧动作数据库文件。
2. 以本文档提供的最终动作清单为唯一标准，重建/覆盖新的动作数据库。
3. 删除或废弃旧动作中没有出现在最终清单里的动作。
4. 使用 `public/exercise-demo-pages/` 中的完整动作页面图片。
5. 从完整动作页面图片中裁切出动作库封面图。
6. 更新动作库页面和动作详情页。
7. 动作详情页需要复刻示范图风格，但不能直接把整张页面截图当成详情页。

---

## 一、图片资源说明

最终动作页面图片已经放在：

```txt
public/exercise-demo-pages/
```

图片文件名使用中文动作名命名，请保留中文文件名，不需要改成英文。

当前图片包括：

```txt
低头后颈放松.png
肩后侧拉伸（右）.png
肩后侧拉伸（左）.png
双手脑后开肩.png
双手相扣上举侧弯.png
双手相扣上举拉伸.png
抬头前颈放松.png
下巴内收.png
右侧颈部侧弯.png
左侧颈部侧弯.png
坐式上身弯曲.png
```

前端访问路径应写成：

```txt
/exercise-demo-pages/图片文件名.png
```

例如：

```json
"demoPageImage": "/exercise-demo-pages/下巴内收.png"
```

注意：

- 图片文件名和 JSON 路径必须完全一致。
- 包括中文括号、空格、标点都必须一致。
- 动作 `id` 可以使用英文 snake_case，作为程序内部识别用。
- 用户看到的动作名、页面标题、图片文件名都使用中文。

---

## 二、非常重要：demoPageImage 和 coverImage 不是同一张图

请严格区分：

### 1. `demoPageImage`

`demoPageImage` 指完整动作页面截图。

它包含：

- 顶部返回首页
- 动作 1/1
- 上方动作展示区
- 动作标题
- 倒计时
- 进度条
- 动作指引
- 安全提示
- 底部提示语

来源目录：

```txt
public/exercise-demo-pages/
```

示例：

```json
"demoPageImage": "/exercise-demo-pages/低头后颈放松.png"
```

### 2. `coverImage`

`coverImage` 指动作库卡片封面图。

它不是完整页面截图，而是从完整页面截图中裁出的“上半部分动作展示大图区域”。

封面图只保留：

- 大圆角动作展示图区域
- 人物动作
- 绿色肌肉高亮
- 肌肉标签
- 左下角效果标签
- 右下角侧别卡片

封面图不包含：

- 页面顶部返回按钮
- 动作标题
- 倒计时
- 进度条
- 动作指引
- 安全提示
- 底部提示语

请从 `public/exercise-demo-pages/` 中的完整页面图裁切出封面图，并保存到：

```txt
public/exercise-covers/
```

示例：

```txt
public/exercise-demo-pages/低头后颈放松.png
```

裁切后生成：

```txt
public/exercise-covers/低头后颈放松.png
```

JSON 中应写成：

```json
"demoPageImage": "/exercise-demo-pages/低头后颈放松.png",
"coverImage": "/exercise-covers/低头后颈放松.png"
```

如果项目中已有自动裁切或图片处理方式，可以使用自动裁切；否则可以先通过 CSS 在动作库卡片中以 `object-fit` / `object-position` 展示上半部分区域，但最终效果必须是动作库卡片只看到上方动作展示区，不要显示整张长页面截图。

---

## 三、找到并覆盖旧动作数据库

请在项目中搜索当前动作数据库文件，可能在以下位置之一：

```txt
src/data/exercises.ts
src/data/exercises.json
src/constants/exercises.ts
src/lib/exercises.ts
src/data/actions.ts
src/constants/actions.ts
```

也可能是其他包含 exercise / action / movement 数据的文件。

找到后请执行：

1. 不要沿用旧动作内容。
2. 旧 JSON / TS 数据只作为字段结构参考。
3. 以本文档下面的最终动作清单为准，重建新的动作数据库。
4. 凡是不在最终动作清单里的旧动作，请删除或标记为 deprecated，不要继续显示在动作库中。
5. 删除旧数据库中不再需要的字段，包括但不限于：
   - `目标部位`
   - `图片路径`
   - `源`
   - `source`
   - `imageSource`
   - 旧参考图字段
6. 新数据库必须保留：
   - `demoPageImage`
   - `coverImage`

---

## 四、新动作数据库字段

新的动作数据库至少包含以下字段：

```ts
{
  id: string;
  category: string;
  name: string;
  targetMuscles: string;
  instructions: string[];
  safetyTips: string[];
  duration: number;
  posture: string;
  space: string;
  intensity: string;
  visibility: string;
  demoPageImage: string;
  coverImage: string;
}
```

不要再保留 `targetArea` / `目标部位` 字段。

---

## 五、最终动作数据

### 1. 下巴内收

```json
{
  "id": "neck_chin_tuck",
  "category": "肩颈",
  "name": "下巴内收",
  "targetMuscles": "颈后深层伸肌群 / 枕下肌群",
  "instructions": [
    "坐直或站直，肩膀放松。",
    "下巴不要低头，而是水平向后平移头部，像做出一点“双下巴”的感觉。",
    "保持后颈被拉长，慢慢呼吸。保持 5–10 秒，期间正常呼吸，不要憋气。放松回到原位。每组做 3 次。"
  ],
  "safetyTips": [
    "不要用力顶脖子。",
    "如果头晕、刺痛或颈部疼痛，停止。",
    "动作以轻微牵拉感为宜。"
  ],
  "duration": 30,
  "posture": "坐姿/站姿",
  "space": "小空间",
  "intensity": "温和",
  "visibility": "低",
  "demoPageImage": "/exercise-demo-pages/下巴内收.png",
  "coverImage": "/exercise-covers/下巴内收.png"
}
```

### 2. 左侧颈部侧弯

```json
{
  "id": "neck_side_tilt_left",
  "category": "肩颈",
  "name": "左侧颈部侧弯",
  "targetMuscles": "上斜方肌",
  "instructions": [
    "身体坐直，头慢慢向右侧倾斜。",
    "让右耳靠近右肩，肩膀保持放松，不要耸肩。",
    "感到左侧颈部轻微拉伸后保持，结束后换另一侧。"
  ],
  "safetyTips": [
    "不要压头猛拉。",
    "只到轻微拉伸感。",
    "如果出现疼痛、麻木或头晕，请立即停止。"
  ],
  "duration": 30,
  "posture": "坐姿/站姿",
  "space": "小空间",
  "intensity": "温和",
  "visibility": "低",
  "demoPageImage": "/exercise-demo-pages/左侧颈部侧弯.png",
  "coverImage": "/exercise-covers/左侧颈部侧弯.png"
}
```

### 3. 右侧颈部侧弯

```json
{
  "id": "neck_side_tilt_right",
  "category": "肩颈",
  "name": "右侧颈部侧弯",
  "targetMuscles": "上斜方肌",
  "instructions": [
    "身体坐直，头慢慢向左侧倾斜。",
    "让左耳靠近左肩，肩膀保持放松，不要耸肩。",
    "感到右侧颈部轻微拉伸后保持，结束后换另一侧。"
  ],
  "safetyTips": [
    "不要压头猛拉。",
    "只到轻微拉伸感。",
    "如果出现疼痛、麻木或头晕，请立即停止。"
  ],
  "duration": 30,
  "posture": "坐姿/站姿",
  "space": "小空间",
  "intensity": "温和",
  "visibility": "低",
  "demoPageImage": "/exercise-demo-pages/右侧颈部侧弯.png",
  "coverImage": "/exercise-covers/右侧颈部侧弯.png"
}
```

### 4. 低头后颈放松

```json
{
  "id": "neck_forward_release",
  "category": "肩颈",
  "name": "低头后颈放松",
  "targetMuscles": "颈后伸肌群 / 枕下肌群",
  "instructions": [
    "坐直，肩膀自然下沉。",
    "慢慢把下巴靠近胸口，感受后颈被轻轻拉开。",
    "保持呼吸，再慢慢回正。"
  ],
  "safetyTips": [
    "不要用手把头往下压。",
    "有颈椎问题者请谨慎。",
    "如出现不适，请立即停止。"
  ],
  "duration": 30,
  "posture": "坐姿/站姿",
  "space": "小空间",
  "intensity": "温和",
  "visibility": "低",
  "demoPageImage": "/exercise-demo-pages/低头后颈放松.png",
  "coverImage": "/exercise-covers/低头后颈放松.png"
}
```

### 5. 抬头前颈放松

```json
{
  "id": "neck_backward_release",
  "category": "肩颈",
  "name": "抬头前颈放松",
  "targetMuscles": "胸锁乳突肌 / 斜角肌",
  "instructions": [
    "双手合十，拇指置于下颌处。",
    "手臂整体均匀发力，轻轻向上、向后引导头部，感受前颈被拉开。",
    "保持 5–10 秒，均匀呼吸，再慢慢回正。"
  ],
  "safetyTips": [
    "不要猛仰头。",
    "不要过度用力。",
    "如果出现头晕、刺痛或前颈不适，请立即停止。"
  ],
  "duration": 30,
  "posture": "坐姿/站姿",
  "space": "小空间",
  "intensity": "温和",
  "visibility": "低",
  "demoPageImage": "/exercise-demo-pages/抬头前颈放松.png",
  "coverImage": "/exercise-covers/抬头前颈放松.png"
}
```

### 6. 肩后侧拉伸（左）

```json
{
  "id": "shoulder_posterior_stretch_left",
  "category": "背部与腰部",
  "name": "肩后侧拉伸（左）",
  "targetMuscles": "左侧三角肌后束 / 肩后侧肌群",
  "instructions": [
    "将左臂横过胸前，右手扶住左上臂。",
    "轻轻把左臂带向身体右侧，感受左肩后侧和上背被拉开。",
    "保持呼吸，结束后换边。"
  ],
  "safetyTips": [
    "不要耸肩。",
    "肩痛时降低力度。",
    "不要硬压肩关节。"
  ],
  "duration": 30,
  "posture": "坐姿/站姿",
  "space": "小空间",
  "intensity": "温和",
  "visibility": "低",
  "demoPageImage": "/exercise-demo-pages/肩后侧拉伸（左）.png",
  "coverImage": "/exercise-covers/肩后侧拉伸（左）.png"
}
```

### 7. 肩后侧拉伸（右）

```json
{
  "id": "shoulder_posterior_stretch_right",
  "category": "背部与腰部",
  "name": "肩后侧拉伸（右）",
  "targetMuscles": "右侧三角肌后束 / 肩后侧肌群",
  "instructions": [
    "将右臂横过胸前，左手扶住右上臂。",
    "轻轻把右臂带向身体左侧，感受右肩后侧和上背被拉开。",
    "保持呼吸，结束后换边。"
  ],
  "safetyTips": [
    "不要耸肩。",
    "肩痛时降低力度。",
    "不要硬压肩关节。"
  ],
  "duration": 30,
  "posture": "坐姿/站姿",
  "space": "小空间",
  "intensity": "温和",
  "visibility": "低",
  "demoPageImage": "/exercise-demo-pages/肩后侧拉伸（右）.png",
  "coverImage": "/exercise-covers/肩后侧拉伸（右）.png"
}
```

### 8. 双手相扣上举拉伸

```json
{
  "id": "back_overhead_reach",
  "category": "背部与腰部",
  "name": "双手相扣上举拉伸",
  "targetMuscles": "背阔肌、肩部、躯干侧链",
  "instructions": [
    "双手手指交扣，向上伸直。",
    "身体慢慢向上延展，感受肩背和腰背被打开。",
    "保持呼吸，放松肩膀，不要耸肩。"
  ],
  "safetyTips": [
    "腰部不舒服时减小拉伸幅度。",
    "不要憋气。",
    "动作以轻微牵拉感为宜。"
  ],
  "duration": 30,
  "posture": "坐姿/站姿",
  "space": "小空间",
  "intensity": "温和",
  "visibility": "中",
  "demoPageImage": "/exercise-demo-pages/双手相扣上举拉伸.png",
  "coverImage": "/exercise-covers/双手相扣上举拉伸.png"
}
```

### 9. 双手相扣上举侧弯

```json
{
  "id": "back_overhead_side_bend",
  "category": "背部与腰部",
  "name": "双手相扣上举侧弯",
  "targetMuscles": "背阔肌、前锯肌、腹外斜肌、躯干侧链",
  "instructions": [
    "双手交扣举过头顶，先向上延展。",
    "再缓慢向左侧弯；回正后再向右侧弯。",
    "左右各 15 秒，共 30 秒。"
  ],
  "safetyTips": [
    "不要塌腰或憋气。",
    "腰部不适时减小侧弯幅度。",
    "动作以轻微牵拉感为宜。"
  ],
  "duration": 30,
  "posture": "坐姿/站姿",
  "space": "小空间",
  "intensity": "温和",
  "visibility": "中",
  "demoPageImage": "/exercise-demo-pages/双手相扣上举侧弯.png",
  "coverImage": "/exercise-covers/双手相扣上举侧弯.png"
}
```

### 10. 双手脑后开肩

```json
{
  "id": "back_hands_behind_head_open_chest",
  "category": "背部与腰部",
  "name": "双手脑后开肩",
  "targetMuscles": "胸大肌、胸小肌、三角肌前束 / 上背肌群",
  "instructions": [
    "坐直，双手放在脑后或颈后。",
    "手肘轻轻向外打开，肩胛骨向后靠近一点。",
    "吸气，感受胸口和上背展开。"
  ],
  "safetyTips": [
    "不要用手拉脖子。",
    "重点是打开胸背，不是仰头。",
    "动作以轻微牵拉感为宜。"
  ],
  "duration": 30,
  "posture": "坐姿/站姿",
  "space": "小空间",
  "intensity": "温和",
  "visibility": "中",
  "demoPageImage": "/exercise-demo-pages/双手脑后开肩.png",
  "coverImage": "/exercise-covers/双手脑后开肩.png"
}
```

### 11. 坐式上身弯曲

```json
{
  "id": "back_seated_forward_bend",
  "category": "背部与腰部",
  "name": "坐式上身弯曲",
  "targetMuscles": "竖脊肌 / 腰背筋膜区",
  "instructions": [
    "坐在椅子前侧，双脚踩稳。",
    "低头含胸，双手抱住小腿或放在膝前，让上背和腰背慢慢弯曲放松。",
    "保持 15–30 秒，均匀呼吸。"
  ],
  "safetyTips": [
    "不要猛压身体。",
    "如果腰痛明显、腿麻或头晕，立即停止。",
    "动作以轻微牵拉感为宜。"
  ],
  "duration": 30,
  "posture": "坐姿/站姿",
  "space": "小空间",
  "intensity": "温和",
  "visibility": "中",
  "demoPageImage": "/exercise-demo-pages/坐式上身弯曲.png",
  "coverImage": "/exercise-covers/坐式上身弯曲.png"
}
```

---

## 六、动作库页面要求

请更新动作库页面，使其只展示新的动作数据库内容。

动作卡片要求：

1. 使用 `coverImage` 作为卡片封面。
2. 动作卡片封面必须只显示动作展示大图区域，不要显示完整长页面截图。
3. 显示动作名称。
4. 显示分类、姿势、时长、强度等必要信息。
5. 点击卡片进入对应动作详情页。
6. 不要继续展示旧动作。

---

## 七、动作详情页要求

请根据提供的动作示范页面，复刻动作练习详情页。  
注意：这是复刻已有视觉，不是重新设计。

动作详情页不应直接把完整页面截图作为整页展示。  
正确做法是使用真实页面组件 + 数据库内容来实现。

详情页需要从新数据库读取：

- `name`
- `category`
- `targetMuscles`
- `instructions`
- `safetyTips`
- `duration`
- `posture`
- `demoPageImage` 或从中裁切出的上方展示区域

页面结构：

1. 顶部导航
   - 左侧：返回首页
   - 右侧：动作 1/1

2. 上方动作展示区
   - 大圆角卡片
   - 展示该动作的上方动作展示区域图
   - 图中应包含人物动作、绿色肌肉高亮、肌肉标签、效果标签、侧别卡片
   - 不要再额外叠加肌肉图
   - 不要把完整页面长图直接塞进这里

3. 中部信息区
   - 小字：`category · posture`
   - 大标题：`name`
   - 右侧倒计时：`duration`
   - 下方绿色进度条

4. 动作指引卡片
   - 标题：动作指引
   - 展示 `instructions` 三条 bullet

5. 安全提示卡片
   - 标题：安全提示
   - 展示 `safetyTips` 三条 bullet

6. 底部提示语
   - 肩颈类：`每天几分钟，轻松呵护颈肩`
   - 背部与腰部类：`每天几分钟，轻松呵护腰背`

---

## 八、重要限制

请严格遵守：

1. 不要重新设计页面。
2. 不要新增小人插画。
3. 不要换成其他健身 App 风格。
4. 不要继续使用旧动作数据。
5. 不要保留 `目标部位` 字段。
6. 不要保留旧的 `图片路径`、`源`、`source`、`imageSource` 字段。
7. 不要自己重新找动作图。
8. 图片已经是最终动作示范图，直接使用。
9. 左右侧动作必须严格区分。
10. 图片路径必须和实际中文文件名完全一致。
11. 如果发现文件名、动作名、JSON 字段不一致，请优先询问，不要自行猜测。
12. 不要把完整页面截图直接当作动作库封面。

---

## 九、最后检查

完成后请检查：

1. `exercise-demo-pages` 是否位于 `public/exercise-demo-pages/`。
2. 是否生成或正确展示了 `coverImage` 对应的动作库封面图。
3. 动作库封面是否只显示上方动作展示区，而不是完整长页面截图。
4. 所有图片路径是否能正常显示。
5. 动作库中是否只剩最终 11 个动作。
6. 旧动作是否已经删除或不再展示。
7. 每个动作卡片是否能进入详情页。
8. 详情页文案是否和新数据库一致。
9. 左侧/右侧动作是否没有反。
10. `目标部位` 字段是否已经删除。
11. 旧的 `图片路径`、`源`、`source`、`imageSource` 字段是否已经删除。
12. 构建是否通过：

```bash
npm run build
```

---

## 十、任务一句话总结

请以本文档中的最终 11 个动作为唯一标准，重建动作数据库；使用 `public/exercise-demo-pages/` 中的中文命名完整页面图；为动作库生成/展示只包含上方动作展示区的 `coverImage`；并用真实网页组件复刻动作详情页。不要沿用旧动作数据，不要重新设计页面，不要把完整页面截图直接当作动作库封面。
