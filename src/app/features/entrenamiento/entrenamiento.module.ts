// Módulo de Entrenamiento: dashboard, rutinas y bitácora
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { RutinasComponent } from './pages/rutinas/rutinas.component';
import { BitacoraComponent } from './pages/bitacora/bitacora.component';
import { DestacadosComponent } from './pages/destacados/destacados.component';
import { IaEntrenamientoComponent } from './pages/ia-entrenamiento/ia-entrenamiento.component';


const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'rutinas', component: RutinasComponent },
  { path: 'bitacora', component: BitacoraComponent },
  { path: 'destacados', component: DestacadosComponent },
  { path: 'ia-entrenamiento', component: IaEntrenamientoComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    DashboardComponent,
    RutinasComponent,
    BitacoraComponent,
    DestacadosComponent,
    IaEntrenamientoComponent
  ]
})
export class EntrenamientoModule {

  
 }

 