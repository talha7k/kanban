
"use client";

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types'; // Assuming UserProfile is defined
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<FirebaseUser | null>;
  login: (email: string, password: string) => Promise<FirebaseUser | null>;
  logout: () => Promise<void>;
  // userProfile: UserProfile | null; // For later integration with app-specific user profiles
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
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  // const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // For later

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      // if (user) {
      //   // Fetch app-specific user profile from Firestore using user.uid
      //   // setUserProfile(fetchedProfile); 
      // } else {
      //   // setUserProfile(null);
      // }
    });
    return () => unsubscribe();
  }, []);

  const signup = async (email: string, password: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Optionally, create a user document in Firestore here
      setCurrentUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error signing up:", authError.message);
      // Consider using a toast notification to show error to user
      throw authError; // Re-throw to be caught by the form
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setCurrentUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error logging in:", authError.message);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      // setUserProfile(null);
      router.push('/login'); // Redirect to login after logout
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error logging out:", authError.message);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    // userProfile, // For later
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
