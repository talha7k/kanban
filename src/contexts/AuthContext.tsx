
"use client";

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { createUserProfileDocument, getUserProfile } from '@/lib/firebaseService';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null; // App-specific user profile from Firestore
  loading: boolean;
  signup: (email: string, password: string, displayName?: string) => Promise<FirebaseUser | null>;
  login: (email: string, password: string) => Promise<FirebaseUser | null>;
  logout: () => Promise<void>;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null); // Ensure profile is null on error
          toast({ variant: "destructive", title: "Profile Error", description: "Could not load your user profile." });
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const signup = async (email: string, password: string, displayName?: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      // Create a user profile document in Firestore
      const profileData = displayName ? { name: displayName } : {};
      await createUserProfileDocument(firebaseUser, profileData);
      // The onAuthStateChanged listener will pick up the new user and set currentUser and userProfile
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
      router.push('/login');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error logging out:", authError);
      toast({ variant: "destructive", title: "Logout Failed", description: authError.message || "Could not log out." });
      throw authError;
    } finally {
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
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
