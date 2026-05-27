// Componente Tareas: CRUD con Firebase Firestore
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { FirestoreService } from '../../../../core/firestore.service';  // Base de datos
import { AuthService } from '../../../../core/auth.service';
import { SectionTitleComponent } from "../../../../shared/ui/section-title/section-title.component";
import { EmptyStateComponent } from "../../../../shared/ui/empty-state/empty-state.component";              // Autenticación
import { CardComponent } from '../../../../shared/ui/card/card.component'; // UI Card
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component'; // UI Badge


@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, 
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, 
    SectionTitleComponent, EmptyStateComponent, CardComponent, BadgeComponent],
  templateUrl: './tareas.component.html',
  styleUrl: './tareas.component.css'
})
export class TareasComponent implements OnInit {
  tareas: any[] = [];
  tareaForm: FormGroup;
  mostrarForm = false;
  editando = false;
  tareaEditId: string | null = null;
  usuarioId = '';

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.tareaForm = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: [''],
      tipo: ['tarea', Validators.required],
      fechaLimite: [''],
      prioridad: ['media'],
      estado: ['pendiente']
    });
  }

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
    this.cargarTareas();
  }

  cargarTareas() {
    this.fs.getByField('tareas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.tareas = data;
    });
  }

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