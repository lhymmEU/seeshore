import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-zinc-400" />
      </div>
      <p className="text-zinc-600 font-medium">{title}</p>
      {message && (
        <p className="text-zinc-400 text-sm mt-1">{message}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
