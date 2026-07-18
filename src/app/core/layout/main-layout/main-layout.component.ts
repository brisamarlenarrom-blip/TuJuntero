/* =====================================================
   LAYOUT PRINCIPAL
   ===================================================== */

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';

/*
 * Este componente representa el layout principal
 * de la aplicación.
 *
 * Su función es envolver todas las pantallas públicas
 * y privadas que utilizan:
 *
 * - Navbar
 * - Contenido dinámico
 * - Footer
 *
 * El contenido cambia mediante RouterOutlet,
 * mientras que el navbar y el footer permanecen
 * visibles durante la navegación.
 */

@Component({
  selector: 'app-main-layout',

  standalone: true,

  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent
  ],

  templateUrl: './main-layout.component.html',

  styleUrl: './main-layout.component.css'
})

export class MainLayoutComponent {}