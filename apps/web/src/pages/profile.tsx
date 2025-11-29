import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { supabase } from '../lib/supabaseClient';

export default function ProfilePage() {
  const { user } = useSupabaseAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !supabase) {
      setUsername(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

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

      setLoading(false);
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <section>
      <h2>Profile</h2>
      {!user && <p>You are not logged in. Use the login page to sign in.</p>}
      {user && loading && <p>Loading profile…</p>}
      {user && !loading && username && (
        <p><strong>@{username}</strong></p>
      )}
      {user && !loading && !username && (
        <>
            <p>You are logged in but do not have a username yet.</p>
            <p><a href="/onboarding">Pick a username.</a></p>
        </>
      )}
    </section>
  );
}
