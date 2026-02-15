import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import {
  readAsStringAsync,
  EncodingType,
  cacheDirectory,
  downloadAsync,
} from 'expo-file-system/legacy';

const BUCKET = 'avatars';

/**
 * Upload a local image to Supabase Storage.
 * Returns the public URL on success.
 */
export async function uploadProfileImage(
  userId: string,
  localUri: string,
): Promise<string> {
  const path = `${userId}/profile.jpg`;

  // Read file as base64
  const base64 = await readAsStringAsync(localUri, {
    encoding: EncodingType.Base64,
  });

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, decode(base64), {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;

  return getProfileImageUrl(userId);
}

/**
 * Get the public URL for a user's avatar.
 */
export function getProfileImageUrl(userId: string): string {
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(`${userId}/profile.jpg`);
  // Append cache-buster to force refresh after upload
  return `${data.publicUrl}?t=${Date.now()}`;
}

/**
 * Download profile image to local cache and return the local URI.
 */
export async function downloadProfileImage(userId: string): Promise<string | null> {
  try {
    const remoteUrl = getProfileImageUrl(userId);
    const localPath = `${cacheDirectory}onset-avatar-${userId}.jpg`;

    const result = await downloadAsync(remoteUrl, localPath);
    if (result.status === 200) {
      return result.uri;
    }
    return null;
  } catch {
    return null;
  }
}
