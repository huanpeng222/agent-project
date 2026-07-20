// components/ObservationCard.tsx
'use client';
import { useState } from 'react';
import { StepCard } from './StepCard';

export function ObservationCard({ output }: { output: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <StepCard icon="👁" title="观察结果">
      <button onClick={() => setOpen(!open)} className="text-blue-600 text-xs mb-1">
        {open ? '收起' : '展开'}
      </button>
      {open && (
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-60">
          {JSON.stringify(output, null, 2)}
        </pre>
      )}
    </StepCard>
  );
}
