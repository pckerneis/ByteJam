import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

type NotificationRow = {
  id: number;
  event_type: string;
  created_at: string;
  read: boolean;
  post_id: string | null;
  actor_id: string;
  actor_username?: string | null;
  post_title?: string | null;
};

const PAGE_SIZE = 20;

function formatNotificationAction(n: NotificationRow): string {
  if (n.event_type === 'follow') {
    return 'followed you';
  }

  if (n.event_type === 'favorite') {
    return 'favorited one of your posts';
  }

  if (n.event_type === 'fork') {
    return 'forked one of your posts';
  }

  if (n.event_type === 'comment') {
    return 'commented on one of your posts';
  }

  if (n.event_type === 'mention') {
    return 'mentioned you';
  }

  return n.event_type;
}

function formatRelativeTime(isoString: string): string {
  const created = new Date(isoString).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - created);

  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

async function attachActorUsernames(rows: NotificationRow[]): Promise<NotificationRow[]> {
  const actorIds = Array.from(new Set(rows.map((r) => r.actor_id))).filter(Boolean);
  if (actorIds.length === 0) return rows;

  const { data, error } = await supabase
    .from('profiles')
    .select('id,username')
    .in('id', actorIds);

  if (error || !data) return rows;

  const usernameById = new Map<string, string | null>();
  for (const row of data as any[]) {
    usernameById.set(row.id as string, (row.username as string | null) ?? null);
  }

  return rows.map((r) => ({
    ...r,
    actor_username: usernameById.get(r.actor_id) ?? null,
  }));
}

async function attachPostTitles(rows: NotificationRow[]): Promise<NotificationRow[]> {
  const postIds = Array.from(new Set(rows.map((r) => r.post_id).filter((id): id is string => !!id)));
  if (postIds.length === 0) return rows;

  const { data, error } = await supabase
    .from('posts')
    .select('id,title')
    .in('id', postIds);

  if (error || !data) return rows;

  const titleById = new Map<string, string | null>();
  for (const row of data as any[]) {
    titleById.set(row.id as string, (row.title as string | null) ?? null);
  }

  return rows.map((r) => ({
    ...r,
    post_title: r.post_id ? titleById.get(r.post_id) ?? null : null,
  }));
}

export default function NotificationsPage() {
  const { user } = useSupabaseAuth();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoadingInitial(false);
      setHasMore(false);
      return;
    }

    let cancelled = false;

    const loadPage = async (pageToLoad: number, markRead: boolean) => {
      const from = pageToLoad * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('notifications')
        .select('id,event_type,created_at,read,post_id,actor_id')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (cancelled) return;

      if (error) {
        if (pageToLoad === 0) {
          setError('Unable to load notifications.');
          setNotifications([]);
          setLoadingInitial(false);
        }
        setLoadingMore(false);
        setHasMore(false);
        return;
      }

      let rows = (data ?? []) as NotificationRow[];

      rows = await attachActorUsernames(rows);
      rows = await attachPostTitles(rows);

      if (pageToLoad === 0) {
        setNotifications(rows);
        setLoadingInitial(false);
      } else {
        setNotifications((prev) => [...prev, ...rows]);
      }

      if (rows.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setPage(pageToLoad);

      if (markRead && rows.length > 0) {
        void supabase.from('notifications').update({ read: true }).eq('read', false);
      }

      setLoadingMore(false);
    };

    setLoadingInitial(true);
    setError('');
    setHasMore(true);
    setPage(0);
    void loadPage(0, true);

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!hasMore || loadingMore || loadingInitial) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) return;

      setLoadingMore(true);

      const nextPage = page + 1;

      const loadNext = async () => {
        const from = nextPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabase
          .from('notifications')
          .select('id,event_type,created_at,read,post_id,actor_id')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) {
          setLoadingMore(false);
          setHasMore(false);
          return;
        }

        let rows = (data ?? []) as NotificationRow[];

        rows = await attachActorUsernames(rows);
        rows = await attachPostTitles(rows);

        setNotifications((prev) => [...prev, ...rows]);
        setPage(nextPage);

        if (rows.length < PAGE_SIZE) {
          setHasMore(false);
        }

        setLoadingMore(false);
      };

      void loadNext();
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loadingInitial, page]);

  return (
    <>
      <Head>
        <title>BytebeatCloud - Notifications</title>
      </Head>
      <section>
        <h2>Notifications</h2>
        {loadingInitial && <p>Loading…</p>}
        {!loadingInitial && error && <p className="error-message">{error}</p>}
        {!loadingInitial && !error && notifications.length === 0 && <p>No notifications yet.</p>}
        {!loadingInitial && !error && notifications.length > 0 && (
          <>
            <ul className="notifications-list">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={n.read ? 'notification-item' : 'notification-item is-unread'}
                >
                  <span className="notification-text">
                    {n.actor_username ? (
                      <>
                        <Link href={`/u/${n.actor_username}`} className="username">
                          @{n.actor_username}
                        </Link>{' '}
                      </>
                    ) : (
                      <>Someone </>
                    )}
                    {formatNotificationAction(n)}
                    {n.post_id && (
                      <>
                        {' '}
                        <Link href={`/post/${n.post_id}`} className="post-link">
                          {n.post_title || '(untitled)'}
                        </Link>
                      </>
                    )}
                  </span>
                  <span className="notification-date secondary-text">
                    {formatRelativeTime(n.created_at)}
                  </span>
                </li>
              ))}
            </ul>
            <div ref={sentinelRef} />
            {loadingMore && <p>Loading more…</p>}
            {!hasMore && <p>No more notifications.</p>}
          </>
        )}
      </section>
    </>
  );
}

