import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-dashboard-perfil',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // ── Usuario ──────────────────────────────────────────
  nombre = '';
  apellido = '';
  email = '';
  usuarioId = '';

  // ── Stats ────────────────────────────────────────────
  diasSeguidos = 0;
  tareasCompletadas = 0;
  minutosEntrenados = 0;
  recetasFavoritas = 0;

  // ── Frase motivacional ───────────────────────────────
  frases = [
    '"Pequeños pasos todos los días, grandes cambios siempre." 💙',
    '"El éxito es la suma de pequeños esfuerzos repetidos cada día." 🔥',
    '"Crecer es incómodo, pero quedarse quieto es peor." ⚡'
  ];
  fraseDelDia = '';

  // ── Logros ───────────────────────────────────────────
  logros = [
    { icono: '🔥', titulo: '7 días seguidos', sub: 'Racha',          color: '#F59E0B', desbloqueado: false },
    { icono: '🏋️', titulo: 'Primera rutina',  sub: '¡Bien hecho!',   color: '#8B5CF6', desbloqueado: false },
    { icono: '📚', titulo: '10 tareas',        sub: 'Completadas',    color: '#4A9EFF', desbloqueado: false },
    { icono: '⭐', titulo: '5 libros leídos',  sub: 'Excelente',      color: '#F59E0B', desbloqueado: false },
    { icono: '❤️', titulo: 'Constancia',       sub: 'No te rendís',   color: '#EF4444', desbloqueado: false },
    { icono: '💧', titulo: 'Hidratado',        sub: '10 días',        color: '#34D399', desbloqueado: false }
  ];

  opciones = [
    { icono: '👤', titulo: 'Editar perfil',    sub: 'Actualizá tu información',  ruta: '/perfil/editar' },
    { icono: '⚙️', titulo: 'Configuración',    sub: 'Preferencias de la app',    ruta: '/perfil/config'  },
    { icono: '🔔', titulo: 'Notificaciones',   sub: 'Administrá alertas',        ruta: '/perfil/notif'   },
  ];

  constructor(private fs: FirestoreService, private auth: AuthService) {}

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) {
      this.usuarioId = usuario.id;
      this.nombre   = usuario.nombre   || '';
      this.apellido = usuario.apellido || '';
      this.email    = usuario.email    || '';
    }
    this.fraseDelDia = this.frases[new Date().getDay() % this.frases.length];
    this.cargarStats();
  }

  cargarStats() {
    // Tareas completadas
    this.fs.getByField('tareas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.tareasCompletadas = data.filter((t: any) => t.estado === 'completada').length;
      if (this.tareasCompletadas >= 10) this.logros[2].desbloqueado = true;
    });

    // Minutos entrenados esta semana
    const hace7 = new Date();
    hace7.setDate(hace7.getDate() - 7);
    this.fs.getByField('entrenamientos', 'usuarioId', this.usuarioId).subscribe(data => {
      const semana = data.filter((e: any) => new Date(e.fecha) >= hace7);
      this.minutosEntrenados = semana.reduce((acc: number, e: any) => acc + (e.duracion || 0), 0);
      if (semana.length > 0) this.logros[1].desbloqueado = true;
    });

    // Recetas favoritas
    this.fs.getByField('recetas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.recetasFavoritas = data.filter((r: any) => r.favorita).length;
    });

    // Libros leídos
    this.fs.getByField('libros', 'usuarioId', this.usuarioId).subscribe(data => {
      const leidos = data.filter((l: any) => l.estadoLectura === 'leido').length;
      if (leidos >= 5) this.logros[3].desbloqueado = true;
    });
  }

  logout() {
    this.auth.logout();
  }

  get iniciales(): string {
    return (this.nombre.charAt(0) + (this.apellido.charAt(0) || '')).toUpperCase();
  }
}