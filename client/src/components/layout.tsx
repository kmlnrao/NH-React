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
            <p>&copy; {new Date().getFullYear()} - Suvarna Technosoft Pvt Ltd all rights reserved.</p>
            <p>&#8902; All Images and Logos are Copyright of Respective Owners.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
