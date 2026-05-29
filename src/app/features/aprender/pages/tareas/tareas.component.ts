import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-tareas',
  standalone: true,
imports: [CommonModule, ReactiveFormsModule, MatCardModule,
    MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, EmptyStateComponent, RouterModule],
  templateUrl: './tareas.component.html',
  styleUrl: './tareas.component.css'
})
export class TareasComponent implements OnInit {

  // ── Estado ───────────────────────────────────────────
  tareas: any[] = [];
  mostrarForm = false;
  editando = false;
  tareaEditId: string | null = null;
  usuarioId = '';
  filtroActivo = 'todas'; // 'todas' | 'pendientes' | 'completadas'

  // ── Formulario ───────────────────────────────────────
  tareaForm: FormGroup;

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.tareaForm = this.fb.group({
      titulo:      ['', Validators.required],
      descripcion: [''],
      tipo:        ['tarea', Validators.required],
      fechaLimite: [''],
      prioridad:   ['media'],
      estado:      ['pendiente']
    });
  }

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
    this.cargarTareas();
  }

  // ── Carga ────────────────────────────────────────────
  cargarTareas() {
    this.fs.getByField('tareas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.tareas = data;
    });
  }

  // ── Filtro ───────────────────────────────────────────
  get tareasFiltradas(): any[] {
    if (this.filtroActivo === 'pendientes')
      return this.tareas.filter(t => t.estado === 'pendiente' || t.estado === 'en_progreso');
    if (this.filtroActivo === 'completadas')
      return this.tareas.filter(t => t.estado === 'completada');
    return this.tareas;
  }

  setFiltro(filtro: string) {
    this.filtroActivo = filtro;
  }

  // ── Helpers visuales ─────────────────────────────────
  getIconoTipo(tipo: string): string {
    switch (tipo) {
      case 'examen':  return '📝';
      case 'parcial': return '📋';
      case 'final':   return '🎓';
      case 'entrega': return '📦';
      default:        return '✅';
    }
  }

  getColorTipo(tipo: string): string {
    switch (tipo) {
      case 'examen':  return '#A78BFA';
      case 'parcial': return '#60A5FA';
      case 'final':   return '#F59E0B';
      case 'entrega': return '#34D399';
      default:        return '#4A9EFF';
    }
  }

  getLabelEstado(estado: string): string {
    switch (estado) {
      case 'pendiente':   return 'Pendiente';
      case 'en_progreso': return 'En proceso';
      case 'completada':  return 'Completada';
      default:            return estado;
    }
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case 'pendiente':   return 'badge-azul';
      case 'en_progreso': return 'badge-violeta';
      case 'completada':  return 'badge-verde';
      default:            return 'badge-gris';
    }
  }

  // ── CRUD ─────────────────────────────────────────────
  guardarTarea() {
    if (this.tareaForm.invalid) return;
    const datos = { ...this.tareaForm.value, usuarioId: this.usuarioId };
    if (this.editando && this.tareaEditId) {
      this.fs.update('tareas', this.tareaEditId, datos).then(() => {
        this.cancelar();
        this.cargarTareas();
      });
    } else {
      this.fs.create('tareas', datos).then(() => {
        this.cancelar();
        this.cargarTareas();
      });
    }
  }

  editarTarea(tarea: any) {
    this.editando = true;
    this.tareaEditId = tarea.id;
    this.mostrarForm = true;
    this.tareaForm.patchValue(tarea);
  }

  eliminarTarea(id: string) {
    if (confirm('¿Eliminar esta tarea?')) {
      this.fs.delete('tareas', id).then(() => this.cargarTareas());
    }
  }

  cancelar() {
    this.editando = false;
    this.tareaEditId = null;
    this.mostrarForm = false;
    this.tareaForm.reset({ tipo: 'tarea', prioridad: 'media', estado: 'pendiente' });
  }

  abrirForm() {
    this.mostrarForm = true;
  }

  volver() {
    this.router.navigate(['/aprender']);
  }
}