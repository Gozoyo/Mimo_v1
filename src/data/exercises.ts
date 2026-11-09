export type ExerciseType = "拉伸" | "HIIT燃脂" | "增肌力量" | "平衡稳定";
export type ExerciseCategory = "肩颈" | "上背" | "胸肩" | "腰背";
export type ExerciseSpace = "小空间" | "中空间" | "大空间";
export type ExerciseIntensity = "温和" | "中等";
export type ExercisePosture = "坐姿" | "站姿" | "坐姿/站姿";
export type ExerciseVisibility = "低" | "中";

export type Exercise = {
  id: string;
  type: ExerciseType;
  category: ExerciseCategory;
  name: string;
  targetMuscles: string;
  instructions: string[];
  safetyTips: string[];
  duration: number;
  posture: ExercisePosture;
  space: ExerciseSpace;
  intensity: ExerciseIntensity;
  visibility: ExerciseVisibility;
  demoPageImage: string;
  coverImage: string;
};

export type ExerciseGroup = {
  id: string;
  type?: ExerciseType;
  name: string;
  exerciseIds: string[];
  primaryExerciseId: string;
};

export const exerciseCategories: ExerciseCategory[] = ["肩颈", "上背", "胸肩", "腰背"];

const rawExercises: Exercise[] = [
  {
    id: "neck_side_tilt_left",
    type: "拉伸",
    category: "肩颈",
    name: "左侧颈部侧弯",
    targetMuscles: "上斜方肌",
    instructions: [
      "身体坐直或站直，肩膀自然下沉。",
      "头部缓慢向右侧倾斜，让右耳朝右肩方向靠近；需要时，可将右手轻放在头侧，稍作辅助。",
      "感受左侧颈部轻微拉伸，保持均匀呼吸。"
    ],
    safetyTips: [
      "避免用手向下压头或突然加力。",
      "肩膀保持放松，以轻微拉伸感为宜。",
      "出现疼痛、麻木或头晕时，及时停止动作。"
    ],
    duration: 30,
    posture: "坐姿/站姿",
    space: "小空间",
    intensity: "温和",
    visibility: "低",
    demoPageImage: "/assets/exercises/demos/neck_side_tilt_left.png",
    coverImage: "/assets/exercises/covers/neck_side_tilt_left.png"
  },
  {
    id: "neck_side_tilt_right",
    type: "拉伸",
    category: "肩颈",
    name: "右侧颈部侧弯",
    targetMuscles: "上斜方肌",
    instructions: [
      "身体坐直或站直，肩膀自然下沉。",
      "头部缓慢向左侧倾斜，让左耳朝左肩方向靠近；需要时，可将左手轻放在头侧，稍作辅助。",
      "感受右侧颈部轻微拉伸，保持均匀呼吸。"
    ],
    safetyTips: [
      "避免用手向下压头或突然加力。",
      "肩膀保持放松，以轻微拉伸感为宜。",
      "出现疼痛、麻木或头晕时，及时停止动作。"
    ],
    duration: 30,
    posture: "坐姿/站姿",
    space: "小空间",
    intensity: "温和",
    visibility: "低",
    demoPageImage: "/assets/exercises/demos/neck_side_tilt_right.png",
    coverImage: "/assets/exercises/covers/neck_side_tilt_right.png"
  },
  {
    id: "neck_forward_release",
    type: "拉伸",
    category: "肩颈",
    name: "低头后颈放松",
    targetMuscles: "颈后伸肌群 / 枕下肌群",
    instructions: [
      "坐直或站直，肩膀自然下沉。",
      "慢慢低头，让下巴靠近胸口；需要时，可将手轻放在后脑勺，稍作辅助。",
      "感受后颈被轻轻拉开，保持均匀呼吸。"
    ],
    safetyTips: [
      "避免用手向下压头或突然加力。",
      "颈部已有明显疼痛或活动受限时，减小幅度并谨慎尝试。",
      "出现疼痛、麻木或头晕时，及时停止动作。"
    ],
    duration: 30,
    posture: "坐姿/站姿",
    space: "小空间",
    intensity: "温和",
    visibility: "低",
    demoPageImage: "/assets/exercises/demos/neck_forward_release.png",
    coverImage: "/assets/exercises/covers/neck_forward_release.png"
  },
  {
    id: "neck_backward_release",
    type: "拉伸",
    category: "肩颈",
    name: "抬头前颈放松",
    targetMuscles: "胸锁乳突肌 / 斜角肌",
    instructions: [
      "坐直或站直，肩膀自然下沉。",
      "双手轻放在下颌附近，缓慢抬高视线，让头部轻轻向后延展。",
      "感受前颈轻微拉伸，保持均匀呼吸，再慢慢回正。"
    ],
    safetyTips: [
      "避免猛然仰头或用手推压下颌。",
      "动作幅度以颈部舒适为准。",
      "出现头晕、刺痛或前颈不适时，及时停止动作。"
    ],
    duration: 30,
    posture: "坐姿/站姿",
    space: "小空间",
    intensity: "温和",
    visibility: "低",
    demoPageImage: "/assets/exercises/demos/neck_backward_release.png",
    coverImage: "/assets/exercises/covers/neck_backward_release.png"
  },
  {
    id: "upper_back_forward_push",
    type: "拉伸",
    category: "上背",
    name: "双手前推上背伸展",
    targetMuscles: "菱形肌 / 肩胛骨之间",
    instructions: [
      "坐直，双手在胸前交叉或手指相扣。",
      "手臂向前推出，同时轻轻拱起上背。",
      "感受肩胛骨之间和上背被拉开，保持均匀呼吸。"
    ],
    safetyTips: [
      "避免过度低头，颈部保持自然放松。",
      "背部不适时，减小前推和拱背幅度。",
      "以肩胛骨之间出现轻微牵拉感为宜。"
    ],
    duration: 30,
    posture: "坐姿/站姿",
    space: "小空间",
    intensity: "温和",
    visibility: "低",
    demoPageImage: "/assets/exercises/demos/upper_back_forward_push.png",
    coverImage: "/assets/exercises/covers/upper_back_forward_push.png"
  },
  {
    id: "upper_back_hug",
    type: "拉伸",
    category: "上背",
    name: "抱背上背拉伸",
    targetMuscles: "菱形肌 / 上背肌群",
    instructions: [
      "坐直或站直，双臂在胸前交叉，双手分别抱住对侧肩胛骨附近。",
      "双手轻轻向两侧抱住后背，上背自然微微向后拱。",
      "感受上背和肩胛骨周围被拉开，保持均匀呼吸。"
    ],
    safetyTips: [
      "避免耸肩或用力拉扯手臂。",
      "肩部不适时，减小抱背和拱背幅度。",
      "以感到上背轻微牵拉为宜。"
    ],
    duration: 30,
    posture: "坐姿/站姿",
    space: "小空间",
    intensity: "温和",
    visibility: "低",
    demoPageImage: "/assets/exercises/demos/upper_back_hug.png",
    coverImage: "/assets/exercises/covers/upper_back_hug.png"
  },
  {
    id: "shoulder_posterior_stretch_left",
    type: "拉伸",
    category: "上背",
    name: "肩后侧拉伸（左）",
    targetMuscles: "左侧三角肌后束 / 肩后侧肌群",
    instructions: [
      "将左臂横过胸前，右手扶住左上臂。",
      "轻轻把左臂带向身体右侧，感受左肩后侧被拉开。",
      "保持均匀呼吸，停留在舒适的位置。"
    ],
    safetyTips: [
      "避免耸肩或用力将手臂压向身体。",
      "肩部疼痛时，减小手臂横拉幅度。",
      "以肩后侧出现轻微牵拉感为宜。"
    ],
    duration: 30,
    posture: "坐姿/站姿",
    space: "小空间",
    intensity: "温和",
    visibility: "低",
    demoPageImage: "/assets/exercises/demos/shoulder_posterior_stretch_left.png",
    coverImage: "/assets/exercises/covers/shoulder_posterior_stretch_left.png"
  },
  {
    id: "shoulder_posterior_stretch_right",
    type: "拉伸",
    category: "上背",
    name: "肩后侧拉伸（右）",
    targetMuscles: "右侧三角肌后束 / 肩后侧肌群",
    instructions: [
      "将右臂横过胸前，左手扶住右上臂。",
      "轻轻把右臂带向身体左侧，感受右肩后侧被拉开。",
      "保持均匀呼吸，停留在舒适的位置。"
    ],
    safetyTips: [
      "避免耸肩或用力将手臂压向身体。",
      "肩部疼痛时，减小手臂横拉幅度。",
      "以肩后侧出现轻微牵拉感为宜。"
    ],
    duration: 30,
    posture: "坐姿/站姿",
    space: "小空间",
    intensity: "温和",
    visibility: "低",
    demoPageImage: "/assets/exercises/demos/shoulder_posterior_stretch_right.png",
    coverImage: "/assets/exercises/covers/shoulder_posterior_stretch_right.png"
  },
  {
    id: "chest_hands_behind_head",
    type: "拉伸",
    category: "胸肩",
    name: "双手脑后开肩",
    targetMuscles: "上背肌群 / 肩胛骨周围",
    instructions: [
      "坐直，双手放在脑后或颈后。",
      "手肘轻轻向外打开，肩胛骨向后靠近一点。",
      "吸气，感受胸口和上背展开。"
    ],
    safetyTips: [
      "避免用手向前拉动头部。",
      "手肘在舒适范围内打开，颈部保持自然。",
      "以胸口和上背轻微展开为宜。"
    ],
    duration: 30,
    posture: "坐姿/站姿",
    space: "小空间",
    intensity: "温和",
    visibility: "中",
    demoPageImage: "/assets/exercises/demos/chest_hands_behind_head.png",
    coverImage: "/assets/exercises/covers/chest_hands_behind_head.png"
  },
  {
    id: "chest_interlaced_overhead_reach",
    type: "拉伸",
    category: "胸肩",
    name: "双手交扣上举拉伸",
    targetMuscles: "背阔肌 / 竖脊肌",
    instructions: [
      "双手手指交扣，向上伸直。",
      "向上延展脊柱和躯干，感受肩背和腰背被拉长。",
      "保持均匀呼吸，肩膀自然放松。"
    ],
    safetyTips: [
      "腰背不适时，减小上举和延展幅度。",
      "避免耸肩或憋气。",
      "以肩背和躯干出现轻微延展感为宜。"
    ],
    duration: 30,
    posture: "坐姿/站姿",
    space: "小空间",
    intensity: "温和",
    visibility: "中",
    demoPageImage: "/assets/exercises/demos/chest_interlaced_overhead_reach.png",
    coverImage: "/assets/exercises/covers/chest_interlaced_overhead_reach.png"
  },
  {
    id: "chest_overhead_reach",
    type: "拉伸",
    category: "胸肩",
    name: "双手上举伸展",
    targetMuscles: "背阔肌 / 竖脊肌",
    instructions: [
      "双手自然向上举起，手臂向天花板方向延伸。",
      "向上延展脊柱和躯干，感受肩背和腰背被拉长。",
      "保持均匀呼吸，肩膀自然放松。"
    ],
    safetyTips: [
      "腰背不适时，减小上举和延展幅度。",
      "避免耸肩或憋气。",
      "以肩背和躯干出现轻微延展感为宜。"
    ],
    duration: 30,
    posture: "坐姿/站姿",
    space: "小空间",
    intensity: "温和",
    visibility: "中",
    demoPageImage: "/assets/exercises/demos/chest_overhead_reach.png",
    coverImage: "/assets/exercises/covers/chest_overhead_reach.png"
  },
  {
    id: "chest_hands_behind_open",
    type: "拉伸",
    category: "胸肩",
    name: "双手背后交叉开胸",
    targetMuscles: "胸大肌 / 肩前侧肌群",
    instructions: [
      "坐直或站直，双手在背后交叉或相扣。",
      "手臂轻轻向后伸，胸口向前打开，感觉肩胛骨轻轻往中间靠拢。",
      "保持均匀呼吸。"
    ],
    safetyTips: [
      "避免强行向后拉动手臂。",
      "打开胸口时，避免通过向前顶腰来增加幅度。",
      "肩部疼痛时，减小手臂后伸幅度。"
    ],
    duration: 30,
    posture: "坐姿/站姿",
    space: "小空间",
    intensity: "温和",
    visibility: "中",
    demoPageImage: "/assets/exercises/demos/chest_hands_behind_open.png",
    coverImage: "/assets/exercises/covers/chest_hands_behind_open.png"
  },
  {
    id: "lower_back_overhead_side_bend_left",
    type: "拉伸",
    category: "腰背",
    name: "双手交扣上举侧弯（左）",
    targetMuscles: "左侧腰背 / 背阔肌",
    instructions: [
      "双手交扣举过头顶，先向上延展。",
      "再缓慢向右侧弯。",
      "感受左侧腰背被拉开，保持自然呼吸。"
    ],
    safetyTips: [
      "先向上延展，再缓慢进入侧弯。",
      "侧弯幅度以身体舒适为准。",
      "出现腰背疼痛或头晕时，及时停止动作。"
    ],
    duration: 30,
    posture: "坐姿/站姿",
    space: "小空间",
    intensity: "温和",
    visibility: "中",
    demoPageImage: "/assets/exercises/demos/lower_back_overhead_side_bend_left.png",
    coverImage: "/assets/exercises/covers/lower_back_overhead_side_bend_left.png"
  },
  {
    id: "lower_back_overhead_side_bend_right",
    type: "拉伸",
    category: "腰背",
    name: "双手交扣上举侧弯（右）",
    targetMuscles: "右侧腰背 / 背阔肌",
    instructions: [
      "双手交扣举过头顶，先向上延展。",
      "再缓慢向左侧弯。",
      "感受右侧腰背被拉开，保持自然呼吸。"
    ],
    safetyTips: [
      "先向上延展，再缓慢进入侧弯。",
      "侧弯幅度以身体舒适为准。",
      "出现腰背疼痛或头晕时，及时停止动作。"
    ],
    duration: 30,
    posture: "坐姿/站姿",
    space: "小空间",
    intensity: "温和",
    visibility: "中",
    demoPageImage: "/assets/exercises/demos/lower_back_overhead_side_bend_right.png",
    coverImage: "/assets/exercises/covers/lower_back_overhead_side_bend_right.png"
  },
  {
    id: "lower_back_rotation_side_bend_left",
    type: "拉伸",
    category: "腰背",
    name: "上举旋转侧弯（左）",
    targetMuscles: "左侧腰背 / 背阔肌 / 竖脊肌",
    instructions: [
      "双手举过头顶，先把身体向上拉长。",
      "头和上身轻轻向右转一点，再顺着方向小幅侧弯。",
      "感受左侧方后背被拉开，保持均匀呼吸。"
    ],
    safetyTips: [
      "先向上伸长，再小幅度转身和侧弯。",
      "转身和侧弯幅度以身体舒适为准。",
      "出现腰背疼痛或头晕时，及时停止动作。"
    ],
    duration: 30,
    posture: "坐姿/站姿",
    space: "小空间",
    intensity: "温和",
    visibility: "中",
    demoPageImage: "/assets/exercises/demos/lower_back_rotation_side_bend_left.png",
    coverImage: "/assets/exercises/covers/lower_back_rotation_side_bend_left.png"
  },
  {
    id: "lower_back_rotation_side_bend_right",
    type: "拉伸",
    category: "腰背",
    name: "上举旋转侧弯（右）",
    targetMuscles: "右侧腰背 / 背阔肌 / 竖脊肌",
    instructions: [
      "双手举过头顶，先把身体向上拉长。",
      "头和上身轻轻向左转一点，再顺着方向小幅侧弯。",
      "感受右侧方后背被拉开，保持均匀呼吸。"
    ],
    safetyTips: [
      "先向上伸长，再小幅度转身和侧弯。",
      "转身和侧弯幅度以身体舒适为准。",
      "出现腰背疼痛或头晕时，及时停止动作。"
    ],
    duration: 30,
    posture: "坐姿/站姿",
    space: "小空间",
    intensity: "温和",
    visibility: "中",
    demoPageImage: "/assets/exercises/demos/lower_back_rotation_side_bend_right.png",
    coverImage: "/assets/exercises/covers/lower_back_rotation_side_bend_right.png"
  },
  {
    id: "lower_back_seated_forward_bend",
    type: "拉伸",
    category: "腰背",
    name: "坐式上身弯曲",
    targetMuscles: "竖脊肌 / 腰背筋膜区",
    instructions: [
      "坐在椅子前侧，双脚踩稳。",
      "低头含胸，双手抱住小腿或放在膝前，让上背和腰背慢慢弯曲放松。",
      "保持均匀呼吸，让上背和腰背自然放松。"
    ],
    safetyTips: [
      "避免借力猛压身体或突然加深弯曲幅度。",
      "出现明显腰痛、腿麻或头晕时，及时停止动作。",
      "以腰背出现轻微牵拉感为宜。"
    ],
    duration: 30,
    posture: "坐姿/站姿",
    space: "小空间",
    intensity: "温和",
    visibility: "中",
    demoPageImage: "/assets/exercises/demos/lower_back_seated_forward_bend.png",
    coverImage: "/assets/exercises/covers/lower_back_seated_forward_bend.png"
  }
];

const getAsset = (path: string) => {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
  const base = import.meta.env.BASE_URL || "/";
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${cleanPath}`;
};

export const exercises: Exercise[] = rawExercises.map((ex) => ({
  ...ex,
  coverImage: getAsset(ex.coverImage),
  demoPageImage: getAsset(ex.demoPageImage)
}));

export const pairedExerciseGroups: ExerciseGroup[] = [
  {
    id: "neck_side_tilt",
    type: "拉伸",
    name: "颈部侧屈拉伸",
    exerciseIds: ["neck_side_tilt_left", "neck_side_tilt_right"],
    primaryExerciseId: "neck_side_tilt_left"
  },
  {
    id: "neck_front_back_release",
    type: "拉伸",
    name: "颈部前后放松",
    exerciseIds: ["neck_forward_release", "neck_backward_release"],
    primaryExerciseId: "neck_forward_release"
  },
  {
    id: "shoulder_posterior_stretch",
    type: "拉伸",
    name: "肩后侧拉伸",
    exerciseIds: ["shoulder_posterior_stretch_left", "shoulder_posterior_stretch_right"],
    primaryExerciseId: "shoulder_posterior_stretch_left"
  },
  {
    id: "lower_back_overhead_side_bend",
    type: "拉伸",
    name: "双手交扣上举侧弯",
    exerciseIds: ["lower_back_overhead_side_bend_left", "lower_back_overhead_side_bend_right"],
    primaryExerciseId: "lower_back_overhead_side_bend_left"
  },
  {
    id: "lower_back_rotation_side_bend",
    type: "拉伸",
    name: "上举旋转侧弯",
    exerciseIds: ["lower_back_rotation_side_bend_left", "lower_back_rotation_side_bend_right"],
    primaryExerciseId: "lower_back_rotation_side_bend_left"
  }
];

const pairedGroupByExerciseId = new Map(
  pairedExerciseGroups.flatMap((group) => group.exerciseIds.map((exerciseId) => [exerciseId, group] as const))
);
const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));

export function groupIdForExercise(exerciseId: string) {
  return pairedGroupByExerciseId.get(exerciseId)?.id ?? exerciseId;
}

export function exerciseGroupById(groupId: string) {
  return libraryExerciseGroups().find((group) => group.id === groupId);
}

export function exerciseGroupExercises(group: ExerciseGroup) {
  return group.exerciseIds
    .map((exerciseId) => exerciseById.get(exerciseId))
    .filter((exercise): exercise is Exercise => Boolean(exercise));
}

export function primaryExerciseForGroup(group: ExerciseGroup) {
  return exerciseById.get(group.primaryExerciseId) ?? exerciseGroupExercises(group)[0] ?? exercises[0];
}

export function libraryExerciseGroups(): ExerciseGroup[] {
  const seenExerciseIds = new Set<string>();
  const groups: ExerciseGroup[] = [];

  for (const exercise of exercises) {
    if (seenExerciseIds.has(exercise.id)) continue;
    const pairedGroup = pairedGroupByExerciseId.get(exercise.id);
    if (pairedGroup) {
      groups.push(pairedGroup);
      pairedGroup.exerciseIds.forEach((exerciseId) => seenExerciseIds.add(exerciseId));
      continue;
    }
    groups.push({
      id: exercise.id,
      name: exercise.name,
      exerciseIds: [exercise.id],
      primaryExerciseId: exercise.id
    });
    seenExerciseIds.add(exercise.id);
  }

  return groups;
}

export function groupMatchesCategory(group: ExerciseGroup, category: ExerciseCategory) {
  return exerciseGroupExercises(group).some((exercise) => exercise.category === category);
}
