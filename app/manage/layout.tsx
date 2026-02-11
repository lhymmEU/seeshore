import { BottomNav } from "@/components/navigation";

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-secondary pb-20">
      {children}
      <BottomNav />
    </div>
  );
}

