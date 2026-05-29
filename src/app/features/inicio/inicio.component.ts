import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { FirestoreService } from '../../core/firestore.service';
import { CardComponent } from '../../shared/ui/card/card.component';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {

  // ── Saludo ───────────────────────────────────────────
  saludo = '';
  nombre = '';
  fechaActual: string = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // ── Versículo ────────────────────────────────────────
  frase = 'Cargando...';
  referencia = '';

  // ── Check-in emocional ───────────────────────────────
  estadoAnimo = 0;
  emojis = [
    { valor: 1, emoji: '😢', label: 'Mal' },
    { valor: 2, emoji: '😐', label: 'Regular' },
    { valor: 3, emoji: '🙂', label: 'Bien' },
    { valor: 4, emoji: '😊', label: 'Muy bien' },
    { valor: 5, emoji: '🤩', label: 'Excelente' }
  ];

  // ── Stats ────────────────────────────────────────────
  diasSeguidos = 5;          // TODO: conectar con check-ins diarios
  metaDiaria = 3;            // TODO: conectar con Firestore
  metaDiariaTotal = 5;

  // ── Accesos rápidos ──────────────────────────────────
  tareasPendientes = 0;
  almuerzoRegistrado = false;
  entrenamientoHoy = 'Piernas y glúteos';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private fs: FirestoreService
  ) {}

  ngOnInit() {
    this.setSaludo();
    this.cargarNombre();
    this.cargarFraseDelDia();
    this.cargarTareasPendientes();
  }

  setSaludo() {
    const h = new Date().getHours();
    this.saludo = h < 12 ? '¡Buenos días' : h < 19 ? '¡Buenas tardes' : '¡Buenas noches';
  }

  cargarNombre() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.nombre = usuario.nombre;
  }

  cargarFraseDelDia() {
    const diaSemana = new Date().getDay().toString();
    this.api.getItemsByTipo('frase').subscribe({
      next: (data) => {
        const fraseHoy = data.find((f: any) => f.diaSemana === diaSemana);
        if (fraseHoy) {
          this.frase = fraseHoy.contenido;
          this.referencia = fraseHoy.autor;
        } else if (data.length > 0) {
          this.frase = data[0].contenido;
          this.referencia = data[0].autor;
        }
      },
      error: () => {
        this.frase = 'Porque yo sé los planes que tengo para vos, dice el Señor...';
        this.referencia = 'Jeremías 29:11';
      }
    });
  }

  cargarTareasPendientes() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) {
      this.fs.getByField('tareas', 'usuarioId', usuario.id).subscribe(data => {
        this.tareasPendientes = data.filter((t: any) => t.estado === 'pendiente').length;
      });
    }
  }

  seleccionarAnimo(valor: number) {
    this.estadoAnimo = valor;
  }
}