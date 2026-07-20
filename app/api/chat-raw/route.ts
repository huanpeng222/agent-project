import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { defaultModel } from '@/lib/llm-provider';


//允许流式相应最长30s
export const maxDuration = 30;

// export async function POST(req: Request) {
//   const { messages }: { messages: UIMessage[] } = await req.json();
//   const result = streamText({
//     model: defaultModel,
//     messages: await convertToModelMessages(messages),
//   });
//   // v6：转成 UI Message Stream 响应（不是老版的 toDataStreamResponse）
//   return result.toUIMessageStreamResponse();
// }

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();
  const result = streamText({
    model: defaultModel,
    prompt
  })

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const textChunk of result.textStream) {
        // SSE 格式：每条消息以 "data: " 开头（注意冒号后有空格，是 SSE 标准），以两个换行结尾
        const sseMessage = `data: ${JSON.stringify({ text: textChunk })}\n\n`;
        controller.enqueue(encoder.encode(sseMessage));
      }

      // 发送结束信号
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    }
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',   // ← 顺手修正拼写：原代码写成了 Catche-Control
      Connection: 'keep-alive',
    }
  })
}