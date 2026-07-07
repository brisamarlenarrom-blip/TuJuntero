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

  usuarioId = '';

  totalMaterias = 0;
  materiasARendir = 0;
  materiasActivas: any[] = [];

  totalTareas = 0;
  tareasPendientes = 0;
  proximaTarea: any = null;

  librosEnProgreso = 0;
  diasEnfoque = 0;

  private fechasEnfoque = new Set<string>();

  constructor(
    private fs: FirestoreService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();

    if (usuario) {
      this.usuarioId = usuario.id;
    }

    this.cargarResumen();
  }

  cargarResumen() {

    this.fs.getByField('materias', 'usuarioId', this.usuarioId).subscribe(data => {
      this.totalMaterias = data.length;

      this.materiasARendir = data.filter((m: any) =>
        m.estado === 'a_rendir'
      ).length;

      this.materiasActivas = data.filter((m: any) =>
        m.estado === 'cursando' ||
        m.estado === 'regular' ||
        m.estado === 'a_rendir'
      );

      this.registrarFechasEnfoque(data);
    });

    this.fs.getByField('tareas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.totalTareas = data.length;

      this.tareasPendientes = data.filter((t: any) =>
        t.estado === 'pendiente'
      ).length;

      const pendientes = data
        .filter((t: any) => t.estado !== 'completada' && t.fechaLimite)
        .sort((a: any, b: any) =>
          new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime()
        );

      this.proximaTarea = pendientes.length > 0 ? pendientes[0] : null;

      this.registrarFechasEnfoque(data);
    });

    this.fs.getByField('libros', 'usuarioId', this.usuarioId).subscribe(data => {

      this.librosEnProgreso = data.filter((l: any) =>
        l.estadoLectura === 'leyendo' ||
        l.estado === 'leyendo'
      ).length;

      this.registrarFechasEnfoque(data);
    });
  }

  private registrarFechasEnfoque(items: any[]) {
    items.forEach((item: any) => {
      const fecha =
       item.fechaCreacion ||
       item.creadaEn ||
       item.createdAt ||
       item.fecha ||
       item.fechaActualizacion ||
       item.fechaLimite ||
       item.fechaExamen ||
       item.fechaLlamado;

      const fechaLimpia = this.normalizarFecha(fecha);

      if (fechaLimpia) {
        this.fechasEnfoque.add(fechaLimpia);
      }
    });

    this.diasEnfoque = this.fechasEnfoque.size;
  }

  private normalizarFecha(fecha: any): string | null {
    if (!fecha) return null;

    if (typeof fecha === 'string') {
      return fecha.split('T')[0];
    }

    if (fecha?.toDate) {
      return fecha.toDate().toISOString().split('T')[0];
    }

    if (fecha instanceof Date) {
      return fecha.toISOString().split('T')[0];
    }

    return null;
  }

  getProgresoMateria(estado: string): number {
    switch (estado) {
      case 'cursando': return 65;
      case 'regular': return 85;
      case 'a_rendir': return 30;
      default: return 0;
    }
  }

  getColorMateria(estado: string): string {
    switch (estado) {
      case 'cursando': return '#4A9EFF';
      case 'regular': return '#A78BFA';
      case 'a_rendir': return '#FBBF24';
      default: return '#4A9EFF';
    }
  }

  getProximaFechaMateria(materia: any): { label: string, fecha: string } | null {
    if (materia.fechaLlamado) return { label: 'Próximo final', fecha: materia.fechaLlamado };
    if (materia.fechaExamen) return { label: 'Próximo parcial', fecha: materia.fechaExamen };
    if (materia.diaHorario) return { label: 'Horario', fecha: materia.diaHorario };
    return null;
  }
}