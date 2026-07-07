import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // 1. Primero revisa si ya está logueado en memoria
  if (auth.getIsLogged()) {
    return true;
  }

  // 2. Si se recargó la página, revisa localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const usuarioGuardado = localStorage.getItem('usuarioActual');

    if (usuarioGuardado) {
      return true;
    }
  }

  // 3. Espera a Firebase
  await auth.authReadyPromise;

  if (auth.getIsLogged()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};