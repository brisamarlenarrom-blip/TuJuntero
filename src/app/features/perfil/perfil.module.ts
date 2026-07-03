// Módulo de Comunidad: muro, mentores
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { MuroComponent } from './pages/muro/muro.component';
import { MentoresComponent } from './pages/mentores/mentores.component';
import { EditarPerfilComponent } from './editar-perfil/editar-perfil.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { NotificacionesComponent } from './notificaciones/notificaciones.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'muro', component: MuroComponent },
  { path: 'mentores', component: MentoresComponent },
  { path: 'editar', component: EditarPerfilComponent },
  { path: 'configuracion', component: ConfiguracionComponent },
  { path: 'notificaciones', component: NotificacionesComponent },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    DashboardComponent,
    MuroComponent,
    MentoresComponent,
    EditarPerfilComponent,
    ConfiguracionComponent,
    NotificacionesComponent
  ]
})
export class PerfilModule { }