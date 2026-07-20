// lib/tools/web-search.ts
import { tool } from 'ai';
import { z } from 'zod';
import { tavily } from '@tavily/core';
import { withTimeout } from '../utils/with-timeout';

const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });

export const webSearch = tool({
  description: '联网搜索实时信息。当用户问最新资讯、当前事件、实时数据等训练数据里没有的信息时使用。',
  inputSchema: z.object({
    query: z.string().describe('搜索关键词'),
  }),
  execute: async ({ query }) => {
    try {
      const res = await withTimeout(
        client.search(query, { maxResults: 5 }),
        8000,
        'web_search'
      );

      // ③ 空结果也要明确告诉模型
      if (!res.results?.length) {
        return { success: false, message: `未搜到 "${query}" 的相关结果，建议换个关键词` };
      }
      return {
        results: res.results.map((r) => ({
          title: r.title,
          url: r.url,
          content: r.content,
        })),
      };
    } catch (e) {
      // ① 失败返回结构化错误，模型能据此决定重试或跳过
      return { success: false, error: `搜索服务暂时不可用: ${(e as Error).message}` };
    }
  },
});
