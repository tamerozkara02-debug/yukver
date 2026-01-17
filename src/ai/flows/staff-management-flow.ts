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
import { initializeApp, getApps, App } from 'firebase-admin/app';

//-/////////////////////////////////////////////////////////////////
// Helper: Firebase Admin SDK Initialization
//-/////////////////////////////////////////////////////////////////

/**
 * Ensures the Firebase Admin SDK is initialized, returning the initialized app.
 * This is a critical step for all server-side Firebase operations.
 * It centralizes the initialization logic to prevent duplicate initializations and handle errors gracefully.
 * @returns {App} The initialized Firebase Admin App instance.
 * @throws {Error} If initialization fails due to configuration issues.
 */
function _ensureFirebaseAdminInitialized(): App {
    // If the SDK is already initialized, return the existing app instance.
    if (getApps().length > 0) {
        return getApps()[0];
    }
    // If not initialized, attempt to initialize it.
    // This relies on Google Application Default Credentials (ADC) in the server environment.
    try {
        return initializeApp();
    } catch (initError: any) {
        // Log the detailed technical error on the server for debugging.
        console.error("CRITICAL: Firebase Admin SDK initialization failed.", initError);
        
        // Create a more informative error message for the client-side.
        const detail = initError.message 
            ? `Teknik Detay: ${initError.message}` 
            : 'Daha fazla detay için sunucu loglarının incelenmesi gerekiyor.';
            
        // Throw a user-friendly but more detailed error.
        throw new Error(`Sunucu yapılandırma hatası: Firebase Admin SDK başlatılamadı. ${detail}`);
    }
}


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
      // Ensure Firebase Admin is ready before proceeding.
      _ensureFirebaseAdminInitialized();

      // 1. Create the user in Firebase Authentication.
      const userRecord = await getAuth().createUser({
        email,
        password,
      });

      // 2. Create the corresponding admin role document in Firestore.
      const db = getFirestore();
      const adminRoleRef = db.collection('roles_admin').doc(userRecord.uid);
      await adminRoleRef.set({
        id: userRecord.uid,
        username: userRecord.email,
        permissions: permissions, // Save the permissions object.
      });

      // 3. Return the new user's basic info on success.
      return {
        uid: userRecord.uid,
        email: userRecord.email!,
      };
    } catch (error: any) {
      // Log the full error on the server for detailed debugging.
      console.error("Error in createStaffFlow:", error);

      // Provide specific, user-friendly error messages for common issues.
      if (error.code === 'auth/email-already-exists') {
        throw new Error('Bu e-posta adresi zaten kullanımda.');
      }
      if (error.code === 'auth/invalid-password') {
        throw new Error('Şifre en az 6 karakter olmalıdır.');
      }
      
      // For any other error (including initialization), re-throw its message.
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
        // Ensure Firebase Admin is ready.
        _ensureFirebaseAdminInitialized();
        
        // 1. Delete the user from Firebase Authentication.
        await getAuth().deleteUser(userId);

        // 2. Delete the user's role document from Firestore.
        const db = getFirestore();
        await db.collection('roles_admin').doc(userId).delete();

        return { success: true, message: `Personel başarıyla silindi.` };

    } catch (error: any) {
        console.error(`Failed to delete user ${userId}:`, error);

        // Gracefully handle cases where the user is already deleted from Auth.
        if (error.code === 'auth/user-not-found') {
            try {
                // Still try to clean up their Firestore role document.
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
