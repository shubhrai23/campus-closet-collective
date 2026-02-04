import { ReactNode } from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-gradient-hero" />
              <span className="font-semibold">Campus Closet</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Campus Closet. Made for DTU students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
