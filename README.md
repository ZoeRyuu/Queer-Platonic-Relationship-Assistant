# QPR 助手

一个纯本地的酷儿柏拉图关系(Queerplatonic Relationship)自我探索与关系管理网页应用。

**在线体验: [https://zoeryuu.github.io/Queer-Platonic-Relationship-Companion/](https://zoeryuu.github.io/Queer-Platonic-Relationship-Companion/)**

## 核心原则

- **隐私至上**: 所有数据仅存储在浏览器本地(IndexedDB),不上传任何服务器,无账号系统,无埋点统计
- **纯工具型**: 不接入 AI,所有引导问题、模板均预设在应用内
- **不评判**: 文案和交互不预设任何关系"应该"是什么样,不使用恋爱关系的默认框架

## 功能

- **自我探索**: 引导式问卷(亲密的形状、承诺与期待、边界与雷区、沟通风格、可选的性与身体边界),生成"我的关系画像"
- **我的光谱**: 七条光谱轴自我定位,支持快照与多份对比
- **关系档案**: 为每段关系记录边界、承诺、纪念日与共同约定,支持版本历史与归档
- **沟通工具**: 边界协商模板、定期关系回顾提醒
- **小百科**: 非传统关系相关词汇解释
- **数据导出/导入/清除**、可选本地 PIN 应用锁、PWA 离线支持

## 本地运行

```bash
python .claude/devserver.py 8420
```

然后浏览器打开 `http://localhost:8420`。

## 技术栈

原生 HTML / CSS / JavaScript(ES modules),浏览器原生 IndexedDB,Service Worker 离线缓存,无构建步骤。
