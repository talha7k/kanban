
"use client";

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { createUserProfileDocument, getUserProfile } from '@/lib/firebaseService';
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null; // App-specific user profile from Firestore
  loading: boolean;
  signup: (email: string, password: string, displayName?: string) => Promise<FirebaseUser | null>;
  login: (email: string, password: string) => Promise<FirebaseUser | null>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
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
  const [loading, setLoading] = useState(true); // Initialize loading to true
  const router = useRouter();
  const { toast } = useToast();

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
    // setLoading(true); // Moved inside onAuthStateChanged for more precise control
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true); // Set loading true when auth state changes and before profile fetch
      setCurrentUser(user);
      await fetchUserProfile(user);
      setLoading(false); // Set loading false after all async operations are done
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
    // setLoading(true); // Loading state will be handled by onAuthStateChanged
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const profileData = displayName ? { name: displayName } : {};
      await createUserProfileDocument(firebaseUser, profileData);
      // onAuthStateChanged will handle setting user and profile, and loading state
      return firebaseUser;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error signing up:", authError);
      toast({ variant: "destructive", title: "Signup Failed", description: authError.message || "Could not create account." });
      // setLoading(false);
      throw authError;
    }
    // setLoading(false) is not needed here as onAuthStateChanged will manage it
  };

  const login = async (email: string, password: string): Promise<FirebaseUser | null> => {
    // setLoading(true); // Loading state will be handled by onAuthStateChanged
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged listener will handle setting currentUser, userProfile and loading
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error logging in:", authError);
      toast({ variant: "destructive", title: "Login Failed", description: authError.message || "Invalid credentials." });
      // setLoading(false);
      throw authError;
    }
    // setLoading(false) is not needed here
  };

  const logout = async () => {
    // setLoading(true); // Loading state will be handled by onAuthStateChanged
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged listener will set currentUser and userProfile to null and manage loading
      router.push('/login'); 
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error logging out:", authError);
      toast({ variant: "destructive", title: "Logout Failed", description: authError.message || "Could not log out." });
      // setLoading(false);
      throw authError;
    }
    // Explicitly clear states here for immediate UI feedback before onAuthStateChanged might fire.
    // Though onAuthStateChanged should handle this robustly.
    // setCurrentUser(null); 
    // setUserProfile(null);
    // setLoading(false); // onAuthStateChanged handles this.
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
