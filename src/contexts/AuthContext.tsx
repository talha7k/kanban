
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
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast(); // Keep useToast for other parts, but we'll avoid using it in fetchUserProfile for now

  console.log('[AuthContext] Component Render. Loading:', loading, 'CurrentUser:', currentUser?.uid, 'UserProfile:', userProfile?.name);

  const fetchUserProfile = useCallback(async (user: FirebaseUser | null) => {
    console.log('[AuthContext] fetchUserProfile called for user:', user?.uid);
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        console.log('[AuthContext] Fetched profile from Firestore:', profile ? {name: profile.name, id: profile.id} : null);
        setUserProfile(profile);
      } catch (error) {
        console.error("[AuthContext] Error fetching user profile:", error);
        setUserProfile(null);
        // TEMPORARILY REMOVED TOAST FOR DEBUGGING
        // toast({ variant: "destructive", title: "Profile Error", description: "Could not load your user profile." });
      }
    } else {
      console.log('[AuthContext] fetchUserProfile: No user, setting profile to null');
      setUserProfile(null);
    }
  }, []); // Removed `toast` from dependencies for debugging

  useEffect(() => {
    console.log('[AuthContext] useEffect for onAuthStateChanged subscribing...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[AuthContext] onAuthStateChanged event. User from Firebase:', user?.uid);
      console.log('[AuthContext] onAuthStateChanged: Setting loading to TRUE.');
      setLoading(true);
      setCurrentUser(user);
      await fetchUserProfile(user);
      // Log state *after* updates from fetchUserProfile have settled, though direct values might be from closure
      console.log('[AuthContext] onAuthStateChanged: After fetchUserProfile. Attempting to set loading to FALSE.');
      setLoading(false);
    });

    return () => {
      console.log('[AuthContext] useEffect for onAuthStateChanged cleaning up (unsubscribing).');
      unsubscribe();
    };
  }, [fetchUserProfile]);

  const refreshUserProfile = useCallback(async () => {
    console.log('[AuthContext] refreshUserProfile called. Current user in state:', currentUser?.uid);
    if (currentUser) {
        console.log('[AuthContext] refreshUserProfile: Setting loading to TRUE.');
        setLoading(true);
        await fetchUserProfile(currentUser);
        console.log('[AuthContext] refreshUserProfile: After fetchUserProfile. Setting loading to FALSE.');
        setLoading(false);
    } else {
      console.log('[AuthContext] refreshUserProfile: No current user, cannot refresh.');
    }
  }, [currentUser, fetchUserProfile]);

  const signup = async (email: string, password: string, displayName?: string): Promise<FirebaseUser | null> => {
    console.log('[AuthContext] signup attempt for:', email);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('[AuthContext] signup successful for Firebase user:', firebaseUser.uid);
      const profileData = displayName ? { name: displayName } : {};
      await createUserProfileDocument(firebaseUser, profileData);
      console.log('[AuthContext] signup: Firestore profile document should be created/ensured.');
      // onAuthStateChanged will handle setting currentUser, userProfile and loading state
      return firebaseUser;
    } catch (error) {
      const authError = error as AuthError;
      console.error("[AuthContext] Error signing up:", authError);
      toast({ variant: "destructive", title: "Signup Failed", description: authError.message || "Could not create account." });
      throw authError;
    }
  };

  const login = async (email: string, password: string): Promise<FirebaseUser | null> => {
    console.log('[AuthContext] login attempt for:', email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('[AuthContext] login successful for Firebase user:', userCredential.user.uid);
      // onAuthStateChanged listener will handle setting currentUser, userProfile and loading
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("[AuthContext] Error logging in:", authError);
      toast({ variant: "destructive", title: "Login Failed", description: authError.message || "Invalid credentials." });
      throw authError;
    }
  };

  const logout = async () => {
    console.log('[AuthContext] logout attempt.');
    try {
      await firebaseSignOut(auth);
      console.log('[AuthContext] logout successful from Firebase.');
      // onAuthStateChanged listener will set currentUser and userProfile to null and manage loading
      router.push('/login');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
      const authError = error as AuthError;
      console.error("[AuthContext] Error logging out:", authError);
      toast({ variant: "destructive", title: "Logout Failed", description: authError.message || "Could not log out." });
      throw authError;
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
