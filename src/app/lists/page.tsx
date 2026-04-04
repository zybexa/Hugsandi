import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ListsPage from '@/components/ListsPage';

export const dynamic = 'force-dynamic';

export default function Page() {
  const cookieStore = cookies();
  const session = cookieStore.get('hugsandi_session');

  if (!session?.value) {
    redirect('/login');
  }

  const parts = session.value.split(':');
  if (parts.length !== 2) {
    redirect('/login');
  }

  const age = Date.now() - parseInt(parts[0], 10);
  const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
  if (age > SESSION_MAX_AGE) {
    redirect('/login');
  }

  return <ListsPage />;
}
