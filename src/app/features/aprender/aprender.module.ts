// Módulo de Aprender: agrupa dashboard, materias, tareas y biblioteca
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// Pages (páginas de cada sección)
import { DashboardComponent } from './pages/dashboard/dashboard.component';       // Resumen principal
import { MateriasComponent } from './pages/materias/materias.component';           // CRUD de materias
import { TareasComponent } from './pages/tareas/tareas.component';                 // CRUD de tareas
import { BibliotecaComponent } from './pages/biblioteca/biblioteca.component';     // CRUD de libros
import { AsistenteComponent } from './pages/asistente/asistente.component';
 
// Rutas hijas de Aprender
const routes: Routes = [
  { path: '', component: DashboardComponent },          // Resumen al entrar
  { path: 'materias', component: MateriasComponent },
  { path: 'tareas', component: TareasComponent },
  { path: 'biblioteca', component: BibliotecaComponent },
  { path: 'asistente', component: AsistenteComponent },
];

@NgModule({
  declarations: [],  // Vacío porque los componentes son standalone
  imports: [
    CommonModule,
    RouterModule.forChild(routes),  // Rutas hijas con Lazy Loading
    DashboardComponent,
    MateriasComponent,
    TareasComponent,
    BibliotecaComponent,
    AsistenteComponent,
  ]
})
export class AprenderModule { }