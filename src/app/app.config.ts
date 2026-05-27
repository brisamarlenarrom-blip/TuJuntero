// Configuración principal de la aplicación
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { routes } from './app.routes';

// Configuración de Firebase (cambia a producción después)
const firebaseConfig = {
  apiKey: "AIzaSyDc76NogbTPa9X4wzBskNZV3kYMFfWqgb8",
  authDomain: "tujuntero.firebaseapp.com",
  projectId: "tujuntero",
  storageBucket: "tujuntero.firebasestorage.app",
  messagingSenderId: "294567799670",
  appId: "1:294567799670:web:6b9cee1ac654ea95972857",
  measurementId: "G-XWR6NDH6J2"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(),
    provideAnimationsAsync(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),  // Inicializa Firebase
    provideFirestore(() => getFirestore())                    // Base de datos Firestore
  ]
};