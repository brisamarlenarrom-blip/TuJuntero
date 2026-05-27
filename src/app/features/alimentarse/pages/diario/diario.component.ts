// Componente Diario: registro diario de comidas
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
import { CardComponent } from '../../../../shared/ui/card/card.component'; // UI Card
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component'; // UI Badge


@Component({
  selector: 'app-diario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, EmptyStateComponent, SectionTitleComponent, CardComponent, BadgeComponent],
  templateUrl: './diario.component.html',
  styleUrl: './diario.component.css'
})
export class DiarioComponent implements OnInit {
  comidas: any[] = [];
  comidaForm: FormGroup;
  mostrarForm = false;
  usuarioId = '';
  hoy = new Date().toISOString().split('T')[0];

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.comidaForm = this.fb.group({
      tipo: ['almuerzo', Validators.required],
      descripcion: ['', Validators.required],
      satisfaccion: [3],
      fecha: [this.hoy]
    });
  }

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
    this.cargarComidas();
  }

  cargarComidas() {
    this.fs.getByField('comidas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.comidas = data.filter((c: any) => c.fecha === this.hoy);
    });
  }

  guardarComida() {
    if (this.comidaForm.invalid) return;
    const datos = { ...this.comidaForm.value, usuarioId: this.usuarioId };
    this.fs.create('comidas', datos).then(() => {
      this.mostrarForm = false;
      this.comidaForm.reset({ tipo: 'almuerzo', satisfaccion: 3, fecha: this.hoy });
      this.cargarComidas();
    });
  }

  eliminarComida(id: string) {
    if (confirm('¿Eliminar este registro?')) {
      this.fs.delete('comidas', id).then(() => this.cargarComidas());
    }
  }

  volver() {
    this.router.navigate(['/alimentarse']);
  }

  // Emojis de satisfacción
  getEmoji(valor: number): string {
    const emojis = ['😔', '😐', '🙂', '😊', '🤩'];
    return emojis[valor - 1] || '🙂';
  }
}
