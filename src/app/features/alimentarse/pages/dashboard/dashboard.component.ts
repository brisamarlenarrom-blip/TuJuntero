// Dashboard de Alimentarse: resumen con tarjetas visuales
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-dashboard-alimentarse',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  usuarioId = '';
  totalRecetas = 0;
  comidasHoy = 0;

  constructor(private fs: FirestoreService, private auth: AuthService) {}

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
    this.cargarResumen();
  }

  cargarResumen() {
    this.fs.getByField('recetas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.totalRecetas = data.length;
    });

    const hoy = new Date().toISOString().split('T')[0];
    this.fs.getByField('comidas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.comidasHoy = data.filter((c: any) => c.fecha === hoy).length;
    });
  }
}