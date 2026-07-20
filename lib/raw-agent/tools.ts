export const toolExecutors: Record<string, (args: any) => Promise<unknown>> = {
  calculator: async ({ expression }: { expression: string }) => {
    try {
      const safe = /^[\d\s+\-*/.()%,]*(Math\.[a-zA-Z]+$[^)]*$[\d\s+\-*/.()%,]*)*$/.test(expression);
      if (!safe) return { error: '表达式含非法字符' };
      const result = Function(`"use strict"; return (${expression})`)();
      return { result };
    } catch (e) {
      return { error: (e as Error).message };
    }
  },

  get_time: async () => {
    return { now: new Date().toLocaleString('zh-CN') };
  },
};
// 工具的描述（给模型看的，符合 OpenAI tools 格式的 JSON Schema）
export const toolDefinitions = [
  {
    type: 'function' as const,
    function: {
      name: 'calculator',
      description: '执行数学计算。需要精确算数时用。',
      parameters: {
        type: 'object',
        properties: {
          expression: { type: 'string', description: 'JS 数学表达式，如 "3 ** 17"' },
        },
        required: ['expression'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_time',
      description: '获取当前时间。问现在几点、今天日期时用。',
      parameters: { type: 'object', properties: {} },
    },
  },
];