
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';

/**
 * A hook to determine if the currently authenticated user has admin privileges.
 * 
 * @returns An object containing:
 *  - `isAdmin`: A boolean that is `true` if the user is an admin, `false` otherwise.
 *               It is `false` by default and during loading.
 *  - `isLoading`: A boolean that is `true` while the user's authentication state and
 *                 admin role are being checked.
 */
export function useAdmin() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Memoize the document reference to prevent re-renders
  const adminDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'roles_admin', user.uid) : null),
    [user, firestore]
  );

  useEffect(() => {
    // If auth is still loading, we can't do anything yet.
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    // If there's no user, they are definitely not an admin.
    if (!user || !adminDocRef) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    // User is authenticated, now check for the admin role document.
    const checkAdminStatus = async () => {
      setIsLoading(true);
      try {
        const docSnap = await getDoc(adminDocRef);
        setIsAdmin(docSnap.exists());
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();

  }, [user, isAuthLoading, adminDocRef]);

  return { isAdmin, isLoading };
}
