
// export default function Home() {
//   return (
//     <div>
//       <h1>Home</h1>
//     </div>
//   );
// }

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function Home() {
  const router = useRouter();
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      const role = user?.publicMetadata?.role;

      if (role === 'admin') {
        router.push('/admin/dashboard');
      }
      else {
        router.push('/regular/dashboard');
      }
    }
  }, [isSignedIn, user, router]);

  return (
    <div>
    </div>
  );
}
