import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './bitacora.component.html',
  styleUrl: './bitacora.component.css'
})
export class BitacoraComponent implements OnInit {

  usuarioId = '';
  hoy = new Date().toISOString().split('T')[0];
  mostrarForm = false;
  filtroActivo = 'semana';

  // ── Entrenamientos ───────────────────────────────────
  todos: any[] = [];

  // ── Stats ────────────────────────────────────────────
  get entrenamientosSemana(): number {
    const hace7 = new Date();
    hace7.setDate(hace7.getDate() - 7);
    return this.todos.filter(e => new Date(e.fecha) >= hace7).length;
  }

  get diasRacha(): number {
    let racha = 0;
    const fecha = new Date();
    for (let i = 0; i < 30; i++) {
      const f = fecha.toISOString().split('T')[0];
      if (this.todos.some(e => e.fecha === f)) {
        racha++;
        fecha.setDate(fecha.getDate() - 1);
      } else break;
    }
    return racha;
  }

  get minutosTotales(): number {
    return this.todos.reduce((acc, e) => acc + (e.duracion || 0), 0);
  }

  get entrenamientosFiltrados(): any[] {
    const ahora = new Date();
    if (this.filtroActivo === 'semana') {
      const hace7 = new Date();
      hace7.setDate(ahora.getDate() - 7);
      return this.todos.filter(e => new Date(e.fecha) >= hace7);
    }
    if (this.filtroActivo === 'mes') {
      const hace30 = new Date();
      hace30.setDate(ahora.getDate() - 30);
      return this.todos.filter(e => new Date(e.fecha) >= hace30);
    }
    return this.todos;
  }

  // ── Formulario ───────────────────────────────────────
  entrenoForm: FormGroup;

  // ── Emojis de sensación ──────────────────────────────
  sensaciones = [
    { value: '😤', label: 'Intenso' },
    { value: '😊', label: 'Bien' },
    { value: '😴', label: 'Cansado' },
    { value: '💪', label: 'Fuerte' },
    { value: '😅', label: 'Difícil' }
  ];
  sensacionSeleccionada = '😊';

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.entrenoForm = this.fb.group({
      rutina:     ['', Validators.required],
      duracion:   [45],
      intensidad: ['media'],
      sensacion:  [''],
      fecha:      [this.hoy]
    });
  }

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
    this.cargarTodos();
  }

  cargarTodos() {
    this.fs.getByField('entrenamientos', 'usuarioId', this.usuarioId).subscribe(data => {
      this.todos = data.sort((a: any, b: any) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
    });
  }

  getFechaLabel(fecha: string): string {
    if (fecha === this.hoy) return 'Hoy';
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    if (fecha === ayer.toISOString().split('T')[0]) return 'Ayer';
    return `Hace ${Math.floor((new Date().getTime() - new Date(fecha).getTime()) / 86400000)} días`;
  }

  getColorIntensidad(intensidad: string): string {
    switch (intensidad) {
      case 'alta':  return '#EF4444';
      case 'media': return '#FBBF24';
      case 'baja':  return '#34D399';
      default:      return '#8B5CF6';
    }
  }

  seleccionarSensacion(emoji: string) {
    this.sensacionSeleccionada = emoji;
    this.entrenoForm.patchValue({ sensacion: emoji });
  }

  guardarEntreno() {
    if (this.entrenoForm.invalid) return;
    const datos = {
      ...this.entrenoForm.value,
      sensacion: this.sensacionSeleccionada,
      usuarioId: this.usuarioId
    };
    this.fs.create('entrenamientos', datos).then(() => {
      this.mostrarForm = false;
      this.sensacionSeleccionada = '😊';
      this.entrenoForm.reset({ duracion: 45, intensidad: 'media', fecha: this.hoy });
      this.cargarTodos();
    });
  }

  eliminarEntreno(id: string) {
    if (confirm('¿Eliminar este registro?')) {
      this.fs.delete('entrenamientos', id).then(() => this.cargarTodos());
    }
  }

  volver() { this.router.navigate(['/entrenamiento']); }
}