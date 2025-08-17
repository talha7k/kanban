
"use client";

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { createUserProfileDocument, getUserProfile } from '@/lib/firebaseUser';
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null; // App-specific user profile from Firestore
  loading: boolean;
  signup: (email: string, password: string, displayName?: string) => Promise<FirebaseUser | null>;
  login: (email: string, password: string) => Promise<FirebaseUser | null>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>; // New function to refresh user profile
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const fetchUserProfile = useCallback(async (user: FirebaseUser | null) => {
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null); 
        toast({ variant: "destructive", title: "Profile Error", description: "Could not load your user profile." });
      }
    } else {
      setUserProfile(null);
    }
  }, [toast]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setCurrentUser(user);
      await fetchUserProfile(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserProfile]);

  const refreshUserProfile = useCallback(async () => {
    if (currentUser) {
        setLoading(true);
        await fetchUserProfile(currentUser);
        setLoading(false);
    }
  }, [currentUser, fetchUserProfile]);

  const signup = async (email: string, password: string, displayName?: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const profileData = displayName ? { name: displayName } : {};
      // createUserProfileDocument will be called, and then onAuthStateChanged will fetch it
      await createUserProfileDocument(firebaseUser, profileData);
      // No need to call fetchUserProfile here, onAuthStateChanged will trigger
      return firebaseUser;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error signing up:", authError);
      toast({ variant: "destructive", title: "Signup Failed", description: authError.message || "Could not create account." });
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged listener will handle setting currentUser and userProfile
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error logging in:", authError);
      toast({ variant: "destructive", title: "Login Failed", description: authError.message || "Invalid credentials." });
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged listener will set currentUser and userProfile to null
      startTransition(() => {
        router.push('/login'); // Explicitly redirect
      });
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error logging out:", authError);
      toast({ variant: "destructive", title: "Logout Failed", description: authError.message || "Could not log out." });
      throw authError;
    } finally {
      // Ensure user states are cleared immediately on logout, onAuthStateChanged will also run
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    refreshUserProfile,
  };

  // Render children only when initial auth check is complete
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
