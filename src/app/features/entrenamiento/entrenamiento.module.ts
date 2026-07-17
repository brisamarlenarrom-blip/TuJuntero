// Módulo de Entrenamiento: dashboard, rutinas y bitácora
// Módulo de Entrenamiento
// Agrupa las pantallas principales del módulo:
// dashboard, rutinas, bitácora, destacados,
// generador de entrenamiento y gestión de ejercicios.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// ─────────────────────────────────────────────
// COMPONENTES DEL MÓDULO
// ─────────────────────────────────────────────

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { RutinasComponent } from './pages/rutinas/rutinas.component';
import { BitacoraComponent } from './pages/bitacora/bitacora.component';
import { DestacadosComponent } from './pages/destacados/destacados.component';
import { IaEntrenamientoComponent } from './pages/ia-entrenamiento/ia-entrenamiento.component';
import { EjerciciosComponent } from './pages/ejercicios/ejercicios.component';

// ─────────────────────────────────────────────
// RUTAS HIJAS DE ENTRENAMIENTO
// ─────────────────────────────────────────────

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'rutinas',
    component: RutinasComponent
  },
  {
    path: 'bitacora',
    component: BitacoraComponent
  },
  {
    path: 'destacados',
    component: DestacadosComponent
  },
  {
    path: 'ia-entrenamiento',
    component: IaEntrenamientoComponent
  },
  {
    path: 'ejercicios',
    component: EjerciciosComponent
  }
];

@NgModule({
  declarations: [],

  // Como los componentes son standalone,
  // se agregan dentro de imports.
  imports: [
    CommonModule,
    RouterModule.forChild(routes),

    DashboardComponent,
    RutinasComponent,
    BitacoraComponent,
    DestacadosComponent,
    IaEntrenamientoComponent,
    EjerciciosComponent
  ]
})
export class EntrenamientoModule {}