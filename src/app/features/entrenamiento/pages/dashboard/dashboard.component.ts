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
  rutinasActivas = 0;
  rachaEntrenamiento = 0;

  rutinas: any[] = [];
  categoriaActiva = 'Fuerza';
  categorias = [
    { label: 'Fuerza',     icono: '🏋️' },
    { label: 'Hipertrofia',icono: '💪' },
    { label: 'Cardio',     icono: '❤️' },
    { label: 'Movilidad',  icono: '🧘' },
    { label: 'HIIT',       icono: '⚡' }
  ];

  constructor(private fs: FirestoreService, private auth: AuthService) {}

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
    this.cargarResumen();
  }

  cargarResumen() {
    this.fs.getByField('rutinas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.totalRutinas = data.length;
      this.rutinasActivas = data.filter((r: any) => r.estado === 'activa').length;
      this.rutinas = data.slice(0, 3);
    });

    const hoy = new Date().toISOString().split('T')[0];
    this.fs.getByField('entrenamientos', 'usuarioId', this.usuarioId).subscribe(data => {
      this.entrenamientosHoy = data.filter((e: any) => e.fecha === hoy).length;
    });
  }

  setCategoria(cat: string) {
    this.categoriaActiva = cat;
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case 'activa':    return '#4A9EFF';
      case 'pausada':   return '#FBBF24';
      case 'completada':return '#34D399';
      default:          return '#4A9EFF';
    }
  }

  getLabelEstado(estado: string): string {
    switch (estado) {
      case 'activa':    return 'En progreso';
      case 'pausada':   return 'Pendiente';
      case 'completada':return 'Completada';
      default:          return estado;
    }
  }
}