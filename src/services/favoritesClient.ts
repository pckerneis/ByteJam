import { supabase } from '../lib/supabaseClient';

export async function favoritePost(userId: string, postId: string) {
  return supabase.from('favorites').insert({ profile_id: userId, post_id: postId });
}

export async function unfavoritePost(userId: string, postId: string) {
  return supabase.from('favorites').delete().eq('profile_id', userId).eq('post_id', postId);
}
