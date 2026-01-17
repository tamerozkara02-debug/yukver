'use server';
/**
 * @fileOverview Flows for securely managing staff users (admins).
 * This file contains flows for creating and deleting users from Firebase Authentication
 * and managing their roles in Firestore. It requires administrative privileges to execute.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
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
    try {
      if (getApps().length === 0) {
        initializeApp();
      }

      const userRecord = await getAuth().createUser({
        email,
        password,
      });

      const db = getFirestore();
      const adminRoleRef = db.collection('roles_admin').doc(userRecord.uid);
      await adminRoleRef.set({
        id: userRecord.uid,
        username: userRecord.email,
        permissions: permissions,
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
      
      // Throw the specific error message from the underlying service (e.g., Firebase Admin).
      throw new Error(error.message || 'Personel oluşturulurken bilinmeyen bir sunucu hatası oluştu.');
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
    try {
        if (getApps().length === 0) {
            initializeApp();
        }
        await getAuth().deleteUser(userId);
        const db = getFirestore();
        await db.collection('roles_admin').doc(userId).delete();
        return { success: true, message: `Personel başarıyla silindi.` };
    } catch (error: any) {
        console.error(`Failed to delete user ${userId}:`, error);

        if (error.code === 'auth/user-not-found') {
            try {
                // If the user isn't in Auth, still try to clean up their Firestore role document.
                const db = getFirestore();
                await db.collection('roles_admin').doc(userId).delete();
                return { success: true, message: `Kullanıcı kimlik doğrulamada bulunamadı, ancak ilişkili rolü veritabanından temizlendi.` };
            } catch (dbError: any) {
                console.error(`Failed to delete orphaned role for user ${userId}:`, dbError);
                throw new Error(`Kullanıcı kimlik doğrulamada bulunamadı ve veritabanı rolü de silinemedi: ${dbError.message}`);
            }
        }
        // For all other errors, throw the specific, underlying error message.
        throw new Error(error.message || 'Personel silinirken bilinmeyen bir sunucu hatası oluştu.');
    }
  }
);
