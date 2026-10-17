export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy/15 bg-white px-6 py-12 text-center">
      {icon && <div className="mb-3 text-navy/30">{icon}</div>}
      <p className="font-bold text-navy">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-navy/55">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
