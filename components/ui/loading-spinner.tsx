import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-5 h-5 border",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-2",
};

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "border-zinc-300 border-t-zinc-900 rounded-full animate-spin",
        sizeClasses[size],
        className
      )}
    />
  );
}

interface PageLoaderProps {
  className?: string;
}

export function PageLoader({ className }: PageLoaderProps) {
  return (
    <div className={cn("min-h-screen flex items-center justify-center bg-white", className)}>
      <LoadingSpinner size="md" />
    </div>
  );
}
