import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KanbanIcon } from "@/components/icons/KanbanIcon"; // Assuming you have this
import {
  UsersIcon,
  LockIcon,
  MessageSquareIcon,
  EditIcon,
  MoveIcon,
  RocketIcon,
  SparklesIcon,
} from "lucide-react";

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
              Why You'll Love <span className="text-primary">DijiKanban</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We've built the features your web development team actually needs
              for seamless project management.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Team Creation & Management */}
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <UsersIcon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3">
                Effortless Team Management
              </h3>
              <p className="text-muted-foreground">
                Create and manage multiple teams with ease. Each team can have
                multiple members that will get exclusive access to the projects
                created for that team.
              </p>
            </div>

            {/* Feature 2: Team Invitations */}
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <RocketIcon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3">
                Seamless Onboarding
              </h3>
              <p className="text-muted-foreground">
                Invite new members to your teams by having them registered on
                DijiKanban. Expand your collaborative workspace and bring all
                your team members together under one roof.
              </p>
            </div>

            {/* Feature 3: Project Creation within Teams */}
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <EditIcon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3">
                Organize with Projects
              </h3>
              <p className="text-muted-foreground">
                Everyone in the team cannot have access to all the projects.
                Create dedicated projects to segment your team. Each project
                acts as a focused workspace for specific members assigned to it.
              </p>
            </div>

            {/* Feature 4: Task Management within Projects */}
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <MoveIcon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3">
                Detailed Task Tracking
              </h3>
              <p className="text-muted-foreground">
                Break down projects into manageable tasks. Assign tasks to team
                members, set deadlines, and track progress from creation to
                completion, ensuring nothing falls through the cracks.
              </p>
            </div>

            {/* Feature 5: In-Task Collaboration */}
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <MessageSquareIcon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3">
                Contextual Discussions
              </h3>
              <p className="text-muted-foreground">
                Keep conversations where they belong. Add comments directly to
                tasks, share updates, ask questions, and ensure everyone stays
                on the same page without switching apps.
              </p>
            </div>

            {/* Feature 6: Clear Oversight & Progress */}
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <LockIcon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3">
                Secure & Focused Work
              </h3>
              <p className="text-muted-foreground">
                Your teams and projects are secure. Only invited members can
                access their respective workspaces, keeping sensitive
                information confidential and workflows streamlined.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-accent/5 via-background to-primary/5 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Unleash the Power of <span className="text-primary">AI</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            Leverage intelligent automation to streamline your workflow and boost productivity.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <SparklesIcon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3">AI-Powered Task Generation</h3>
              <p className="text-muted-foreground">
                Automatically generate detailed tasks and sub-tasks from a brief description, saving you time and ensuring comprehensive planning.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <SparklesIcon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Smart Task Details</h3>
              <p className="text-muted-foreground">
                 Get intelligent suggestions for task descriptions text and task titles.
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
            <span className="text-primary">4 Simple Steps</span>
          </h2>
          <div className="grid md:grid-cols-4 gap-8 mt-12 max-w-4xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Your Team</h3>
              <p className="text-muted-foreground">
                Think about how to create a team that fits your needs. You can
                have many!
              </p>
            </div>{" "}
            <div className="flex flex-col items-center">
              <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Create Your Project
              </h3>
              <p className="text-muted-foreground">
                Define your goals and set up your first board. Don't forget to
                assign members to the project.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Invite Your Team
              </h3>
              <p className="text-muted-foreground">
                Ask members to register and share their email to be added to
                team.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4">
                4
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Start Collaborating 
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
