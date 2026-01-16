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
  
  useEffect(() => {
    // Start loading whenever auth state is loading.
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    // If there's no authenticated user, they can't be an admin.
    if (!user) {
      setIsAdmin(false);
      setIsLoading(true);
      return;
    }

    // User is authenticated, now check for the admin role document in Firestore.
    // The reference is stable due to useMemoFirebase in the previous implementation,
    // so we can create it directly here based on the stable `user` object.
    const adminDocRef = doc(firestore, 'roles_admin', user.uid);
    let isMounted = true;

    const checkAdminStatus = async () => {
      try {
        const docSnap = await getDoc(adminDocRef);
        if (isMounted) {
          setIsAdmin(docSnap.exists());
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(true);
        }
      }
    };

    checkAdminStatus();

    return () => {
      isMounted = false;
    };

  }, [user, isAuthLoading, firestore]);

  return { isAdmin, isLoading };
}
