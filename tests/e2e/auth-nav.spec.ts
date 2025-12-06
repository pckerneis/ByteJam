import { test, expect } from '@playwright/test';
import { ensureTestUser } from './utils/supabaseAdmin';
import { clearSupabaseSession, signInAndInjectSession } from './utils/auth';

const TEST_USER_EMAIL = 'e2e+nav@example.com';
const TEST_USER_PASSWORD = 'password123';

test.beforeAll(async () => {
  await ensureTestUser({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });
});

test('navigation for unauthenticated user', async ({page}) => {
  await clearSupabaseSession(page);
  await page.goto('/');

  const nav = page.getByRole('navigation');

  await expect(nav.getByRole('link', { name: 'Create' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Explore' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Login' })).toBeVisible();

  await expect(nav.getByRole('link', { name: 'Profile' })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: /Notifications/ })).toHaveCount(0);
});

test('navigation for authenticated user', async ({ page }) => {
  await signInAndInjectSession(page, {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  await page.goto('/');

  const nav = page.getByRole('navigation');

  await expect(nav.getByRole('link', { name: 'Create' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Explore' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Profile' })).toBeVisible();
  await expect(nav.getByRole('link', { name: /Notifications/ })).toBeVisible();

  await expect(nav.getByRole('link', { name: 'Login' })).toHaveCount(0);
});
