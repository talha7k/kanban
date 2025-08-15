import { getFirestore, doc, addDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import type { Team, UserId, UserProfile } from './types';

const db = getFirestore();

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

export const getTeamMembers = async (teamId: string): Promise<UserProfile[]> => {
  try {
    const team = await getTeam(teamId);
    if (!team) {
      return [];
    }
    const memberIds = team.memberIds || [];
    if (memberIds.length === 0) {
      return [];
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', 'in', memberIds));
    const querySnapshot = await getDocs(q);
    const members: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() } as UserProfile);
    });
    return members;
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw new Error('Failed to fetch team members.');
  }
};