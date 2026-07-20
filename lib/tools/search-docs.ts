// lib/tools/search-docs.ts
import { tool } from 'ai';
import { z } from 'zod';

// 内置知识库（实际项目从文件/数据库读）
const DOCS = [
  { id: 1, title: 'React 19 Actions', content: 'React 19 引入了 Actions，简化表单提交和数据变更...' },
  { id: 2, title: 'use() Hook', content: 'use() 可以读取 Promise 和 Context，配合 Suspense...' },
  // ... 更多文档
];

export const searchDocs = tool({
  description: '检索内置文档知识库。当用户问项目文档、内部知识、特定资料时使用。',
  inputSchema: z.object({
    keyword: z.string().describe('检索关键词'),
  }),
  execute: async ({ keyword }) => {
    const hits = DOCS.filter(
      (d) => d.title.includes(keyword) || d.content.includes(keyword)
    );
    return hits.length > 0
      ? { docs: hits }
      : { docs: [], message: '未找到相关文档' };
  },
});
