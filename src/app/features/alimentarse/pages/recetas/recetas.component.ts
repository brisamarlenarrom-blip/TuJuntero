import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, EmptyStateComponent],
  templateUrl: './recetas.component.html',
  styleUrl: './recetas.component.css'
})
export class RecetasComponent implements OnInit {

  recetas: any[] = [];
  mostrarForm = false;
  editando = false;
  recetaEditId: string | null = null;
  usuarioId = '';
  esMentor = false;
  nombreMentor = '';

  recetaForm: FormGroup;

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.recetaForm = this.fb.group({
      nombre:            ['', Validators.required],
      ingredientes:      [''],
      pasos:             [''],
      nivel:             ['facil'],
      tiempoPreparacion: [30],
      esPublica:         [false]
    });
  }

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) {
      this.usuarioId = usuario.id;
      this.esMentor = usuario.esMentor || false;
      this.nombreMentor = usuario.nombre || '';
    }
    this.cargarRecetas();
  }

  cargarRecetas() {
    this.fs.getByField('recetas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.recetas = data;
    });
  }

  getNivelColor(nivel: string): string {
    switch (nivel) {
      case 'facil':   return '#34D399';
      case 'medio':   return '#FBBF24';
      case 'dificil': return '#EF4444';
      default:        return '#34D399';
    }
  }

  getNivelLabel(nivel: string): string {
    switch (nivel) {
      case 'facil':   return 'Fácil';
      case 'medio':   return 'Medio';
      case 'dificil': return 'Difícil';
      default:        return nivel;
    }
  }

  guardarReceta() {
    if (this.recetaForm.invalid) return;
    const datos = {
      ...this.recetaForm.value,
      usuarioId: this.usuarioId,
      nombreMentor: this.esMentor ? this.nombreMentor : ''
    };
    if (this.editando && this.recetaEditId) {
      this.fs.update('recetas', this.recetaEditId, datos).then(() => {
        this.cancelar();
        this.cargarRecetas();
      });
    } else {
      this.fs.create('recetas', datos).then(() => {
        this.cancelar();
        this.cargarRecetas();
      });
    }
  }

  editarReceta(receta: any) {
    this.editando = true;
    this.recetaEditId = receta.id;
    this.mostrarForm = true;
    this.recetaForm.patchValue(receta);
  }

  eliminarReceta(id: string) {
    if (confirm('¿Eliminar esta receta?')) {
      this.fs.delete('recetas', id).then(() => this.cargarRecetas());
    }
  }

  cancelar() {
    this.editando = false;
    this.recetaEditId = null;
    this.mostrarForm = false;
    this.recetaForm.reset({ nivel: 'facil', tiempoPreparacion: 30 });
  }

  abrirForm() { this.mostrarForm = true; }
  volver() { this.router.navigate(['/alimentarse']); }
}