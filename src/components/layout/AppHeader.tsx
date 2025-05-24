
import Link from 'next/link';
import { KanbanIcon } from '@/components/icons/KanbanIcon';
import { Button } from '@/components/ui/button';
import { Github, LayoutDashboard } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <KanbanIcon className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">
            KanbanAI
          </span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </nav>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <a href="https://github.com/firebase/genkit/tree/main/firebase-studio/next-js-kanban" target="_blank" rel="noopener noreferrer">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </a>
          </Button>
          {/* User profile / Auth button can go here */}
        </div>
      </div>
    </header>
  );
}
