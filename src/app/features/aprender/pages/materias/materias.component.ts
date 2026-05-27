// Componente Materias: CRUD con Firebase Firestore
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { FirestoreService } from '../../../../core/firestore.service';                         // Base de datos
import { AuthService } from '../../../../core/auth.service';                                   // Autenticación
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';                 // UI Kit: badge
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SectionTitleComponent } from "../../../../shared/ui/section-title/section-title.component"; // UI Kit: empty state
import { CardComponent } from '../../../../shared/ui/card/card.component'; // UI Card

@Component({
  selector: 'app-materias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, BadgeComponent, EmptyStateComponent, SectionTitleComponent, CardComponent],
  templateUrl: './materias.component.html',
  styleUrl: './materias.component.css'
})
export class MateriasComponent implements OnInit {
  materias: any[] = [];
  materiaForm: FormGroup;
  mostrarForm = false;
  editando = false;
  materiaEditId: string | null = null;
  usuarioId = '';

  constructor(
    private api: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.materiaForm = this.fb.group({
      nombre: ['', Validators.required],
      estado: ['cursando', Validators.required],
      diaHorario: [''],
      fechaLlamado: [''],
      fechaExamen: ['']
    });
  }

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
    this.cargarMaterias();
  }

  cargarMaterias() {
    this.api.getByField('materias', 'usuarioId', this.usuarioId).subscribe(data => {
      this.materias = data;
    });
  }

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

  abrirForm() {
    this.mostrarForm = true;
  }

  volver() {
    this.router.navigate(['/aprender']);
  }
}