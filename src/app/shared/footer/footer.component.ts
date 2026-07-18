/* =====================================================
   FOOTER PRINCIPAL
   ===================================================== */

import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  NavigationEnd,
  Router,
  RouterModule
} from '@angular/router';

import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-footer',

  standalone: true,

  imports: [
    CommonModule,
    RouterModule
  ],

  templateUrl: './footer.component.html',

  styleUrl: './footer.component.css'
})
export class FooterComponent {

  /* ===================================================
     DEPENDENCIAS
     =================================================== */

  private readonly destroyRef = inject(DestroyRef);

  /* ===================================================
     ESTADO
     =================================================== */

  rutaActual = '';

  constructor(
    private router: Router
  ) {

    // Ruta actual al iniciar el componente
    this.rutaActual = this.limpiarRuta(
      this.router.url
    );

    // Escuchamos solamente las navegaciones finalizadas
    this.router.events
      .pipe(
        filter(
          (evento): evento is NavigationEnd =>
            evento instanceof NavigationEnd
        ),

        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((evento: NavigationEnd) => {

        this.rutaActual = this.limpiarRuta(
          evento.urlAfterRedirects
        );

      });

  }

  /* ===================================================
     PROPIEDADES
     =================================================== */

  /**
   * Muestra la flecha únicamente cuando
   * estamos dentro de una subpantalla.
   */
  get mostrarFlecha(): boolean {

    return this.obtenerSegmentosRuta().length > 1;

  }

  /* ===================================================
     NAVEGACIÓN
     =================================================== */

  /**
   * Regresa un nivel dentro de la aplicación.
   */
  async volver(): Promise<void> {

    const segmentos = this.obtenerSegmentosRuta();

    if (segmentos.length <= 1) {

      await this.router.navigate(['/inicio']);
      return;

    }

    segmentos.pop();

    await this.router.navigateByUrl(
      '/' + segmentos.join('/')
    );

  }

  /* ===================================================
     MÉTODOS PRIVADOS
     =================================================== */

  /**
   * Devuelve los segmentos de la ruta.
   */
  private obtenerSegmentosRuta(): string[] {

    return this.rutaActual
      .split('/')
      .filter(Boolean);

  }

  /**
   * Elimina parámetros y fragmentos de la URL.
   */
  private limpiarRuta(url: string): string {

    return url
      .split('?')[0]
      .split('#')[0];

  }

}