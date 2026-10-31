const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'exercises.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add ExerciseType
if (!content.includes('export type ExerciseType')) {
  content = content.replace(
    'export type ExerciseCategory = "肩颈" | "上背" | "胸肩" | "腰背";',
    'export type ExerciseType = "拉伸" | "HIIT燃脂" | "增肌力量" | "平衡稳定";\nexport type ExerciseCategory = "肩颈" | "上背" | "胸肩" | "腰背";'
  );
}

// 2. Add to Exercise interface
if (!content.includes('type: ExerciseType;')) {
  content = content.replace(
    'category: ExerciseCategory;',
    'type: ExerciseType;\n  category: ExerciseCategory;'
  );
}

// 3. Add to all exercise instances
// We can use regex to find id: "...", and insert type: "拉伸", right after it.
content = content.replace(/id: "(.*?)",\n/g, (match, id) => {
  if (match.includes('type:')) return match;
  return `id: "${id}",\n    type: "拉伸",\n`;
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated exercises.ts');
