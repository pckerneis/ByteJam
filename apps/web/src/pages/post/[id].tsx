import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { PostList, type PostRow } from '../../components/PostList';

export default function PostDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (!supabase) return;
    if (!id || typeof id !== 'string') return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      setPosts([]);

      const { data, error } = await supabase
        .from('posts')
        .select('id,title,expression,is_draft,sample_rate,mode,created_at,profile_id,profiles(username)')
        .eq('id', id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        // eslint-disable-next-line no-console
        console.warn('Error loading post', error.message);
        setError('Unable to load post.');
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Post not found.');
        setLoading(false);
        return;
      }

      setPosts([data as unknown as PostRow]);
      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [id, user]);

  return (
    <section>
      <button
        type="button"
        className="button ghost"
        onClick={() => router.back()}
      >
        ← Back
      </button>
      <h2>Post detail</h2>

      {loading && <p>Loading…</p>}
      {!loading && error && <p className="error-message">{error}</p>}

      {!loading && !error && posts.length > 0 && (
        <PostList
          posts={posts}
          currentUserId={user ? (user as any).id : undefined}
        />
      )}
    </section>
  );
}
