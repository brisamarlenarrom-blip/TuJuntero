// Dashboard de Aprender: resumen con tarjetas de Materias y Tareas
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-dashboard',                          // Cambiado a dashboard
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.component.html',           // Cambiado a dashboard
  styleUrl: './dashboard.component.css'                // Cambiado a dashboard
})
export class DashboardComponent implements OnInit {     // Cambiado a DashboardComponent
  usuarioId = '';
  totalMaterias = 0;
  totalTareas = 0;
  tareasPendientes = 0;
  proximaTarea: any = null;
  materiasARendir = 0;

  constructor(private fs: FirestoreService, private auth: AuthService) {}

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
    this.cargarResumen();
  }

  cargarResumen() {
    this.fs.getByField('materias', 'usuarioId', this.usuarioId).subscribe(data => {
      this.totalMaterias = data.length;
      this.materiasARendir = data.filter((m: any) => m.estado === 'a_rendir').length;
    });

    this.fs.getByField('tareas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.totalTareas = data.length;
      this.tareasPendientes = data.filter((t: any) => t.estado === 'pendiente').length;
      const pendientes = data
        .filter((t: any) => t.estado !== 'completada' && t.fechaLimite)
        .sort((a: any, b: any) => new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime());
      this.proximaTarea = pendientes.length > 0 ? pendientes[0] : null;
    });
  }
}