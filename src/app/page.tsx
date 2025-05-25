import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KanbanIcon } from "@/components/icons/KanbanIcon"; // Assuming you have this
// You might want to import or create other icons for the features section
// import { UsersIcon, LockIcon, MessageSquareIcon, EditIcon, MoveIcon, RocketIcon } from 'lucide-react'; // Example using lucide-react

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 text-foreground">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-20 md:py-32 px-6 text-center">
        <KanbanIcon className="w-28 h-28 md:w-32 md:h-32 text-primary mb-8" />
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
          Your Team's Workflow,{" "}
          <span className="text-primary">Supercharged</span>.
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-3xl">
          Stop juggling tasks and start delivering results. Our intuitive Kanban
          platform empowers your web development team to create, manage, and
          collaborate with unparalleled clarity and control.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105 px-8 py-6 text-lg"
          >
            <Link href="/signup">Get Started - It's Free!</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-primary text-primary hover:bg-primary/10 shadow-lg transition-transform hover:scale-105 px-8 py-6 text-lg"
          >
            <Link href="/login">Already have an account? Login</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          No credit card required. Unlock your team's potential today.
        </p>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-background/30 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why You'll Love <span className="text-primary">Kan Projects</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We've built the features your web development team actually needs
              for seamless project management.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Project Creation & Role-Based Access */}
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              {/* <RocketIcon className="w-12 h-12 text-primary mb-4" />  Replace with actual icon */}
              <div className="w-12 h-12 text-primary mb-4">
                {" "}
                {/* Placeholder for Icon */} ⚙️{" "}
              </div>
              <h3 className="text-2xl font-semibold mb-3">
                Effortless Project Setup
              </h3>
              <p className="text-muted-foreground">
                Launch new web projects in minutes. Assign team members with
                specific roles like 'Manager' or 'Developer' right from the
                start, ensuring everyone has the right access.
              </p>
            </div>

            {/* Feature 2: Granular Task Control */}
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              {/* <EditIcon className="w-12 h-12 text-primary mb-4" /> */}
              <div className="w-12 h-12 text-primary mb-4">
                {" "}
                {/* Placeholder for Icon */} ✏️{" "}
              </div>
              <h3 className="text-2xl font-semibold mb-3">
                Precision Task Management
              </h3>
              <p className="text-muted-foreground">
                Managers wield full control to edit and delete tasks,
                maintaining project integrity. Developers focus on execution,
                knowing exactly what's assigned to them.
              </p>
            </div>

            {/* Feature 3: Secure & Focused Boards */}
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              {/* <LockIcon className="w-12 h-12 text-primary mb-4" /> */}
              <div className="w-12 h-12 text-primary mb-4">
                {" "}
                {/* Placeholder for Icon */} 🔒{" "}
              </div>
              <h3 className="text-2xl font-semibold mb-3">
                Secure Project Workspaces
              </h3>
              <p className="text-muted-foreground">
                Your project boards are your team's private command center. Only
                members added to a project can view its tasks and progress,
                keeping sensitive information confidential.
              </p>
            </div>

            {/* Feature 4: Intuitive Task Movement */}
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              {/* <MoveIcon className="w-12 h-12 text-primary mb-4" /> */}
              <div className="w-12 h-12 text-primary mb-4">
                {" "}
                {/* Placeholder for Icon */} ↔️{" "}
              </div>
              <h3 className="text-2xl font-semibold mb-3">
                Fluid Kanban Workflow
              </h3>
              <p className="text-muted-foreground">
                Empower assigned users to drag-and-drop tasks across
                customizable columns. Visualizing progress and adapting to
                changes has never been smoother.
              </p>
            </div>

            {/* Feature 5: In-Task Collaboration */}
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              {/* <MessageSquareIcon className="w-12 h-12 text-primary mb-4" /> */}
              <div className="w-12 h-12 text-primary mb-4">
                {" "}
                {/* Placeholder for Icon */} 💬{" "}
              </div>
              <h3 className="text-2xl font-semibold mb-3">
                Contextual Discussions
              </h3>
              <p className="text-muted-foreground">
                Keep conversations where they belong. Add comments directly to
                tasks, share updates, ask questions, and ensure everyone stays
                on the same page without switching apps.
              </p>
            </div>

            {/* Feature 6: Total Team Visibility (for managers) */}
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              {/* <UsersIcon className="w-12 h-12 text-primary mb-4" /> */}
              <div className="w-12 h-12 text-primary mb-4">
                {" "}
                {/* Placeholder for Icon */} 👁️{" "}
              </div>
              <h3 className="text-2xl font-semibold mb-3">
                Clear Oversight & Progress
              </h3>
              <p className="text-muted-foreground">
                Visualize your team's entire workflow, identify bottlenecks, and
                celebrate milestones. Understand project health at a glance and
                keep development on track.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works / Benefits Overview (Optional but recommended) */}
      <section className="py-16 md:py-24 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get Productive in{" "}
            <span className="text-primary">3 Simple Steps</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-4xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Create Your Project
              </h3>
              <p className="text-muted-foreground">
                Define your goals and set up your first board.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Invite Your Team & Assign Roles
              </h3>
              <p className="text-muted-foreground">
                Bring your colleagues onboard and set permissions.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Start Collaborating & Tracking
              </h3>
              <p className="text-muted-foreground">
                Move tasks, add comments, and watch progress unfold.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-32 px-6 bg-gradient-to-t from-primary/10 to-background/10 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Transform Your Team's Productivity?
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
          Join hundreds of web development teams streamlining their work with
          Kan Projects.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl transition-transform hover:scale-105 px-10 py-7 text-xl"
        >
          <Link href="/signup">Sign Up Now & Get Organized</Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center bg-background">
        <p className="text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} Kan Projects. All rights reserved.
        </p>
        {/* Add links to privacy policy, terms of service, etc. if you have them */}
        {/* <div className="mt-2">
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary px-2">Privacy Policy</Link>
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary px-2">Terms of Service</Link>
        </div> */}
      </footer>
    </div>
  );
}
