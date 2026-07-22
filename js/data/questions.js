// 自我探索问卷数据:章节 A-E
// 题型: multi(多选+可选自由文本) / single(单选) / slider(滑块+可选说明) /
//       touch(逐项三态标注) / text(自由文本) / text-pair(两个自由文本字段) /
//       willingness(逐项多态意愿标注,状态列表可配置)

const WILLINGNESS_STATES = [
  { value: "willing", label: "愿意" },
  { value: "negotiable", label: "视情况协商" },
  { value: "unwilling", label: "不愿意" },
  { value: "unsure", label: "还不确定" },
  { value: "not_defined", label: "不想定义" },
];

export const CHAPTERS = [
  {
    id: "A",
    title: "亲密的形状",
    subtitle: "想一想,对你来说亲密具体是什么样子",
    questions: [
      {
        id: "A1",
        type: "multi",
        text: '对我来说,"亲密"意味着什么?',
        hint: "可多选,也可以补充你自己的说法",
        options: [
          { value: "deep_talk", label: "深度对话" },
          { value: "physical_touch", label: "身体接触" },
          { value: "cohabitation", label: "共同生活" },
          { value: "shared_routine", label: "共享日常" },
          { value: "mutual_care", label: "相互照顾" },
          { value: "spiritual_resonance", label: "精神共鸣" },
        ],
        allowOther: true,
        relatedTerms: ["squish", "alterous"],
      },
      {
        id: "A2",
        type: "slider",
        text: "我需要多少独处空间?",
        hint: "拖动滑块表示你的倾向,可以在下面补充说明",
        min: 0,
        max: 10,
        step: 1,
        labels: ["几乎不需要独处", "需要大量独处时间"],
        withNote: true,
        notePlaceholder: "例如: 独处的具体形式、什么情况下更需要空间…",
      },
      {
        id: "A3",
        type: "touch",
        text: "哪些形式的身体接触让我舒适 / 不舒适?",
        hint: "为每一项标注你的感受,没有标准答案",
        items: [
          { value: "hug", label: "拥抱" },
          { value: "hand_hold", label: "牵手" },
          { value: "cuddle", label: "依偎" },
          { value: "no_touch", label: "无身体接触" },
        ],
        allowNote: true,
        notePlaceholder: "还有其他想补充的身体接触形式吗?",
      },
    ],
  },
  {
    id: "B",
    title: "承诺与期待",
    subtitle: "梳理你希望这段关系承载哪些内容",
    questions: [
      {
        id: "B1",
        type: "multi",
        text: "我希望关系中包含哪些承诺?",
        hint: "可多选,不必现在就有答案",
        options: [
          { value: "cohabitation", label: "共同居住" },
          { value: "financial_support", label: "财务互助" },
          { value: "emergency_contact", label: "紧急联系人" },
          { value: "long_term_companionship", label: "长期陪伴" },
          { value: "co_parenting", label: "共同抚养宠物或孩子" },
          { value: "no_preset", label: "不预设" },
        ],
        allowOther: true,
        relatedTerms: ["committed-friendship", "relationship-anarchy"],
      },
      {
        id: "B2",
        type: "single",
        text: '我对"排他性"的态度?',
        hint: "选一个当下最贴近你想法的选项",
        options: [
          { value: "emotional_exclusive", label: "情感排他" },
          { value: "non_exclusive", label: "不要求排他" },
          { value: "needs_negotiation", label: "需要协商" },
          { value: "not_sure", label: "还不确定" },
        ],
        relatedTerms: ["exclusivity", "relationship-anarchy"],
      },
      {
        id: "B3",
        type: "slider",
        text: "这段关系在我生活中的优先级期待?",
        hint: "拖动滑块表示你的期待,可以补充说明",
        min: 0,
        max: 10,
        step: 1,
        labels: ["较为次要", "核心优先级"],
        withNote: true,
        notePlaceholder: "例如: 希望在什么情境下被优先考虑…",
        relatedTerms: ["relationship-escalator"],
      },
    ],
  },
  {
    id: "C",
    title: "边界与雷区",
    subtitle: "了解自己的边界,是照顾好自己的第一步",
    questions: [
      {
        id: "C1",
        type: "multi",
        text: "什么行为会让我感到被侵犯边界?",
        hint: "可勾选常见情况,也可以补充你自己的经历",
        options: [
          { value: "nonconsensual_touch", label: "未经同意的身体接触" },
          { value: "ignoring_wishes", label: "忽视我的意愿" },
          { value: "forced_decision", label: "被强迫做决定" },
          { value: "privacy_exposed", label: "被公开我的隐私" },
          { value: "feelings_dismissed", label: "被否定我的感受" },
        ],
        allowOther: true,
        relatedTerms: ["boundaries"],
      },
      {
        id: "C2",
        type: "text",
        text: "我在关系中最害怕什么?",
        hint: "没有标准答案,写下你真实的想法即可",
        placeholder: "在这里自由书写…",
      },
      {
        id: "C3",
        type: "text-pair",
        text: "过往经历中,什么让我感到安全 / 不安全?",
        hint: "可以分别回顾这两方面,也可以只写其中一个",
        fields: [
          { key: "safe", label: "让我感到安全的经历", placeholder: "例如: 对方的某个举动、某种沟通方式…" },
          { key: "unsafe", label: "让我感到不安全的经历", placeholder: "例如: 曾经发生过的、让我不舒服的情况…" },
        ],
      },
    ],
  },
  {
    id: "D",
    title: "沟通风格",
    subtitle: "了解彼此表达和接收关心的方式",
    questions: [
      {
        id: "D1",
        type: "single",
        text: "发生分歧时,我倾向于?",
        hint: "选一个当下最贴近你的选项",
        options: [
          { value: "talk_immediately", label: "立即沟通" },
          { value: "cool_down_first", label: "冷静后再谈" },
          { value: "written", label: "书面表达" },
          { value: "needs_partner_initiate", label: "需要对方主动" },
        ],
        allowOther: true,
      },
      {
        id: "D2_express",
        type: "multi",
        text: "我表达关心的方式",
        hint: '参考"爱之语"但去浪漫化的版本,可多选',
        options: [
          { value: "quality_time", label: "陪伴时间" },
          { value: "affirming_words", label: "肯定言语" },
          { value: "acts_of_help", label: "实际帮助" },
          { value: "gifts", label: "礼物" },
          { value: "physical_touch", label: "身体接触" },
        ],
        allowOther: true,
      },
      {
        id: "D2_receive",
        type: "multi",
        text: "我希望被关心的方式",
        hint: "可多选,和上一题的答案可以不一样",
        options: [
          { value: "quality_time", label: "陪伴时间" },
          { value: "affirming_words", label: "肯定言语" },
          { value: "acts_of_help", label: "实际帮助" },
          { value: "gifts", label: "礼物" },
          { value: "physical_touch", label: "身体接触" },
        ],
        allowOther: true,
      },
    ],
  },
  {
    id: "E",
    title: "性与身体边界",
    subtitle: "了解自己在性相关话题上的意愿与边界",
    optional: true,
    warning: "本章节涉及性相关话题。你可以完全跳过,跳过不影响关系画像的生成。",
    questions: [
      {
        id: "E1",
        type: "willingness",
        text: "对以下几种情形,我目前的意愿是?",
        hint: "为每一项标注你当下的意愿,没有标准答案,随时可以修改",
        items: [
          { value: "sexual_touch", label: "出于性欲的肢体接触(带有性意味的抚摸、亲吻等)" },
          { value: "outercourse", label: "边缘性行为(非纳入式的性接触)" },
          { value: "intercourse", label: "纳入式性行为" },
        ],
        states: WILLINGNESS_STATES,
      },
      {
        id: "E2",
        type: "single",
        text: "性在这段关系中的位置?",
        hint: "选一个当下最贴近你想法的选项",
        options: [
          { value: "include_sex", label: "希望关系包含性" },
          { value: "exclude_sex", label: "明确不包含" },
          { value: "open_negotiation", label: "开放协商" },
          { value: "no_preset", label: "不预设" },
          { value: "not_defined", label: "不想定义" },
        ],
      },
      {
        id: "E3",
        type: "single",
        text: "性的排他性?",
        hint: "选一个当下最贴近你想法的选项",
        options: [
          { value: "exclusive", label: "要求排他" },
          { value: "non_exclusive", label: "不要求排他" },
          { value: "needs_negotiation", label: "需要协商" },
          { value: "not_applicable", label: "不适用" },
          { value: "not_defined", label: "不想定义" },
        ],
        relatedTerms: ["exclusivity"],
      },
      {
        id: "E4_comfort",
        type: "slider",
        text: "谈论性话题时,我的舒适度?",
        hint: "拖动滑块表示你的舒适程度,不确定可以跳过这一题",
        min: 0,
        max: 10,
        step: 1,
        labels: ["非常不适", "完全自在"],
        withNote: false,
      },
      {
        id: "E4_style",
        type: "multi",
        text: "我偏好的性话题沟通方式",
        hint: "可多选,也可以补充你自己的说法",
        options: [
          { value: "in_person", label: "当面直说" },
          { value: "written", label: "书面表达" },
          { value: "tool_or_checklist", label: "借助工具或清单" },
          { value: "wait_for_partner", label: "希望对方先开口" },
          { value: "free_text_pref", label: "自由文本" },
          { value: "not_defined", label: "不想定义" },
        ],
        allowOther: true,
      },
    ],
  },
];

export const ALL_QUESTIONS = CHAPTERS.flatMap((c) =>
  c.questions.map((q) => ({ ...q, chapterId: c.id }))
);

export function getChapter(chapterId) {
  return CHAPTERS.find((c) => c.id === chapterId);
}

export function getQuestion(questionId) {
  return ALL_QUESTIONS.find((q) => q.id === questionId);
}

export function chapterProgress(chapterId, answers) {
  const chapter = getChapter(chapterId);
  if (!chapter) return { done: 0, total: 0 };
  const total = chapter.questions.length;
  const done = chapter.questions.filter((q) => isAnswered(answers[q.id])).length;
  return { done, total };
}

export function isAnswered(value) {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "object") {
    return Object.values(value).some((v) => isAnswered(v));
  }
  return true; // numbers / booleans that were deliberately saved
}
