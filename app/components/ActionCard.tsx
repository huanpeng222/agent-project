import { StepCard } from "./StepCard";

// components/ActionCard.tsx（改进）
export function ActionCard({ toolName, input, state, output }: {
  toolName: string; input: unknown; state: string; output?: any;
}) {
  const isError = state === 'output-error' ||
    (output && output.success === false);

  const badge = isError
    ? <span className="text-red-600">✗ 失败</span>
    : state === 'output-available'
      ? <span className="text-green-600">✓ 完成</span>
      : <span className="text-blue-600 animate-pulse">⋯ 执行中</span>;

  return (
    <StepCard icon="🔧" title={`调用工具: ${toolName}`} badge={badge}>
      <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(input, null, 2)}</pre>
      {isError && (
        <div className="text-red-600 text-xs mt-2">
          {output?.error || output?.message || '工具执行失败'}
        </div>
      )}
    </StepCard>
  );
}
