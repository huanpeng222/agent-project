// app/api/agent-raw/route.ts
// 🟢 Node: 服务端路由。它调用 react-loop（服务端逻辑），把每步用 SSE 推给前端
import { runReActLoop } from '@/lib/raw-agent/react-loop';

export const maxDuration = 60;  // 🟢 Node: 多步循环更耗时，放宽到 60 秒

export async function POST(req: Request) {
  const { goal } = await req.json();  // 🟢 解析前端传来的 goal

  const encoder = new TextEncoder();  // 🟢 Web 标准：字符串→字节
  const stream = new ReadableStream({  // 🟢 Web 标准：可读流，服务端生产、前端消费
    async start(controller) {
      // 把每一步通过 SSE 推给前端（复用 D27a 手写的 SSE 思路）
      // onStep 回调每触发一次，就往流里推一条 SSE 消息
      await runReActLoop(goal, (step) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(step)}\n\n`));
      });
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });

  // 🟢 Node: 返回 Web 标准 Response，SSE 头告诉浏览器这是流式响应
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
