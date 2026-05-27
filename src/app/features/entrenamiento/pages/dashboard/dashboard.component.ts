// Dashboard de Entrenamiento
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-dashboard-entrenamiento',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  usuarioId = '';
  totalRutinas = 0;
  entrenamientosHoy = 0;

  constructor(private fs: FirestoreService, private auth: AuthService) {}

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
    this.cargarResumen();
  }

  cargarResumen() {
    this.fs.getByField('rutinas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.totalRutinas = data.length;
    });
    const hoy = new Date().toISOString().split('T')[0];
    this.fs.getByField('entrenamientos', 'usuarioId', this.usuarioId).subscribe(data => {
      this.entrenamientosHoy = data.filter((e: any) => e.fecha === hoy).length;
    });
  }
}