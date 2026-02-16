'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It was previously throwing errors which caused the application to hang.
 * This version logs the error to the console without throwing, which will break the infinite loop.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // DO NOT THROW. Throwing the error during render was causing the app to hang.
      // Logging it to the console is safer and still provides debug information.
      console.error("A Firestore permission error was caught. This is likely the cause of the startup issue:", error);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // This component now renders nothing and does not throw errors during the render cycle.
  return null;
}
