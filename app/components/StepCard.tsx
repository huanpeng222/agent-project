// components/StepCard.tsx
export function StepCard({
  icon, title, badge, children,
}: {
  icon: string;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg p-3 mb-3 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
        <span>{icon}</span>
        <span>{title}</span>
        {badge && <span className="ml-auto">{badge}</span>}
      </div>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  );
}
