// Módulo de Comunidad: muro, mentores
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { MuroComponent } from './pages/muro/muro.component';
import { MentoresComponent } from './pages/mentores/mentores.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'muro', component: MuroComponent },
  { path: 'mentores', component: MentoresComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    DashboardComponent,
    MuroComponent,
    MentoresComponent
  ]
})
export class ComunidadModule { }