import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { supabase } from '../lib/supabaseClient';
import { PostList, type PostRow } from '../components/PostList';

export default function ProfilePage() {
  const { user } = useSupabaseAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    if (!user || !supabase) {
      setUsername(null);
      return;
    }

    let cancelled = false;
    setLoadingProfile(true);

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', (user as any).id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        // eslint-disable-next-line no-console
        console.warn('Error loading profile', error.message);
        setUsername(null);
      } else {
        setUsername(data?.username ?? null);
      }

      setLoadingProfile(false);
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !supabase) {
      setPosts([]);
      return;
    }

    let cancelled = false;
    setLoadingPosts(true);

    const loadPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id,title,expression,is_draft,sample_rate,mode,created_at,profile_id,profiles(username),favorites(count)')
        .eq('profile_id', (user as any).id)
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (error) {
        // eslint-disable-next-line no-console
        console.warn('Error loading user posts', error.message);
        setPosts([]);
      } else {
        let rows = (data ?? []).map((row: any) => ({
          ...row,
          favorites_count: row.favorites?.[0]?.count ?? 0,
        }));

        if (user && rows.length > 0) {
          const postIds = rows.map((r: any) => r.id);
          const { data: favs, error: favError } = await supabase
            .from('favorites')
            .select('post_id')
            .eq('profile_id', (user as any).id)
            .in('post_id', postIds);

          if (!favError && favs) {
            const favoritedSet = new Set((favs as any[]).map((f) => f.post_id as string));
            rows = rows.map((r: any) => ({
              ...r,
              favorited_by_current_user: favoritedSet.has(r.id),
            }));
          }
        }

        setPosts(rows);
      }

      setLoadingPosts(false);
    };

    void loadPosts();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <section>
      {!user && <p>You are not logged in. Use the login page to sign in.</p>}
      {user && loadingProfile && <p>Loading profile…</p>}
      {user && !loadingProfile && username && (
        <h2><strong>@{username}</strong></h2>
      )}

      {user && (
        <>
          <h3>Your posts</h3>
          {loadingPosts && <p>Loading your posts…</p>}
          {!loadingPosts && posts.length === 0 && (
            <p>You have not created any posts yet.</p>
          )}
          {!loadingPosts && posts.length > 0 && (
            <PostList posts={posts} currentUserId={(user as any).id} />
          )}
        </>
      )}
    </section>
  );
}
