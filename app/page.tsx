// app/page.tsx
'use client';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { StepCard } from './components/StepCard';
import Markdown from 'react-markdown';
import { ActionCard } from './components/ActionCard';
import { ObservationCard } from './components/ObservationCard';


export default function Home() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error, regenerate } = useChat();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🤖 Agent Workbench</h1>

      <div className="mb-6">
        {messages.map((m) => (
          <div key={m.id} className="mb-4">
            {m.role === 'user' && (
              <div className="bg-blue-50 p-3 rounded-lg mb-3">
                <strong>🎯 目标：</strong>{m.parts.map((p, i) => p.type === 'text' ? p.text : '').join('')}
              </div>
            )}
            {m.role === 'assistant' && m.parts.map((part, i) => {
              // 文本：区分是思考还是最终回答（简化：都用 Markdown 渲染）
              if (part.type === 'text') {
                return (
                  <StepCard key={i} icon="✨" title="回答">
                    <Markdown>{part.text}</Markdown>
                  </StepCard>
                );
              }
              // 工具调用
              if (part.type.startsWith('tool-')) {
                const toolName = part.type.replace('tool-', '');
                const p = part as any;
                return (
                  <div key={i}>
                    <ActionCard toolName={toolName} input={p.input} state={p.state} />
                    {p.state === 'output-available' && <ObservationCard output={p.output} />}
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))}
      </div>

      {/* 运行中提示 */}
      {status === 'streaming' && <div className="text-gray-500 animate-pulse mb-4">Agent 思考中...</div>}
      // 在消息列表下方加：
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="text-red-700 font-medium">⚠️ 出错了</div>
          <div className="text-red-600 text-sm mt-1">
            {error?.message || 'Agent 执行失败，请重试'}
          </div>
          <button
            onClick={() => regenerate()}
            className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm"
          >
            重试
          </button>
        </div>
      )}
      {/* // 简化提示：运行结束但最后没有文本回答 */}
      {status === 'ready' && messages.length > 0 && (() => {
        const last = messages[messages.length - 1];
        const hasAnswer = last.role === 'assistant' && last.parts.some(p => p.type === 'text' && p.text.trim());
        if (last.role === 'assistant' && !hasAnswer) {
          return <div className="text-amber-600 text-sm">⚠️ 任务较复杂，可能未完整完成，可补充信息重试</div>;
        }
        return null;
      })()}
      <form
        onSubmit={(e) => { e.preventDefault(); if (!input.trim()) return; sendMessage({ text: input }); setInput(''); }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入一个目标，比如：查 React 19 更新并整理成要点"
          disabled={status !== 'ready'}
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button type="submit" disabled={status !== 'ready'} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
          开始
        </button>
      </form>
    </div>
  );
}
