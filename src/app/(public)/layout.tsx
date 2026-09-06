import { PublicFooter, PublicNav } from "@/components/public-nav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <div className="flex-1">{children}</div>
      <PublicFooter />
    </div>
  );
}
