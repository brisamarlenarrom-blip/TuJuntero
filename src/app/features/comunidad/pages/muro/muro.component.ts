// Componente Muro: publicaciones de la comunidad
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SectionTitleComponent } from '../../../../shared/ui/section-title/section-title.component';
import { CardComponent } from '../../../../shared/ui/card/card.component'; // UI Card

@Component({
  selector: 'app-muro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, EmptyStateComponent, SectionTitleComponent, CardComponent],
  templateUrl: './muro.component.html',
  styleUrl: './muro.component.css'
})
export class MuroComponent implements OnInit {
  posts: any[] = [];
  postForm: FormGroup;
  mostrarForm = false;
  usuarioId = '';
  usuarioNombre = '';

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.postForm = this.fb.group({
      contenido: ['', Validators.required]
    });
  }

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) {
      this.usuarioId = usuario.id;
      this.usuarioNombre = usuario.nombre;
    }
    this.cargarPosts();
  }

  cargarPosts() {
    this.fs.getByField('posts', 'tipo', 'post').subscribe(data => {
      this.posts = data.sort((a: any, b: any) => b.fecha.localeCompare(a.fecha));
    });
  }

  guardarPost() {
    if (this.postForm.invalid) return;
    const datos = {
      contenido: this.postForm.value.contenido,
      usuarioId: this.usuarioId,
      usuarioNombre: this.usuarioNombre,
      fecha: new Date().toISOString(),
      tipo: 'post',
      likes: 0
    };
    this.fs.create('posts', datos).then(() => {
      this.mostrarForm = false;
      this.postForm.reset();
      this.cargarPosts();
    });
  }

  darLike(post: any) {
    this.fs.update('posts', post.id, { likes: post.likes + 1 }).then(() => this.cargarPosts());
  }

  eliminarPost(id: string) {
    if (confirm('¿Eliminar esta publicación?')) {
      this.fs.delete('posts', id).then(() => this.cargarPosts());
    }
  }

  volver() { this.router.navigate(['/comunidad']); }

  // Fecha relativa
  tiempoRelativo(fecha: string): string {
    const ahora = new Date();
    const entonces = new Date(fecha);
    const minutos = Math.floor((ahora.getTime() - entonces.getTime()) / 60000);
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (minutos < 1440) return `Hace ${Math.floor(minutos / 60)} h`;
    return `Hace ${Math.floor(minutos / 1440)} d`;
  }
}