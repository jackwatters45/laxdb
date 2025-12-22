import { createFileRoute, redirect } from '@tanstack/react-router';
import { getSession, logout } from '@/query/auth';

export const Route = createFileRoute('/(auth)/logout')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }
    await logout();
    throw redirect({ to: '/' });
  },
});
