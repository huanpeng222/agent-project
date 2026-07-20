// lib/tools/calculator.ts
import { tool } from 'ai';
import { z } from 'zod';

export const calculator = tool({
  description: '执行数学计算。当用户问任何需要精确计算的问题（加减乘除、幂、开方等）时使用。',
  inputSchema: z.object({
    expression: z.string().describe('JavaScript 数学表达式，如 "3 ** 17" 或 "Math.sqrt(144)"'),
  }),
  execute: async ({ expression }) => {
    try {
      // 安全校验：只允许数字、运算符、小数点、括号和 Math.xxx 调用
      // 拦截任意 JS 代码（如 require/process/fetch 等）
      const safe = /^[\d\s+\-*/.()%,]*(Math\.[a-zA-Z]+$[^)]*$[\d\s+\-*/.()%,]*)*$/.test(expression);
      if (!safe) {
        return { error: `表达式含非法字符，只允许数字和数学运算: ${expression}`, expression };
      }
      const result = Function(`"use strict"; return (${expression})`)();
      return { result, expression };
    } catch (e) {
      return { error: `计算失败: ${(e as Error).message}`, expression };
    }
  },
});
