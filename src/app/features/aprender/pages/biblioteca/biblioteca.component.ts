// Componente Biblioteca: CRUD de libros con Firebase Firestore
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
import { EmptyStateComponent } from "../../../../shared/ui/empty-state/empty-state.component";              // Autenticación

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, EmptyStateComponent],
  templateUrl: './biblioteca.component.html',
  styleUrl: './biblioteca.component.css'
})
export class BibliotecaComponent implements OnInit {
  libros: any[] = [];
  libroForm: FormGroup;
  mostrarForm = false;
  editando = false;
  libroEditId: string | null = null;
  usuarioId = '';

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.libroForm = this.fb.group({
      titulo: ['', Validators.required],
      autor: [''],
      estadoLectura: ['quiero_leer'],
      puntuacion: [0],
      resenia: ['']
    });
  }

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
    this.cargarLibros();
  }

  cargarLibros() {
    this.fs.getByField('libros', 'usuarioId', this.usuarioId).subscribe(data => {
      this.libros = data;
    });
  }

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

  abrirForm() {
    this.mostrarForm = true;
  }

  volver() {
    this.router.navigate(['/aprender']);
  }
}