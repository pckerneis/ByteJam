import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PostList, type PostRow } from '../components/PostList';

export default function ExplorePage() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [activePostId] = useState<string | null>(null); // kept for potential future use

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError('Supabase client is not configured.');
      return;
    }

    let cancelled = false;
    const pageSize = 20;
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const loadPage = async () => {
      loadingMoreRef.current = true;
      if (page === 0) {
        setLoading(true);
      }
      setError('');

      const { data, error } = await supabase
        .from('posts')
        .select('id,title,expression,sample_rate,mode,created_at,profiles(username)')
        .eq('is_draft', false)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (cancelled) return;

      if (error) {
        setError(error.message);
        if (page === 0) {
          setPosts([]);
        }
        setHasMore(false);
      } else {
        const rows = data ?? [];
        setPosts((prev) => (page === 0 ? rows : [...prev, ...rows]));
        if (rows.length < pageSize) {
          setHasMore(false);
        }
      }

      loadingMoreRef.current = false;
      setLoading(false);
    };

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    if (!hasMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !loadingMoreRef.current && hasMore) {
          loadingMoreRef.current = true;
          setPage((p) => p + 1);
        }
      });
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore]);

  return (
    <section>
      <h2>Explore</h2>
      {loading && <p>Loading posts…</p>}
      {error && !loading && <p className="error-message">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p>No posts yet. Create something on the Create page!</p>
      )}
      {!loading && !error && posts.length > 0 && <PostList posts={posts} />}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {hasMore && !loading && posts.length > 0 && (
        <p className="counter">Loading more…</p>
      )}

      {!hasMore &&
        <p>You reached the end!</p>
      }
    </section>
  );
}
