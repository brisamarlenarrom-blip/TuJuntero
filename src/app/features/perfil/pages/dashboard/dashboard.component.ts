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
  esAdmin = false;

  // ── Stats ────────────────────────────────────────────
  diasSeguidos = 0;
  tareasCompletadas = 0;
  minutosEntrenados = 0;
  recetasFavoritas = 0;

  // ── Ánimo del mes ────────────────────────────────────
  animosMes: any[] = [];
  promedioAnimo = 0;
  diasRegistrados = 0;
  emojiPromedio = '';

  // ── Frase motivacional ───────────────────────────────
  frases = [
    '"Pequeños pasos todos los días, grandes cambios siempre." 💙',
    '"El éxito es la suma de pequeños esfuerzos repetidos cada día." 🔥',
    '"Crecer es incómodo, pero quedarse quieto es peor." ⚡'
  ];
  fraseDelDia = '';

  // ── Logros ───────────────────────────────────────────
  logros = [
    { icono: '🔥', titulo: '7 días seguidos', sub: 'Racha',        color: '#F59E0B', desbloqueado: false },
    { icono: '🏋️', titulo: 'Primera rutina',  sub: '¡Bien hecho!', color: '#8B5CF6', desbloqueado: false },
    { icono: '📚', titulo: '10 tareas',        sub: 'Completadas',  color: '#4A9EFF', desbloqueado: false },
    { icono: '⭐', titulo: '5 libros leídos',  sub: 'Excelente',    color: '#F59E0B', desbloqueado: false },
    { icono: '❤️', titulo: 'Constancia',       sub: 'No te rendís', color: '#EF4444', desbloqueado: false },
    { icono: '💧', titulo: 'Hidratado',        sub: '10 días',      color: '#34D399', desbloqueado: false }
  ];

  get opciones() {
  const ops = [
    { icono: '👤', titulo: 'Editar perfil',  sub: 'Actualizá tu información', ruta: '/perfil/editar' },
    { icono: '⚙️', titulo: 'Configuración',  sub: 'Preferencias de la app',   ruta: '/perfil/configuracion' },
    { icono: '🔔', titulo: 'Notificaciones', sub: 'Administrá alertas',       ruta: '/perfil/notificaciones' },
  ];
  if (this.esAdmin) {
    ops.push({ icono: '🛡️', titulo: 'Panel Admin', sub: 'Gestionar mentores', ruta: '/admin/mentores' });
  }
  return ops;
}
  constructor(private fs: FirestoreService, private auth: AuthService) {}

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) {
      this.usuarioId = usuario.id;
      this.nombre   = usuario.nombre   || '';
      this.apellido = usuario.apellido || '';
      this.email    = usuario.email    || '';
      this.esAdmin  = usuario.rol === 'admin';
      console.log('esAdmin:', this.esAdmin, 'rol:', usuario.rol);
      
    }
    this.fraseDelDia = this.frases[new Date().getDay() % this.frases.length];
    this.cargarStats();
    this.cargarAnimosMes();
    
  }

  cargarStats() {
    this.fs.getByField('tareas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.tareasCompletadas = data.filter((t: any) => t.estado === 'completada').length;
      if (this.tareasCompletadas >= 10) this.logros[2].desbloqueado = true;
    });

    const hace7 = new Date();
    hace7.setDate(hace7.getDate() - 7);
    this.fs.getByField('entrenamientos', 'usuarioId', this.usuarioId).subscribe(data => {
      const semana = data.filter((e: any) => new Date(e.fecha) >= hace7);
      this.minutosEntrenados = semana.reduce((acc: number, e: any) => acc + (e.duracion || 0), 0);
      if (semana.length > 0) this.logros[1].desbloqueado = true;
    });

    this.fs.getByField('recetas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.recetasFavoritas = data.filter((r: any) => r.favorita).length;
    });

    this.fs.getByField('libros', 'usuarioId', this.usuarioId).subscribe(data => {
      const leidos = data.filter((l: any) => l.estadoLectura === 'leido').length;
      if (leidos >= 5) this.logros[3].desbloqueado = true;
    });
  }

  // ── Carga ánimos del mes actual ──────────────────────
  cargarAnimosMes() {
    this.fs.getByField('animos', 'usuarioId', this.usuarioId).subscribe(data => {
      const ahora = new Date();
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
        .toISOString().split('T')[0];

      this.animosMes = data
        .filter((a: any) => a.fecha >= inicioMes)
        .sort((a: any, b: any) => a.fecha.localeCompare(b.fecha));

      this.diasRegistrados = this.animosMes.length;

      if (this.diasRegistrados > 0) {
        const suma = this.animosMes.reduce((acc: number, a: any) => acc + a.valor, 0);
        this.promedioAnimo = Math.round((suma / this.diasRegistrados) * 10) / 10;
        this.emojiPromedio = this.getEmojiPorValor(Math.round(this.promedioAnimo));
      }
    });
  }

  getEmojiPorValor(valor: number): string {
    const emojis: Record<number, string> = {
      1: '😢', 2: '😐', 3: '🙂', 4: '😊', 5: '🤩'
    };
    return emojis[valor] || '🙂';
  }

  getLabelPorValor(valor: number): string {
    const labels: Record<number, string> = {
      1: 'Mal', 2: 'Regular', 3: 'Bien', 4: 'Muy bien', 5: 'Excelente'
    };
    return labels[valor] || 'Bien';
  }

  getColorAnimo(valor: number): string {
    const colores: Record<number, string> = {
      1: '#EF4444', 2: '#F59E0B', 3: '#4A9EFF', 4: '#34D399', 5: '#8B5CF6'
    };
    return colores[valor] || '#4A9EFF';
  }

  logout() {
    this.auth.logout();
  }

  get iniciales(): string {
    return (this.nombre.charAt(0) + (this.apellido.charAt(0) || '')).toUpperCase();
  }



}