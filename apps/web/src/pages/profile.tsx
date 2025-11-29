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
        .select('id,title,expression,is_draft,sample_rate,mode,created_at,profiles(username)')
        .eq('profile_id', (user as any).id)
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (error) {
        // eslint-disable-next-line no-console
        console.warn('Error loading user posts', error.message);
        setPosts([]);
      } else {
        setPosts(data ?? []);
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
      <h2>Profile</h2>
      {!user && <p>You are not logged in. Use the login page to sign in.</p>}
      {user && loadingProfile && <p>Loading profile…</p>}
      {user && !loadingProfile && username && (
        <p>
          Your username is <strong>{username}</strong>.
        </p>
      )}
      {user && !loadingProfile && !username && (
        <p>You are logged in but do not have a username yet.</p>
      )}
      {user && !loadingProfile && !username && (
        <>
          <p><a href="/onboarding">Pick a username.</a></p>
        </>
      )}

      {user && (
        <>
          <h3>Your posts</h3>
          {loadingPosts && <p>Loading your posts…</p>}
          {!loadingPosts && posts.length === 0 && (
            <p>You have not created any posts yet.</p>
          )}
          {!loadingPosts && posts.length > 0 && <PostList posts={posts} />}
        </>
      )}
    </section>
  );
}
