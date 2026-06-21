import { initializeApp } from 'firebase/app';
try {
  initializeApp({
    apiKey: undefined,
    authDomain: undefined,
    projectId: undefined,
    storageBucket: undefined,
    messagingSenderId: undefined,
    appId: undefined,
  });
  console.log("Success");
} catch (e: any) {
  console.error("Failed:", e.message);
}
