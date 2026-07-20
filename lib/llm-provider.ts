import { createOpenAI} from '@ai-sdk/openai'
export const qwen = createOpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.DASHSCOPE_API_KEY!,
})

// ⚠️ 必须用 .chat() 而不是默认调用！
// 默认 qwen('qwen-plus') → /v1/responses（新 API），不支持 tool 角色
// qwen.chat('qwen-plus') → /v1/chat/completions（标准 API），支持 tool 角色
export const defaultModel = qwen.chat('qwen-plus')