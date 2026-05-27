// Módulo de Entrenamiento: dashboard, rutinas y bitácora
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { RutinasComponent } from './pages/rutinas/rutinas.component';
import { BitacoraComponent } from './pages/bitacora/bitacora.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'rutinas', component: RutinasComponent },
  { path: 'bitacora', component: BitacoraComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    DashboardComponent,
    RutinasComponent,
    BitacoraComponent
  ]
})
export class EntrenamientoModule { }