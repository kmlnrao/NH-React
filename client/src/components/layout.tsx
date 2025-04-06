import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      <Sidebar 
        isMobileOpen={isMobileMenuOpen} 
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMobileMenuClick={() => setIsMobileMenuOpen(true)}
          title={title}
        />
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
        <footer className="border-t py-3 px-4 text-center text-xs text-gray-500 bg-white">
          <div className="container mx-auto">
            <p>&copy; {new Date().getFullYear()} Suvarna. All rights reserved.</p>
            <p>A product of <a href="https://suvarna.co.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Suvarna Group</a></p>
          </div>
        </footer>
      </div>
    </div>
  );
}
