
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { KanbanIcon } from '@/components/icons/KanbanIcon';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 text-center">
      <KanbanIcon className="w-24 h-24 text-primary mb-6" />
      <h1 className="text-5xl font-bold mb-4 text-foreground">
        Welcome to KanbanAI
      </h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
        Streamline your team's workflow with our intelligent Kanban board. Organize tasks by project, visualize progress, and collaborate effectively.
      </p>
      <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
        <Link href="/dashboard"> 
          Go to Dashboard
        </Link>
      </Button>
      <div className="mt-16 p-6 border rounded-lg shadow-xl bg-card max-w-md">
        <h2 className="text-2xl font-semibold mb-3 text-card-foreground">AI-Powered Priority</h2>
        <p className="text-muted-foreground">
          Leverage our GenAI feature to get smart suggestions for task prioritization based on due dates and dependencies, helping your team focus on what matters most.
        </p>
      </div>
    </div>
  );
}
