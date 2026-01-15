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
      await getAuth().deleteUser(userId);

      // 2. Delete user's role document from Firestore
      const db = getFirestore();
      const query = db.collection('roles_admin').where('id', '==', userId);
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        // If no role document was found, the user might have already been partially deleted.
        // We can consider this a success for idempotency.
        return { success: true, message: `User with UID ${userId} deleted from Auth. No Firestore role document found to delete.` };
      }

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      return { success: true, message: `Successfully deleted user ${userId} from Auth and Firestore.` };

    } catch (error: any) {
      console.error(`Failed to delete user ${userId}:`, error);
      // It's important to rethrow or handle the error to provide feedback
      throw new Error(`Failed to delete staff user: ${error.message}`);
    }
  }
);
