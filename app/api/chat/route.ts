import { streamText, convertToModelMessages, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { defaultModel } from '@/lib/llm-provider';
import { searchDocs } from '@/lib/tools/search-docs';
import { webSearch } from '@/lib/tools/web-search';
import { REACT_SYSTEM_PROMPT } from '@/lib/prompts';
import { logError } from '@/lib/utils/logger';

// 允许流式响应最长 60s（ReAct 多步循环需要更多时间）
export const maxDuration = 60;

export async function POST(req: Request) {
  try {


    const { messages } = await req.json();

    console.log('🤖 [chat] 收到请求', messages.length, '条消息');

    const result = streamText({
      model: defaultModel,
      messages: await convertToModelMessages(messages),
      system: REACT_SYSTEM_PROMPT,
      tools: {
        calculator: tool({
          description: '执行数学计算，如加减乘除、幂运算等',
          inputSchema: z.object({
            expression: z.string().describe('要计算的数学表达式，如 "25 ** 2" 或 "3 + 5 * 2" '),
          }),
          execute: async ({ expression }) => {
            console.log('🔧 [chat] 调工具 calculator:', expression);
            try {
              if (!/^[0-9+\-*/().\s**]+$/.test(expression)) {
                return `❌ 不安全的表达式: ${expression}`;
              }
              return Function(`"use strict"; return (${expression})`)();
            } catch (e) {
              return `⚠️ 计算错误: ${(e as Error).message}`;
            }
          },
        }),

        web_search: webSearch,
        search_docs: searchDocs,
      },

      // ★ 自动 ReAct 循环，最多转 10 圈
      stopWhen: stepCountIs(10),
      // 流内部出错的回调
      // 错误处理
      onError: ({ error }) => {
        logError('agent-stream', error);
      },
      // 每步结束回调 —— 看模型每一步做了什么决策
      onStepFinish: (event) => {
        console.log('📋 [chat] 第', event.stepNumber, '步结束, toolCalls:', event.toolCalls?.length || 0, '条');
        if (event.toolCalls?.length) {
          event.toolCalls.forEach(tc => {
            console.log('  → 调', tc.toolName, JSON.stringify(tc.input));
          });
        }
        if (event.text) {
          console.log('  → 文本回复:', event.text.slice(0, 80));
        }
      },

      // 全部完成回调
      onFinish: (event) => {
        console.log('✅ [chat] 全部完成, 共', event.steps.length, '步');
      },
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        // 返回给前端的错误消息（不暴露敏感细节）
        return '抱歉，服务暂时不可用，请稍后重试。';
      },
    });
  } catch (e) {
    // 请求解析/初始化阶段的错误
    // 🟢 Node: 手动构造带 500 状态码的 Response（前端 fetch 能通过 res.status 判断失败）
    return new Response(
      JSON.stringify({ error: '请求处理失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
