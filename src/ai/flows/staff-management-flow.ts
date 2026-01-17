'use server';
/**
 * @fileOverview A flow for managing staff users.
 *
 * - createStaffUser - Creates a new staff user in Firebase Auth and adds their role in Firestore.
 * - CreateStaffInput - The input type for the createStaffUser function.
 * - CreateStaffOutput - The return type for the createStaffUser function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import * as admin from 'firebase-admin';

const CreateStaffInputSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
export type CreateStaffInput = z.infer<typeof CreateStaffInputSchema>;

const CreateStaffOutputSchema = z.object({
    uid: z.string(),
    email: z.string(),
});
export type CreateStaffOutput = z.infer<typeof CreateStaffOutputSchema>;

// Initialize Firebase Admin SDK
// This needs to be done only once.
if (!admin.apps.length) {
  try {
    // When running in a Google Cloud environment, the SDK can auto-discover credentials.
    admin.initializeApp();
  } catch (e: any) {
    console.error('Could not initialize Firebase Admin SDK automatically. Error: ' + e.message);
    // If not in a GCP environment, you would initialize with credentials like this:
    // const serviceAccount = require("path/to/your/serviceAccountKey.json");
    // admin.initializeApp({
    //   credential: admin.credential.cert(serviceAccount)
    // });
    // For this context, we'll throw an error if auto-init fails.
    throw new Error('Firebase Admin SDK initialization failed. Server is not configured with necessary credentials.');
  }
}

const auth = admin.auth();
const firestore = admin.firestore();

export async function createStaffUser(input: CreateStaffInput): Promise<CreateStaffOutput> {
    return createStaffUserFlow(input);
}

const createStaffUserFlow = ai.defineFlow(
    {
        name: 'createStaffUserFlow',
        inputSchema: CreateStaffInputSchema,
        outputSchema: CreateStaffOutputSchema,
    },
    async ({ email, password }) => {
        try {
            // 1. Create the user in Firebase Authentication
            const userRecord = await auth.createUser({
                email,
                password,
                emailVerified: true, // Let's assume staff emails are trusted
            });

            // 2. Create the admin role document in Firestore
            const adminRoleRef = firestore.collection('roles_admin').doc(userRecord.uid);

            const defaultPermissions = {
                canViewDashboard: true,
                canTrackLocations: false,
                canManageMembers: false,
                canManageStaff: false,
            };

            await adminRoleRef.set({
                id: userRecord.uid,
                username: userRecord.email,
                permissions: defaultPermissions,
            });

            return {
                uid: userRecord.uid,
                email: userRecord.email!,
            };

        } catch (error: any) {
            if (error.code === 'auth/email-already-exists') {
                throw new Error('Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.');
            }
            if (error.code === 'auth/invalid-password') {
                throw new Error('Şifre geçersiz. En az 6 karakter olmalıdır.');
            }
            console.error('Error in createStaffUserFlow:', error);
            throw new Error(`Personel oluşturulurken bir hata oluştu: ${error.message}`);
        }
    }
);
