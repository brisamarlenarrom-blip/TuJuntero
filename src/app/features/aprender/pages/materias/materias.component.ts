import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-materias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, EmptyStateComponent],
  templateUrl: './materias.component.html',
  styleUrl: './materias.component.css'
})
export class MateriasComponent implements OnInit {

  // ── Estado ───────────────────────────────────────────
  materias: any[] = [];
  mostrarForm = false;
  editando = false;
  materiaEditId: string | null = null;
  usuarioId = '';

  // ── Formulario ───────────────────────────────────────
  materiaForm: FormGroup;

  constructor(
    private api: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.materiaForm = this.fb.group({
      nombre:       ['', Validators.required],
      estado:       ['cursando', Validators.required],
      diaHorario:   [''],
      fechaLlamado: [''],
      fechaExamen:  ['']
    });

    // Recarga las materias cada vez que se navega a esta página
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.url.includes('/aprender/materias')) {
        this.cargarMaterias();
      }
    });
  }

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
    this.cargarMaterias();
  }

  // ── Carga ────────────────────────────────────────────
  cargarMaterias() {
    this.api.getByField('materias', 'usuarioId', this.usuarioId).subscribe(data => {
      this.materias = data;
    });
  }

  // ── Helpers visuales ─────────────────────────────────
  getColorEstado(estado: string): string {
    switch (estado) {
      case 'cursando': return '#4A9EFF';
      case 'regular':  return '#A78BFA';
      case 'a_rendir': return '#FBBF24';
      default:         return '#4A9EFF';
    }
  }

  getIconoEstado(estado: string): string {
    switch (estado) {
      case 'cursando': return '📘';
      case 'regular':  return '📙';
      case 'a_rendir': return '📕';
      default:         return '📚';
    }
  }

  getLabelEstado(estado: string): string {
    switch (estado) {
      case 'cursando': return 'Cursando';
      case 'regular':  return 'Regular';
      case 'a_rendir': return 'A rendir';
      default:         return estado;
    }
  }

  getProximaFecha(materia: any): { label: string, fecha: string } | null {
    if (materia.fechaLlamado) return { label: 'Próximo final',   fecha: materia.fechaLlamado };
    if (materia.fechaExamen)  return { label: 'Próximo parcial', fecha: materia.fechaExamen  };
    if (materia.diaHorario)   return { label: 'Horario',         fecha: materia.diaHorario   };
    return null;
  }

  // ── CRUD ─────────────────────────────────────────────
  guardarMateria() {
    if (this.materiaForm.invalid) return;
    const datos = { ...this.materiaForm.value, usuarioId: this.usuarioId };
    if (this.editando && this.materiaEditId) {
      this.api.update('materias', this.materiaEditId, datos).then(() => {
        this.cancelar();
        this.cargarMaterias();
      });
    } else {
      this.api.create('materias', datos).then(() => {
        this.cancelar();
        this.cargarMaterias();
      });
    }
  }

  editarMateria(materia: any) {
    this.editando = true;
    this.materiaEditId = materia.id;
    this.mostrarForm = true;
    this.materiaForm.patchValue(materia);
  }

  eliminarMateria(id: string) {
    if (confirm('¿Eliminar esta materia?')) {
      this.api.delete('materias', id).then(() => this.cargarMaterias());
    }
  }

  cancelar() {
    this.editando = false;
    this.materiaEditId = null;
    this.mostrarForm = false;
    this.materiaForm.reset({ estado: 'cursando' });
  }

  abrirForm() { this.mostrarForm = true; }

  volver() { this.router.navigate(['/aprender']); }
}