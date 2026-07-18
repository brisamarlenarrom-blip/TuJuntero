/* =====================================================
   NAVBAR PRINCIPAL
   ===================================================== */

import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NavigationEnd,
  Router,
  RouterModule
} from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-navbar',

  standalone: true,

  imports: [
    CommonModule,
    RouterModule
  ],

  templateUrl: './navbar.component.html',

  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  /* ===================================================
     DEPENDENCIAS
     =================================================== */

  /*
   * DestroyRef permite detectar cuándo Angular destruye
   * este componente.
   *
   * Se utiliza junto con takeUntilDestroyed() para cerrar
   * automáticamente la suscripción a los eventos del router.
   */
  private readonly destroyRef = inject(DestroyRef);

  /* ===================================================
     ESTADO DEL COMPONENTE
     =================================================== */

  /*
   * Guarda la ruta actual sin parámetros ni fragmentos.
   *
   * Ejemplo:
   *
   * /aprender/tareas?estado=pendiente
   *
   * Se guarda como:
   *
   * /aprender/tareas
   */
  rutaActual = '';

  constructor(
    public auth: AuthService,
    private router: Router
  ) {
    /*
     * Inicializamos la ruta actual.
     *
     * Esto permite que la navbar conozca la ruta incluso
     * antes de que ocurra una nueva navegación.
     */
    this.rutaActual = this.limpiarRuta(
      this.router.url
    );

    /*
     * Escuchamos solamente los eventos NavigationEnd.
     *
     * NavigationEnd ocurre cuando una navegación termina
     * correctamente.
     */
    this.router.events
      .pipe(
        filter(
          (evento): evento is NavigationEnd =>
            evento instanceof NavigationEnd
        ),

        /*
         * Angular cancela automáticamente esta suscripción
         * cuando el componente se destruye.
         */
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((evento: NavigationEnd) => {
        this.rutaActual = this.limpiarRuta(
          evento.urlAfterRedirects
        );
      });
  }

  /* ===================================================
     DATOS DEL USUARIO
     =================================================== */

  /*
   * Obtiene el nombre del usuario actualmente autenticado.
   *
   * Si no existe una sesión, devuelve una cadena vacía.
   */
  get nombre(): string {
    return this.auth.getUsuarioActual()?.nombre ?? '';
  }

  /*
   * Indica si existe un usuario autenticado.
   *
   * Puede utilizarse desde el HTML para mostrar u ocultar
   * botones del menú.
   */
  get estaLogueado(): boolean {
    return this.auth.getIsLogged();
  }

  /*
   * Indica si el usuario actual tiene rol administrador.
   */
  get esAdmin(): boolean {
    return this.auth.getRol() === 'admin';
  }

  /*
   * Indica si el usuario actual es mentor.
   *
   * Se controla tanto la propiedad esMentor como el rol,
   * porque tu modelo utiliza ambas propiedades.
   */
  get esMentor(): boolean {
    const usuario = this.auth.getUsuarioActual();

    return (
      usuario?.esMentor === true ||
      usuario?.rol === 'mentor' ||
      usuario?.rol === 'admin'
    );
  }

  /* ===================================================
     FLECHA PARA VOLVER
     =================================================== */

  /*
   * La flecha no se muestra en la pantalla de inicio.
   */
  get mostrarFlecha(): boolean {
    return (
      this.rutaActual !== '/inicio' &&
      this.rutaActual !== '/' &&
      this.rutaActual !== ''
    );
  }

  /* ===================================================
     TÍTULO SEGÚN LA RUTA
     =================================================== */

  /*
   * Devuelve el título que debe mostrarse en la navbar
   * según el último segmento de la URL.
   */
  get tituloRuta(): string {
    const segmentos = this.obtenerSegmentosRuta();

    /*
     * Relacionamos cada segmento de URL con un título
     * entendible para el usuario.
     */
    const titulos: Record<string, string> = {
      inicio: 'Inicio',

      aprender: 'Aprender',
      materias: 'Materias',
      tareas: 'Tareas',
      biblioteca: 'Biblioteca',

      alimentarse: 'Alimentarse',
      recetas: 'Mis recetas',
      diario: 'Registro diario',
      favoritos: 'Favoritos',

      entrenamiento: 'Entrenamiento',
      rutina: 'Rutina',
      bitacora: 'Bitácora',

      perfil: 'Perfil',

      admin: 'Administración',
      mentores: 'Administración de usuarios',

      auth: 'Cuenta',
      login: 'Iniciar sesión',
      register: 'Registrarse',
      'forgot-password': 'Recuperar contraseña'
    };

    const ultimoSegmento =
      segmentos[segmentos.length - 1];

    return titulos[ultimoSegmento] ?? 'TuJuntero';
  }

  /* ===================================================
     NAVEGACIÓN HACIA ATRÁS
     =================================================== */

  /*
   * Navega un nivel hacia arriba dentro de la URL.
   *
   * Ejemplos:
   *
   * /aprender/tareas  → /aprender
   * /aprender         → /inicio
   */
  async volver(): Promise<void> {
    const segmentos = this.obtenerSegmentosRuta();

    /*
     * Si la ruta tiene solamente un nivel,
     * regresamos directamente al inicio.
     */
    if (segmentos.length <= 1) {
      await this.router.navigate(['/inicio']);
      return;
    }

    /*
     * Quitamos el último segmento.
     */
    segmentos.pop();

    /*
     * Construimos nuevamente la ruta.
     */
    const rutaAnterior = `/${segmentos.join('/')}`;

    await this.router.navigateByUrl(rutaAnterior);
  }

  /* ===================================================
     CIERRE DE SESIÓN
     =================================================== */

  /*
   * Cierra la sesión en Firebase y después redirige
   * al usuario a la pantalla de inicio.
   */
  async logout(): Promise<void> {
    try {
      await this.auth.logout();

      await this.router.navigate(['/inicio']);

    } catch (error: unknown) {
      console.error(
        'No se pudo cerrar la sesión:',
        error
      );
    }
  }

  /* ===================================================
     MÉTODOS AUXILIARES
     =================================================== */

  /*
   * Devuelve los segmentos de la ruta actual.
   *
   * Ejemplo:
   *
   * /aprender/tareas
   *
   * Resultado:
   *
   * ['aprender', 'tareas']
   */
  private obtenerSegmentosRuta(): string[] {
    return this.rutaActual
      .split('/')
      .filter(Boolean);
  }

  /*
   * Elimina parámetros de consulta y fragmentos.
   *
   * Ejemplo:
   *
   * /alimentarse/recetas?categoria=saludable#inicio
   *
   * Resultado:
   *
   * /alimentarse/recetas
   */
  private limpiarRuta(url: string): string {
    return url
      .split('?')[0]
      .split('#')[0];
  }
}