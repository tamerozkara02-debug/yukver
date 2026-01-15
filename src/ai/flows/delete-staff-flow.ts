'use server';
/**
 * @fileOverview A flow for securely deleting a staff user.
 * This flow deletes the user from Firebase Authentication and their role from Firestore.
 * It requires administrative privileges to execute.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore }from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Define input schema for the flow
const DeleteStaffInputSchema = z.object({
  userId: z.string().describe('The UID of the staff user to delete.'),
});
export type DeleteStaffInput = z.infer<typeof DeleteStaffInputSchema>;

// Define output schema for the flow
const DeleteStaffOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeleteStaffOutput = z.infer<typeof DeleteStaffOutputSchema>;

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
    // IMPORTANT: Firebase Admin SDK requires service account credentials.
    // These should be set as environment variables in a secure manner.
    // For local development, you might use a serviceAccountKey.json file.
    // In production (like Cloud Run), they are often auto-configured.
    const serviceAccount = process.env.SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.SERVICE_ACCOUNT_KEY)
      : undefined;

    initializeApp({
        credential: serviceAccount ? cert(serviceAccount) : undefined
    });
}


// Define the exported wrapper function that clients will call
export async function deleteStaffUser(input: DeleteStaffInput): Promise<DeleteStaffOutput> {
  return deleteStaffFlow(input);
}


// Define the Genkit flow
const deleteStaffFlow = ai.defineFlow(
  {
    name: 'deleteStaffFlow',
    inputSchema: DeleteStaffInputSchema,
    outputSchema: DeleteStaffOutputSchema,
  },
  async ({ userId }) => {
    try {
      // 1. Delete user from Firebase Authentication
      // This will throw an error if the user doesn't exist, which is fine.
      await getAuth().deleteUser(userId);

      // 2. Delete user's role document from Firestore if it exists
      const db = getFirestore();
      // We assume the document ID is the same as the user UID for roles_admin
      const userRoleDocRef = db.collection('roles_admin').doc(userId);
      const userRoleDoc = await userRoleDocRef.get();

      if (userRoleDoc.exists) {
        await userRoleDocRef.delete();
        return { success: true, message: `Successfully deleted user ${userId} from Auth and Firestore.` };
      } else {
        // If no role document was found, it's not a failure.
        // The user was deleted from Auth, and there was no role to clean up.
        return { success: true, message: `User with UID ${userId} deleted from Auth. No Firestore role document was found to delete.` };
      }

    } catch (error: any) {
      // Handle cases where the user might not exist in Auth (e.g., already deleted)
      if (error.code === 'auth/user-not-found') {
        return { success: true, message: `User with UID ${userId} was not found in Firebase Auth (already deleted).`};
      }
      console.error(`Failed to delete user ${userId}:`, error);
      // Re-throw other errors to provide feedback to the client
      throw new Error(`Failed to delete staff user: ${error.message}`);
    }
  }
);
