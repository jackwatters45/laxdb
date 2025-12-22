import { createFileRoute, redirect } from '@tanstack/react-router';
import { getSession } from '@/query/auth';

export const Route = createFileRoute('/(marketing)/')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }
    throw redirect({ to: '/redirect' });
  },
});
