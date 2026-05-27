// Módulo de Alimentarse: agrupa dashboard, recetas y diario
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// Pages
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { RecetasComponent } from './pages/recetas/recetas.component';
import { DiarioComponent } from './pages/diario/diario.component';

// Rutas hijas
const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'recetas', component: RecetasComponent },
  { path: 'diario', component: DiarioComponent }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    DashboardComponent,
    RecetasComponent,
    DiarioComponent
  ]
})
export class AlimentarseModule { }