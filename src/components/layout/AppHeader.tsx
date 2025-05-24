
"use client";

import Link from 'next/link';
import { KanbanIcon } from '@/components/icons/KanbanIcon';
import { Button } from '@/components/ui/button';
import { Github, LayoutDashboard, LogOut, UserCircle, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function AppHeader() {
  const { currentUser, logout, loading } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
      toast({ variant: "destructive", title: "Logout Failed", description: "Could not log out at this time." });
      console.error("Logout error:", error);
    }
  };

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
          {currentUser && (
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          )}
        </nav>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <a href="https://github.com/firebase/genkit/tree/main/firebase-studio/next-js-kanban" target="_blank" rel="noopener noreferrer">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </a>
          </Button>
          
          {loading ? (
             <Button variant="ghost" size="sm" disabled>Loading...</Button>
          ) : currentUser ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || currentUser.email || 'User'} data-ai-hint="user avatar" />
                <AvatarFallback>
                  {currentUser.email ? currentUser.email[0].toUpperCase() : <UserCircle className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground hidden sm:inline">{currentUser.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild size="sm">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
