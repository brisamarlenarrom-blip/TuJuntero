/* =====================================================
   GUARD DE ADMINISTRADOR
   ===================================================== */

import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import { AuthService } from './auth.service';

/*
 * Este guard permite el acceso únicamente a usuarios
 * que tengan el rol "admin".
 */
export const adminGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  /*
   * Esperamos a que Firebase termine de comprobar
   * si existe una sesión activa.
   */
  await authService.authReadyPromise;

  /*
   * Si no existe una sesión válida,
   * redirigimos al usuario al login.
   */
  if (!authService.getIsLogged()) {
    return router.createUrlTree(['/auth/login']);
  }

  /*
   * Si el usuario tiene rol de administrador,
   * permitimos el acceso.
   */
  if (authService.getRol() === 'admin') {
    return true;
  }

  /*
   * Si está autenticado, pero no es administrador,
   * lo enviamos al inicio.
   */
  return router.createUrlTree(['/inicio']);
};