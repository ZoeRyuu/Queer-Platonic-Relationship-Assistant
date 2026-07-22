export const SPECTRUM_AXES = [
  {
    id: "gender-identity",
    label: "性别认同",
    leftLabel: "男性",
    midLabel: "非二元",
    rightLabel: "女性",
    relatedTerms: ["non-binary"],
  },
  {
    id: "gender-expression",
    label: "性别表达强度",
    leftLabel: "高度男性化",
    midLabel: "雌雄同体",
    rightLabel: "高度女性化",
    relatedTerms: ["non-binary"],
  },
  {
    id: "sexual-orientation",
    label: "性取向",
    leftLabel: "异性恋",
    midLabel: "双 / 泛性恋",
    rightLabel: "同性恋",
    relatedTerms: [],
  },
  {
    id: "sexual-attraction-intensity",
    label: "受性吸引强度",
    leftLabel: "无性恋",
    midLabel: "灰性恋",
    rightLabel: "有性恋",
    relatedTerms: ["asexual", "gray-asexual"],
  },
  {
    id: "sexual-desire",
    label: "性欲望 / 性冲动",
    leftLabel: "低欲望",
    midLabel: "中等",
    rightLabel: "高欲望",
    relatedTerms: [],
  },
  {
    id: "romantic-orientation",
    label: "浪漫倾向",
    leftLabel: "无浪漫倾向",
    midLabel: "感兴趣",
    rightLabel: "强烈浪漫倾向",
    relatedTerms: ["aromantic", "grayromantic"],
  },
  {
    id: "relationship-structure",
    label: "关系结构偏好",
    leftLabel: "单偶",
    midLabel: "开放",
    rightLabel: "多偶",
    relatedTerms: ["monogamy-polyamory-spectrum", "polyamory"],
  },
];

export function getAxis(axisId) {
  return SPECTRUM_AXES.find((a) => a.id === axisId);
}
