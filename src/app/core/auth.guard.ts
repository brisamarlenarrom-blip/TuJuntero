/* =====================================================
   GUARD DE AUTENTICACIÓN
   ===================================================== */

import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router,
  RouterStateSnapshot
} from '@angular/router';

import { AuthService } from './auth.service';

/*
 * Este guard protege las rutas privadas de la aplicación.
 *
 * Antes de permitir el acceso:
 *
 * 1. Espera a que Firebase termine de comprobar la sesión.
 * 2. Consulta el estado de autenticación del AuthService.
 * 3. Si el usuario está autenticado, permite el acceso.
 * 4. Si no está autenticado, lo redirige al login.
 */
export const authGuard: CanActivateFn = async (
  _route,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  /*
   * Esperamos a que onAuthStateChanged determine si
   * Firebase tiene una sesión activa.
   *
   * Esto es importante cuando el usuario recarga la página,
   * porque Firebase puede tardar unos instantes en recuperar
   * la sesión guardada.
   */
  await authService.authReadyPromise;

  /*
   * Si Firebase confirmó que existe una sesión y el perfil
   * pudo recuperarse desde Firestore, permitimos el acceso.
   */
  if (authService.getIsLogged()) {
    return true;
  }

  /*
   * Si no hay una sesión válida, devolvemos un UrlTree.
   *
   * Angular cancela la navegación actual y redirige
   * automáticamente al login.
   *
   * También guardamos la URL solicitada en returnUrl para
   * poder regresar a esa pantalla después del inicio de sesión.
   */
  return router.createUrlTree(
    ['/auth/login'],
    {
      queryParams: {
        returnUrl: state.url
      }
    }
  );
};