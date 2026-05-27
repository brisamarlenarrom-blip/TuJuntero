// Componente Rutinas: CRUD con Firebase Firestore
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SectionTitleComponent } from '../../../../shared/ui/section-title/section-title.component';

@Component({
  selector: 'app-rutinas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, BadgeComponent, EmptyStateComponent, SectionTitleComponent],
  templateUrl: './rutinas.component.html',
  styleUrl: './rutinas.component.css'
})
export class RutinasComponent implements OnInit {
  rutinas: any[] = [];
  rutinaForm: FormGroup;
  mostrarForm = false;
  editando = false;
  rutinaEditId: string | null = null;
  usuarioId = '';

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.rutinaForm = this.fb.group({
      nombre: ['', Validators.required],
      objetivo: ['fuerza'],
      diasSemana: [''],
      duracionEstimada: [45],
      calentamiento: [''],     // 🔥 Calentamiento
      ejercicios: [''],        // 💪 Ejercicios principales
      estiramiento: ['']       // 🧘 Estiramiento
    });
  }

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
    this.cargarRutinas();
  }

  cargarRutinas() {
    this.fs.getByField('rutinas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.rutinas = data;
    });
  }

  guardarRutina() {
    if (this.rutinaForm.invalid) return;
    const datos = { ...this.rutinaForm.value, usuarioId: this.usuarioId };
    if (this.editando && this.rutinaEditId) {
      this.fs.update('rutinas', this.rutinaEditId, datos).then(() => { this.cancelar(); this.cargarRutinas(); });
    } else {
      this.fs.create('rutinas', datos).then(() => { this.cancelar(); this.cargarRutinas(); });
    }
  }

  editarRutina(rutina: any) {
    this.editando = true;
    this.rutinaEditId = rutina.id;
    this.mostrarForm = true;
    this.rutinaForm.patchValue(rutina);
  }

  eliminarRutina(id: string) {
    if (confirm('¿Eliminar esta rutina?')) {
      this.fs.delete('rutinas', id).then(() => this.cargarRutinas());
    }
  }

  cancelar() {
    this.editando = false; this.rutinaEditId = null;
    this.mostrarForm = false;
    this.rutinaForm.reset({ objetivo: 'fuerza', duracionEstimada: 45 });
  }

  abrirForm() { this.mostrarForm = true; }
  volver() { this.router.navigate(['/entrenamiento']); }
}