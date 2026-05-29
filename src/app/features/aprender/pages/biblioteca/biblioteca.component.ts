import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, EmptyStateComponent],
  templateUrl: './biblioteca.component.html',
  styleUrl: './biblioteca.component.css'
})
export class BibliotecaComponent implements OnInit {

  // ── Estado ───────────────────────────────────────────
  libros: any[] = [];
  mostrarForm = false;
  editando = false;
  libroEditId: string | null = null;
  usuarioId = '';
  filtroActivo = 'todos'; // 'todos' | 'leyendo' | 'leido' | 'quiero_leer'

  // ── Formulario ───────────────────────────────────────
  libroForm: FormGroup;

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.libroForm = this.fb.group({
      titulo:        ['', Validators.required],
      autor:         [''],
      estadoLectura: ['quiero_leer'],
      puntuacion:    [0],
      resenia:       ['']
    });
  }

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
    this.cargarLibros();
  }

  // ── Carga ────────────────────────────────────────────
  cargarLibros() {
    this.fs.getByField('libros', 'usuarioId', this.usuarioId).subscribe(data => {
      this.libros = data;
    });
  }

  // ── Filtro ───────────────────────────────────────────
  get librosFiltrados(): any[] {
    if (this.filtroActivo === 'todos') return this.libros;
    return this.libros.filter(l => l.estadoLectura === this.filtroActivo);
  }

  setFiltro(filtro: string) {
    this.filtroActivo = filtro;
  }

  // ── Stats ────────────────────────────────────────────
  get totalLibros(): number { return this.libros.length; }
  get librosLeyendo(): number { return this.libros.filter(l => l.estadoLectura === 'leyendo').length; }
  get librosLeidos(): number { return this.libros.filter(l => l.estadoLectura === 'leido').length; }
  get librosFavoritos(): number { return this.libros.filter(l => l.puntuacion === 5).length; }

  // ── Helpers visuales ─────────────────────────────────
  getColorEstado(estado: string): string {
    switch (estado) {
      case 'leyendo':     return '#4A9EFF';
      case 'leido':       return '#34D399';
      case 'quiero_leer': return '#FBBF24';
      default:            return '#4A9EFF';
    }
  }

  getIconoEstado(estado: string): string {
    switch (estado) {
      case 'leyendo':     return '📖';
      case 'leido':       return '✅';
      case 'quiero_leer': return '📚';
      default:            return '📚';
    }
  }

  getLabelEstado(estado: string): string {
    switch (estado) {
      case 'leyendo':     return 'Leyendo';
      case 'leido':       return 'Leído';
      case 'quiero_leer': return 'Quiero leer';
      default:            return estado;
    }
  }

  getEstrellas(puntuacion: number): string {
    return '⭐'.repeat(puntuacion);
  }

  // ── CRUD ─────────────────────────────────────────────
  guardarLibro() {
    if (this.libroForm.invalid) return;
    const datos = { ...this.libroForm.value, usuarioId: this.usuarioId };
    if (this.editando && this.libroEditId) {
      this.fs.update('libros', this.libroEditId, datos).then(() => {
        this.cancelar();
        this.cargarLibros();
      });
    } else {
      this.fs.create('libros', datos).then(() => {
        this.cancelar();
        this.cargarLibros();
      });
    }
  }

  editarLibro(libro: any) {
    this.editando = true;
    this.libroEditId = libro.id;
    this.mostrarForm = true;
    this.libroForm.patchValue(libro);
  }

  eliminarLibro(id: string) {
    if (confirm('¿Eliminar este libro?')) {
      this.fs.delete('libros', id).then(() => this.cargarLibros());
    }
  }

  cancelar() {
    this.editando = false;
    this.libroEditId = null;
    this.mostrarForm = false;
    this.libroForm.reset({ estadoLectura: 'quiero_leer', puntuacion: 0 });
  }

  abrirForm() { this.mostrarForm = true; }

  volver() { this.router.navigate(['/aprender']); }
}