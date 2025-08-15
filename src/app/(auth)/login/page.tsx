
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { KanbanIcon } from '@/components/icons/KanbanIcon';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, loading: authLoading, currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (currentUser) {
      router.push('/teams'); // Redirect if already logged in
    }
  }, [currentUser, router]);

  if (currentUser && !authLoading) {
    // Return null or a loading indicator while redirecting to prevent rendering the login form briefly
    return null; 
  }

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setFormError(null);
    try {
      await login(data.email, data.password);
      toast({ title: "Login Successful!", description: "Redirecting to teams..." });
      // router.push('/teams'); // Handled by useEffect now
    } catch (error: any) {
      const errorMessage = error.message || "Failed to login. Please check your credentials.";
      setFormError(errorMessage);
      toast({ variant: "destructive", title: "Login Failed", description: errorMessage });
      console.error("Login error:", error);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="items-center text-center">
        <KanbanIcon className="w-12 h-12 text-primary mb-2" />
        <CardTitle className="text-2xl">Welcome Back!</CardTitle>
        <CardDescription>Login to access your KanbanAI dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && <p className="text-sm text-destructive text-center">{formError}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} placeholder="you@example.com" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} placeholder="••••••••" />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting || authLoading}>
            {isSubmitting || authLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 text-sm">
        <p>
          Don't have an account?{' '}
          <Button variant="link" asChild className="p-0 h-auto">
            <Link href="/signup">Sign up</Link>
          </Button>
        </p>
        <Button variant="link" asChild className="p-0 h-auto text-xs">
            <Link href="/">Back to Home</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
