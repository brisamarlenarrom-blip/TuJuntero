import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // ── Usuario ──────────────────────────────────────────
  usuarioId = '';

  // ── Materias ─────────────────────────────────────────
  totalMaterias = 0;
  materiasARendir = 0;
  materiasActivas: any[] = [];  // ← array, no number

  // ── Tareas ───────────────────────────────────────────
  totalTareas = 0;
  tareasPendientes = 0;
  proximaTarea: any = null;

  // ── Biblioteca ───────────────────────────────────────
  librosEnProgreso = 0;

  // ── Racha ────────────────────────────────────────────
  diasEnfoque = 0; // TODO: implementar con check-ins diarios

  constructor(private fs: FirestoreService, private auth: AuthService) {}

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
    this.cargarResumen();
  }

  cargarResumen() {

    // ── Materias ────────────────────────────────────────
    this.fs.getByField('materias', 'usuarioId', this.usuarioId).subscribe(data => {
      this.totalMaterias = data.length;
      this.materiasARendir = data.filter((m: any) => m.estado === 'a_rendir').length;
      // Guarda el array completo para usarlo en la sección "Materias activas"
      this.materiasActivas = data.filter((m: any) =>
        m.estado === 'cursando' || m.estado === 'regular' || m.estado === 'a_rendir'
      );
    });

    // ── Tareas ──────────────────────────────────────────
    this.fs.getByField('tareas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.totalTareas = data.length;
      this.tareasPendientes = data.filter((t: any) => t.estado === 'pendiente').length;
      const pendientes = data
        .filter((t: any) => t.estado !== 'completada' && t.fechaLimite)
        .sort((a: any, b: any) => new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime());
      this.proximaTarea = pendientes.length > 0 ? pendientes[0] : null;
    });

    // ── Biblioteca ──────────────────────────────────────
    this.fs.getByField('libros', 'usuarioId', this.usuarioId).subscribe(data => {
      this.librosEnProgreso = data.filter((l: any) => l.estadoLectura === 'leyendo').length;
    });
  }

  // ── Helpers para la sección "Materias activas" ───────

  // Barra de progreso visual según estado
  getProgresoMateria(estado: string): number {
    switch (estado) {
      case 'cursando': return 65;
      case 'regular':  return 85;
      case 'a_rendir': return 30;
      default:         return 0;
    }
  }

  // Color de barra e ícono según estado
  getColorMateria(estado: string): string {
    switch (estado) {
      case 'cursando': return '#4A9EFF';
      case 'regular':  return '#A78BFA';
      case 'a_rendir': return '#FBBF24';
      default:         return '#4A9EFF';
    }
  }

  // Próxima fecha relevante de la materia
  getProximaFechaMateria(materia: any): { label: string, fecha: string } | null {
    if (materia.fechaLlamado) return { label: 'Próximo final',   fecha: materia.fechaLlamado };
    if (materia.fechaExamen)  return { label: 'Próximo parcial', fecha: materia.fechaExamen  };
    if (materia.diaHorario)   return { label: 'Horario',         fecha: materia.diaHorario   };
    return null;
  }
}