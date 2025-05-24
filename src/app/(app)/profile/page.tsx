
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/firebaseService';
import { Loader2, UserCog } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less."),
  title: z.string().max(50, "Title must be 50 characters or less.").optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      title: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        name: userProfile.name || '',
        title: userProfile.title || '',
      });
    }
  }, [userProfile, form]);

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to update your profile." });
      return;
    }
    setIsSubmitting(true);
    try {
      await updateUserProfile(currentUser.uid, {
        name: data.name,
        title: data.title || '', // Send empty string if undefined
      });
      toast({ title: "Profile Updated!", description: "Your profile has been successfully updated." });
      // Auth context will eventually pick up the changes if it re-fetches userProfile or listens to Firestore.
      // For immediate UI update of userProfile in context, a more complex state management or refetch is needed.
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not update profile.";
      toast({ variant: "destructive", title: "Update Failed", description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
        <div className="container mx-auto py-8 max-w-2xl">
            <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div><Skeleton className="h-5 w-20 mb-1.5" /><Skeleton className="h-10 w-full" /></div>
                    <div><Skeleton className="h-5 w-20 mb-1.5" /><Skeleton className="h-10 w-full" /></div>
                    <div><Skeleton className="h-5 w-20 mb-1.5" /><Skeleton className="h-10 w-full" /></div>
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-32" />
                </CardFooter>
            </Card>
        </div>
    );
  }

  if (!currentUser) {
    // This case should ideally be handled by the ProtectedLayout, redirecting to login.
    return <p className="text-center text-muted-foreground">Please log in to view your profile.</p>;
  }


  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center mb-2">
            <UserCog className="h-7 w-7 mr-3 text-primary" />
            <CardTitle className="text-2xl">Your Profile</CardTitle>
          </div>
          <CardDescription>View and update your personal information.</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={currentUser.email || ''} disabled className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                {...form.register("name")} 
                placeholder="Your full name" 
                disabled={isSubmitting}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                {...form.register("title")} 
                placeholder="e.g., Software Engineer, Product Manager" 
                disabled={isSubmitting}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>
             {userProfile && (
                <div className="space-y-1.5">
                    <Label htmlFor="role">Global Role</Label>
                    <Input id="role" type="text" value={userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)} disabled className="bg-muted/50" />
                     <p className="text-xs text-muted-foreground">Global roles are managed by administrators.</p>
                </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || authLoading}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
