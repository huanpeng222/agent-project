import { toolExecutors, toolDefinitions } from './tools';

const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

type Message = | { role: 'system' | 'user' | 'assistant'; content: string; tool_calls?: any }
  | { role: 'tool', content: string; tool_call_id: string };

export async function runReActLoop(goal: string, onStep: (step: any) => void) {
  // 初始对话历史
  const messages: Message[] = [
    { role: 'system', content: '你是一个能调用工具的助手。需要计算或查时间时调用对应工具，信息足够就直接回答。' },
    { role: 'user', content: goal },
  ];
  const MAX_STEPS = 10;  // ← 手写的"stopWhen"：步数上限，防死循环
  // ★ 核心：这个 for 循环就是 ReAct 的"多步"
  for (let step = 0; step < MAX_STEPS; step++) {
    // ① 调用 LLM，带上完整历史 + 工具定义
    // 🟢 Node: 这个 fetch 是"服务端 → 通义千问"（前面心智模型图里的第②段请求）
    //          注意：fetch 在 Node 18+ 是内置的，用法和浏览器完全一样
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 🟢 Node: process.env 只在服务端能读到，Key 就是这样安全地取出来的（浏览器读不到 process.env）
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages,
        tools: toolDefinitions,  // ← 告诉模型有哪些工具
      }),
    });

    const data = await res.json();
    const choice = data.choices[0].message;

    // ② 把模型这轮的输出加入历史
    messages.push(choice);

    // ③ 判断：模型是想调工具，还是给最终答案？
    if (choice.tool_calls && choice.tool_calls.length > 0) {
      // —— 模型想调工具 ——
      for (const toolCall of choice.tool_calls) {
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);  // 模型给的参数是字符串，要 parse

        onStep({ type: 'action', toolName: name, input: args });

        // ④ 你的代码真正执行工具
        const executor = toolExecutors[name];
        const result = executor ? await executor(args) : { error: `未知工具: ${name}` };

        onStep({ type: 'observation', toolName: name, output: result });

        // ⑤ 把工具结果作为 role:'tool' 消息拼回历史
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,  // ← 必须对应上，模型才知道这是哪次调用的结果
          content: JSON.stringify(result),
        });
      }
      // 继续 for 循环 → 带着工具结果再问模型（这就是"多步"）
    } else {
      // —— 模型给了最终答案，没有 tool_calls —— 结束循环
      onStep({ type: 'answer', text: choice.content });
      return;
    }
  }

  // 达到步数上限还没结束
  onStep({ type: 'error', text: `达到最大步数 ${MAX_STEPS}，强制停止` });
}