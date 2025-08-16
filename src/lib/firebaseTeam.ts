import { db } from './firebase';
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where, arrayUnion, arrayRemove, deleteDoc, documentId } from 'firebase/firestore';
import { auth } from './firebase';
import type { Team, UserId, UserProfile } from './types';

export async function createTeam(teamName: string, creatorId: UserId, teamDescription: string): Promise<Team> {
  try {
    const newTeamData = {
      name: teamName,
      description: teamDescription, // Assuming description is optional and can be empty initially
      ownerId: creatorId,
      memberIds: [creatorId],
      createdBy: creatorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'teams'), newTeamData);
    return { id: docRef.id, ...newTeamData } as Team;
  } catch (error) {
    console.error('Error creating team:', error);
    throw new Error('Failed to create team.');
  }
}

export async function getTeamsForUser(userId: UserId): Promise<Team[]> {
  try {
    const teamsCollectionRef = collection(db, 'teams');
    const q = query(teamsCollectionRef, where('memberIds', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    const teams: Team[] = [];
    querySnapshot.forEach((doc) => {
      teams.push({ id: doc.id, ...doc.data() } as Team);
    });
    return teams;
  } catch (error) {
    console.error('Error fetching teams for user:', error);
    throw new Error('Failed to fetch teams.');
  }
}

export const getTeam = async (teamId: string): Promise<Team | null> => {
  const teamRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);

  if (teamSnap.exists()) {
    const teamData = { id: teamSnap.id, ...teamSnap.data() } as Team;
    if (teamData.memberIds && teamData.memberIds.length > 0) {
      const members = await getTeamMembers(teamId);
      teamData.members = members;
    }
    return teamData;
  } else {
    return null;
  }
};

export const updateTeam = async (teamId: string, data: Partial<Team>) => {
  const teamRef = doc(db, 'teams', teamId);
  await updateDoc(teamRef, data);
};

export const addMemberToTeam = async (teamId: string, userId: UserId) => {
  try {
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, {
      memberIds: arrayUnion(userId)
    });
  } catch (error) {
    console.error('Error adding member to team:', error);
    throw new Error('Failed to add member to team.');
  }
}

export const removeMemberFromTeam = async (teamId: string, userId: UserId) => {
  try {
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, {
      memberIds: arrayRemove(userId)
    });
  } catch (error) {
    console.error('Error removing member from team:', error);
    throw new Error('Failed to remove member from team.');
  }
}

export const deleteTeam = async (teamId: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated to delete teams.');
  }

  const teamRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);

  if (!teamSnap.exists()) {
    throw new Error('Team not found.');
  }

  const teamData = teamSnap.data() as Team;
  if (teamData.ownerId !== currentUser.uid) {
    throw new Error('Only the team owner can delete the team.');
  }

  try {
    await deleteDoc(teamRef);
  } catch (error) {
    console.error(`Error deleting team ${teamId}:`, error);
    throw error;
  }
};

export const getTeamMembers = async (teamId: string): Promise<UserProfile[]> => {
  try {
    // Get team data directly without calling getTeam to avoid circular dependency
    const teamRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamRef);
    
    if (!teamSnap.exists()) {
      return [];
    }
    
    const teamData = teamSnap.data();
    const memberIds = teamData?.memberIds || [];
    if (memberIds.length === 0) {
      return [];
    }

    // Batch fetch all users in a single query using 'in' operator
    // Firebase 'in' operator supports up to 10 values, so we need to batch if more than 10 members
    const members: UserProfile[] = [];
    const batchSize = 10;
    
    for (let i = 0; i < memberIds.length; i += batchSize) {
      const batch = memberIds.slice(i, i + batchSize);
      const usersQuery = query(
        collection(db, 'users'),
        where(documentId(), 'in', batch)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        members.push({ id: doc.id, ...userData } as UserProfile);
      });
    }
    
    return members;
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw new Error('Failed to fetch team members.');
  }
};