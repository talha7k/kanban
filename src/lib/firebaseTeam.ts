import { getFirestore, collection, addDoc, getDocs, query, where, arrayUnion, doc, updateDoc, getDoc } from 'firebase/firestore';

const db = getFirestore();
import type { Team, UserId } from './types';

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
    return { id: teamSnap.id, ...teamSnap.data() } as Team;
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