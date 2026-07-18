// ==========================================================
// COMPONENTE PRINCIPAL DEL MÓDULO ALIMENTARSE
// ==========================================================

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-alimentarse',

  standalone: true,

  /*
   * RouterOutlet permite mostrar dentro de este componente
   * las distintas páginas hijas del módulo Alimentarse:
   *
   * - Dashboard
   * - Diario
   * - Recetas
   */
  imports: [
    RouterOutlet
  ],

  templateUrl: './alimentarse.component.html',
  styleUrl: './alimentarse.component.css'
})
export class AlimentarseComponent {

  /*
   * Este componente no necesita lógica propia por el momento.
   *
   * Su responsabilidad principal es actuar como contenedor
   * de las páginas internas del módulo Alimentarse.
   */
}