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
      // Initialize Firebase Admin SDK if not already initialized.
      // This is the critical change: move initialization inside the try block.
      if (getApps().length === 0) {
        initializeApp();
      }

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
      // Log the detailed error on the server for debugging
      console.error("Error in createStaffFlow:", error);

      // Provide clear, user-friendly error messages to the client
      if (error.code === 'auth/email-already-exists') {
        throw new Error('Bu e-posta adresi zaten kullanımda.');
      }
      if (error.code === 'auth/invalid-password') {
        throw new Error('Şifre en az 6 karakter olmalıdır.');
      }
      
      // A generic but more helpful message for other errors (like initialization failure)
      throw new Error(`Personel oluşturulamadı: Sunucu tarafında bir hata oluştu. Lütfen sistem yöneticisiyle iletişime geçin.`);
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
            // User doesn't exist in Auth, but their role might still be in Firestore.
            // Let's try to clean up Firestore.
            try {
                const db = getFirestore();
                if (getApps().length === 0) {
                    initializeApp();
                }
                await db.collection('roles_admin').doc(userId).delete();
                // We can consider this a "success" in terms of cleanup.
                return { success: true, message: `Kullanıcı kimlik doğrulamada bulunamadı, ancak rolü veritabanından temizlendi.` };
            } catch (dbError) {
                console.error(`Failed to delete orphaned role for user ${userId}:`, dbError);
                throw new Error(`Kullanıcı kimlik doğrulamada bulunamadı ve veritabanı rolü de silinemedi.`);
            }
        }
        // For all other errors (including initialization), throw a generic error.
        throw new Error(`Personel silinirken bir sunucu hatası oluştu.`);
    }
  }
);
