import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export async function pickImage(): Promise<string | null> {
  const permissionResult =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissionResult.granted) {
    alert('Permission to access photos is required!');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0].uri;
}

export async function uploadImage(
  uri: string,
  bucket: string,
  path: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${path}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (uploadError) {
      return { url: null, error: uploadError };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return { url: publicUrl, error: null };
  } catch (error) {
    return { url: null, error: error as Error };
  }
}

export async function uploadEventPhoto(
  uri: string,
  userId: string,
  eventId: string
): Promise<{ url: string | null; error: Error | null }> {
  const timestamp = Date.now();
  const path = `${userId}/${eventId}/${timestamp}`;
  return uploadImage(uri, 'event-photos', path);
}

export async function uploadAvatar(
  uri: string,
  userId: string
): Promise<{ url: string | null; error: Error | null }> {
  const path = `${userId}/avatar`;
  return uploadImage(uri, 'avatars', path);
}

export async function deleteImage(
  bucket: string,
  path: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return { error };
}
