// Componente Recetas: CRUD con Firebase Firestore
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox'; // Checkbox publicar como mentor
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SectionTitleComponent } from '../../../../shared/ui/section-title/section-title.component';
import { CardComponent } from '../../../../shared/ui/card/card.component'; // UI Card

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule, BadgeComponent, EmptyStateComponent, SectionTitleComponent, CardComponent],
  templateUrl: './recetas.component.html',
  styleUrl: './recetas.component.css'
})
export class RecetasComponent implements OnInit {
  recetas: any[] = [];
  recetaForm: FormGroup;
  mostrarForm = false;
  editando = false;
  recetaEditId: string | null = null;
  usuarioId = '';
  esMentor = false;
  nombreMentor = '';

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.recetaForm = this.fb.group({
      nombre: ['', Validators.required],
      ingredientes: [''],
      pasos: [''],
      nivel: ['facil'],
      tiempoPreparacion: [30],
      esPublica: [false]            // Checkbox para publicar como mentor
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

  guardarReceta() {
    if (this.recetaForm.invalid) return;
    const datos = { 
      ...this.recetaForm.value, 
      usuarioId: this.usuarioId,
      nombreMentor: this.esMentor ? this.nombreMentor : ''
    };
    if (this.editando && this.recetaEditId) {
      this.fs.update('recetas', this.recetaEditId, datos).then(() => { this.cancelar(); this.cargarRecetas(); });
    } else {
      this.fs.create('recetas', datos).then(() => { this.cancelar(); this.cargarRecetas(); });
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
    this.editando = false; this.recetaEditId = null;
    this.mostrarForm = false;
    this.recetaForm.reset({ nivel: 'facil', tiempoPreparacion: 30 });
  }

  abrirForm() { this.mostrarForm = true; }
  volver() { this.router.navigate(['/alimentarse']); }
}