import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';


 import type { UserProfile, UserDocument } from './types';

const db = getFirestore();

// User Profile Functions
export const createUserProfileDocument = async (userAuth: FirebaseUser, additionalData?: Partial<Pick<UserProfile, 'name' | 'title'>>) => {
  if (!userAuth) return;
  const userRef = doc(db, `users/${userAuth.uid}`);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { email, displayName, photoURL } = userAuth;
    const createdAt = new Date().toISOString();
    try {
      const newUserProfile: UserProfile = {
        id: userAuth.uid,
        name: additionalData?.name || displayName || email?.split('@')[0] || 'New User',
        email: email || '',
        avatarUrl: photoURL || `https://placehold.co/40x40.png?text=${(additionalData?.name || displayName || email || 'U').substring(0,1).toUpperCase()}`,
        role: 'staff', // Default global role
        title: additionalData?.title || 'Team Member', // Default title
        createdAt,
      };
      const { ...profileToSave } = newUserProfile;
      await setDoc(userRef, profileToSave);
      return newUserProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }
  const existingData = snapshot.data() as UserDocument;
  return {
    id: snapshot.id,
    ...existingData,
    role: existingData.role || 'staff',
    title: existingData.title || 'Team Member',
   } as UserProfile;
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) return null;
  const userRef = doc(db, `users/${userId}`);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    const data = snapshot.data() as UserDocument;
    return {
      id: snapshot.id,
      ...data,
      role: data.role || 'staff',
      title: data.title || 'Team Member',
    } as UserProfile;
  }
  return null;
};

export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
  try {
    const usersCollectionRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollectionRef);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as UserDocument;
      return {
        id: doc.id,
        ...data,
        role: data.role || 'staff',
        title: data.title || 'Team Member',
      } as UserProfile;
    });
  } catch (error) {
    console.error('Error fetching all user profiles:', error);
    throw error;
  }
};

export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  try {
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data() as UserDocument;
      return {
        id: doc.id,
        ...data,
        role: data.role || 'staff',
        title: data.title || 'Team Member',
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile by email:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, data: { name?: string, title?: string, avatarUrl?: string }): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    throw new Error("User must be authenticated and can only update their own profile.");
  }
  const userRef = doc(db, `users/${userId}`);
  try {
    const updateData: Partial<UserProfile> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

    if (Object.keys(updateData).length === 0) {
        return; // No changes to update
    }
    updateData.updatedAt = new Date().toISOString(); // Keep track of updates

    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}