// Minimal environment typings for Expo public env vars in React Native
// Avoids bringing in full @types/node which can conflict in RN

declare global {
  // Very lightweight declaration for process.env in Expo
  // Only includes the keys we actually use
  const process: {
    env: {
      EXPO_PUBLIC_SUPABASE_URL?: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
      [key: string]: string | undefined;
    };
  };
}

export {};


