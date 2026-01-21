import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_PROFILE_KEY = 'pending_profile_data';

export interface PendingProfileData {
  username: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  email: string;
}

export async function storePendingProfile(data: PendingProfileData): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[PendingProfile] Error storing pending profile:', error);
  }
}

export async function getPendingProfile(): Promise<PendingProfileData | null> {
  try {
    const data = await AsyncStorage.getItem(PENDING_PROFILE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('[PendingProfile] Error getting pending profile:', error);
    return null;
  }
}

export async function clearPendingProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_PROFILE_KEY);
  } catch (error) {
    console.error('[PendingProfile] Error clearing pending profile:', error);
  }
}
