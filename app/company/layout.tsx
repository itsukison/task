import { Navbar } from "@/components/landing/Navbar";
import { BlogFooter } from "@/components/blog/BlogFooter";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-accent selection:text-white">
      <Navbar />
      <main className="flex-1 w-full mt-24">{children}</main>
      <BlogFooter />
    </div>
  );
}
