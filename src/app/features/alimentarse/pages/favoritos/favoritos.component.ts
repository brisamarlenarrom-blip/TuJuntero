// Componente Favoritos
// Muestra solo las recetas que el usuario guardó como favoritas.
// Permite filtrar por categoría, buscar recetas y ver el detalle completo.

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';

type CategoriaReceta =
  | 'desayuno'
  | 'almuerzo'
  | 'merienda'
  | 'cena'
  | '';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    EmptyStateComponent
  ],
  templateUrl: './favoritos.component.html',
  styleUrl: './favoritos.component.css'
})
export class FavoritosComponent implements OnInit {

  usuarioId = '';
  busqueda = '';

  recetasFavoritas: any[] = [];
  recetasFiltradas: any[] = [];

  categoriaActiva: CategoriaReceta = '';

  recetaDetalle: any | null = null;

  categorias = [
    {
      valor: 'desayuno',
      label: 'Desayuno',
      icono: '🥣'
    },
    {
      valor: 'almuerzo',
      label: 'Almuerzo',
      icono: '🍽️'
    },
    {
      valor: 'merienda',
      label: 'Merienda',
      icono: '☕'
    },
    {
      valor: 'cena',
      label: 'Cena',
      icono: '🌙'
    }
  ];

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const usuario = this.auth.getUsuarioActual();

    if (usuario) {
      this.usuarioId = usuario.id;
    }

    this.cargarFavoritos();
  }

  cargarFavoritos(): void {
    this.fs.getCollection('recetas').subscribe((data: any[]) => {

      this.recetasFavoritas = data.filter((receta: any) =>
        Array.isArray(receta.favoritos) &&
        receta.favoritos.includes(this.usuarioId)
      );

      this.aplicarFiltro();
    });
  }

  seleccionarCategoria(categoria: string): void {
    this.categoriaActiva =
      this.categoriaActiva === categoria
        ? ''
        : categoria as CategoriaReceta;

    this.aplicarFiltro();
  }

  aplicarFiltro(): void {
    const texto = this.busqueda.toLowerCase().trim();

    this.recetasFiltradas = this.recetasFavoritas.filter((receta: any) => {

      const coincideCategoria =
        !this.categoriaActiva ||
        receta.categoria === this.categoriaActiva;

      const coincideBusqueda =
        !texto ||
        receta.nombre?.toLowerCase().includes(texto) ||
        receta.ingredientes?.toLowerCase().includes(texto) ||
        receta.pasos?.toLowerCase().includes(texto) ||
        receta.nombreMentor?.toLowerCase().includes(texto);

      return coincideCategoria && coincideBusqueda;
    });
  }

  verDetalle(receta: any): void {
    this.recetaDetalle = receta;
  }

  cerrarDetalle(): void {
    this.recetaDetalle = null;
  }

  async quitarFavorito(receta: any): Promise<void> {
    if (!this.usuarioId || !receta?.id) {
      return;
    }

    await this.fs.removeFromArray(
      'recetas',
      receta.id,
      'favoritos',
      this.usuarioId
    );
  }

  volver(): void {
    this.router.navigate(['/alimentarse']);
  }

  getNivelColor(nivel: string): string {
    switch (nivel) {
      case 'facil':
        return '#34D399';

      case 'medio':
        return '#FBBF24';

      case 'dificil':
        return '#EF4444';

      default:
        return '#34D399';
    }
  }

  getNivelLabel(nivel: string): string {
    switch (nivel) {
      case 'facil':
        return 'Fácil';

      case 'medio':
        return 'Medio';

      case 'dificil':
        return 'Difícil';

      default:
        return nivel || 'Fácil';
    }
  }
}