'use server';
/**
 * @fileOverview Flows for securely managing staff users (admins).
 * This file contains flows for creating and deleting users from Firebase Authentication
 * and managing their roles in Firestore. It requires administrative privileges to execute.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps } from 'firebase-admin/app';

//-/////////////////////////////////////////////////////////////////
// Create Staff Flow
//-/////////////////////////////////////////////////////////////////

const PermissionsSchema = z.object({
  canViewDashboard: z.boolean().default(true).describe('Can view the main dashboard.'),
  canTrackLocations: z.boolean().default(false).describe('Can view driver locations.'),
  canManageMembers: z.boolean().default(false).describe('Can view and manage firms and drivers.'),
  canManageStaff: z.boolean().default(false).describe('Can create, view, and delete other staff members.'),
});

const CreateStaffInputSchema = z.object({
  email: z.string().email().describe('The email for the new staff user.'),
  password: z.string().min(6).describe('The password for the new staff user (min 6 chars).'),
  permissions: PermissionsSchema,
});
export type CreateStaffInput = z.infer<typeof CreateStaffInputSchema>;

const CreateStaffOutputSchema = z.object({
  uid: z.string(),
  email: z.string(),
});
export type CreateStaffOutput = z.infer<typeof CreateStaffOutputSchema>;

export async function createStaffUser(input: CreateStaffInput): Promise<CreateStaffOutput> {
  return createStaffFlow(input);
}

const createStaffFlow = ai.defineFlow(
  {
    name: 'createStaffFlow',
    inputSchema: CreateStaffInputSchema,
    outputSchema: CreateStaffOutputSchema,
  },
  async ({ email, password, permissions }) => {
    // Initialize Firebase Admin SDK if not already initialized
    if (getApps().length === 0) {
      initializeApp();
    }

    try {
      // 1. Create user in Firebase Authentication
      const userRecord = await getAuth().createUser({
        email,
        password,
      });

      // 2. Create the admin role document in Firestore
      const db = getFirestore();
      const adminRoleRef = db.collection('roles_admin').doc(userRecord.uid);
      await adminRoleRef.set({
        id: userRecord.uid,
        username: userRecord.email,
        permissions: permissions, // Save permissions object
      });

      return {
        uid: userRecord.uid,
        email: userRecord.email!,
      };
    } catch (error: any) {
      console.error("Error in createStaffFlow:", error);

      if (error.code === 'auth/email-already-exists') {
        throw new Error('Bu e-posta adresi zaten kullanımda.');
      }
      if (error.code === 'auth/invalid-password') {
        throw new Error('Şifre en az 6 karakter olmalıdır.');
      }
      
      throw new Error(`Personel oluşturulamadı: Sunucu tarafında bir hata oluştu. (${error.message})`);
    }
  }
);


//-/////////////////////////////////////////////////////////////////
// Delete Staff Flow
//-/////////////////////////////////////////////////////////////////

const DeleteStaffInputSchema = z.object({
  userId: z.string().describe('The UID of the staff user to delete.'),
});
export type DeleteStaffInput = z.infer<typeof DeleteStaffInputSchema>;

const DeleteStaffOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeleteStaffOutput = z.infer<typeof DeleteStaffOutputSchema>;


export async function deleteStaffUser(input: DeleteStaffInput): Promise<DeleteStaffOutput> {
  return deleteStaffFlow(input);
}

const deleteStaffFlow = ai.defineFlow(
  {
    name: 'deleteStaffFlow',
    inputSchema: DeleteStaffInputSchema,
    outputSchema: DeleteStaffOutputSchema,
  },
  async ({ userId }) => {
    // Initialize Firebase Admin SDK if not already initialized
    if (getApps().length === 0) {
      initializeApp();
    }

    try {
      // 1. Delete user from Firebase Authentication
      await getAuth().deleteUser(userId);

      // 2. Delete user's role document from Firestore
      const db = getFirestore();
      const userRoleDocRef = db.collection('roles_admin').doc(userId);
      await userRoleDocRef.delete();
      
      return { success: true, message: `Successfully deleted user ${userId} from Auth and Firestore.` };

    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // If user is not in Auth, try to delete from Firestore just in case.
        try {
            const db = getFirestore();
            const userRoleDocRef = db.collection('roles_admin').doc(userId);
            await userRoleDocRef.delete();
            return { success: true, message: `User ${userId} was not in Auth, but was removed from Firestore roles.`};
        } catch (dbError) {
            return { success: true, message: `User with UID ${userId} was not found in Firebase Auth.`};
        }
      }
      console.error(`Failed to delete user ${userId}:`, error);
      throw new Error(`Failed to delete staff user: ${error.message}`);
    }
  }
);
