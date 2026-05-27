// Componente Bitácora: registro diario de entrenamientos
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
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SectionTitleComponent } from '../../../../shared/ui/section-title/section-title.component';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, EmptyStateComponent, SectionTitleComponent],
  templateUrl: './bitacora.component.html',
  styleUrl: './bitacora.component.css'
})
export class BitacoraComponent implements OnInit {
  entrenamientos: any[] = [];
  entrenoForm: FormGroup;
  mostrarForm = false;
  usuarioId = '';
  hoy = new Date().toISOString().split('T')[0];

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.entrenoForm = this.fb.group({
      rutina: ['', Validators.required],
      duracion: [45],
      intensidad: ['media'],
      sensacion: [''],
      fecha: [this.hoy]
    });
  }

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
    this.cargarEntrenamientos();
  }

  cargarEntrenamientos() {
    this.fs.getByField('entrenamientos', 'usuarioId', this.usuarioId).subscribe(data => {
      this.entrenamientos = data.filter((e: any) => e.fecha === this.hoy);
    });
  }

  guardarEntreno() {
    if (this.entrenoForm.invalid) return;
    const datos = { ...this.entrenoForm.value, usuarioId: this.usuarioId };
    this.fs.create('entrenamientos', datos).then(() => {
      this.mostrarForm = false;
      this.entrenoForm.reset({ duracion: 45, intensidad: 'media', fecha: this.hoy });
      this.cargarEntrenamientos();
    });
  }

  eliminarEntreno(id: string) {
    if (confirm('¿Eliminar este registro?')) {
      this.fs.delete('entrenamientos', id).then(() => this.cargarEntrenamientos());
    }
  }

  volver() { this.router.navigate(['/entrenamiento']); }
}