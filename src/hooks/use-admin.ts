'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';

export interface AdminPermissions {
  canViewDashboard: boolean;
  canTrackLocations: boolean;
  canManageMembers: boolean;
  canManageStaff: boolean;
}

export interface AdminData {
  id: string;
  username: string;
  permissions: AdminPermissions;
}

/**
 * A hook to determine if the currently authenticated user has admin privileges
 * and to retrieve their specific permissions.
 * 
 * @returns An object containing:
 *  - `isAdmin`: A boolean that is `true` if the user is an admin, `false` otherwise.
 *  - `adminData`: An object containing the admin's data from Firestore, including permissions. Null if not an admin.
 *  - `isLoading`: A boolean that is `true` while the user's authentication state and
 *                 admin role are being checked.
 */
export function useAdmin() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Start loading whenever auth state is loading.
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    // If there's no authenticated user, they can't be an admin.
    if (!user) {
      setAdminData(null);
      setIsLoading(false);
      return;
    }

    // User is authenticated, now check for the admin role document in Firestore.
    const adminDocRef = doc(firestore, 'roles_admin', user.uid);
    let isMounted = true;

    const checkAdminStatus = async () => {
      try {
        const docSnap = await getDoc(adminDocRef);
        if (isMounted) {
          if (docSnap.exists()) {
            setAdminData(docSnap.data() as AdminData);
          } else {
            setAdminData(null);
          }
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        if (isMounted) {
          setAdminData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAdminStatus();

    return () => {
      isMounted = false;
    };

  }, [user, isAuthLoading, firestore]);

  return { isAdmin: !!adminData, adminData, isLoading };
}
