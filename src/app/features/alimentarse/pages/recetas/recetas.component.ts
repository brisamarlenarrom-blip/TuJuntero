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

type CategoriaReceta = 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | '';

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EmptyStateComponent],
  templateUrl: './recetas.component.html',
  styleUrl: './recetas.component.css'
})
export class RecetasComponent implements OnInit {

  usuarioId = '';
  busqueda = '';

  recetasFavoritas: any[] = [];
  recetasFiltradas: any[] = [];

  categoriaActiva: CategoriaReceta = '';

  // Receta seleccionada para ver detalle
  recetaDetalle: any | null = null;

  categorias = [
    { valor: 'desayuno', label: 'Desayuno', icono: '🥣' },
    { valor: 'almuerzo', label: 'Almuerzo', icono: '🍽️' },
    { valor: 'merienda', label: 'Merienda', icono: '☕' },
    { valor: 'cena', label: 'Cena', icono: '🌙' }
  ];

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();

    if (usuario) {
      this.usuarioId = usuario.id;
    }

    this.cargarFavoritos();
  }

  cargarFavoritos() {
    this.fs.getCollection('recetas').subscribe((data: any[]) => {
      this.recetasFavoritas = data.filter(r =>
        Array.isArray(r.favoritos) &&
        r.favoritos.includes(this.usuarioId)
      );

      this.aplicarFiltro();
    });
  }

  seleccionarCategoria(categoria: string) {
    this.categoriaActiva =
      this.categoriaActiva === categoria ? '' : categoria as CategoriaReceta;

    this.aplicarFiltro();
  }

  aplicarFiltro() {
    const texto = this.busqueda.toLowerCase().trim();

    this.recetasFiltradas = this.recetasFavoritas.filter(r => {
      const coincideCategoria =
        !this.categoriaActiva || r.categoria === this.categoriaActiva;

      const coincideBusqueda =
        !texto ||
        r.nombre?.toLowerCase().includes(texto) ||
        r.ingredientes?.toLowerCase().includes(texto) ||
        r.pasos?.toLowerCase().includes(texto) ||
        r.nombreMentor?.toLowerCase().includes(texto);

      return coincideCategoria && coincideBusqueda;
    });
  }

  // Abre el modal con el detalle completo
  verDetalle(receta: any) {
    this.recetaDetalle = receta;
  }

  // Cierra el modal de detalle
  cerrarDetalle() {
    this.recetaDetalle = null;
  }

  async quitarFavorito(receta: any) {
    if (!this.usuarioId) return;

    await this.fs.removeFromArray(
      'recetas',
      receta.id,
      'favoritos',
      this.usuarioId
    );
  }

  volver() {
    this.router.navigate(['/alimentarse']);
  }

  getNivelColor(nivel: string): string {
    switch (nivel) {
      case 'facil': return '#34D399';
      case 'medio': return '#FBBF24';
      case 'dificil': return '#EF4444';
      default: return '#34D399';
    }
  }

  getNivelLabel(nivel: string): string {
    switch (nivel) {
      case 'facil': return 'Fácil';
      case 'medio': return 'Medio';
      case 'dificil': return 'Difícil';
      default: return nivel || 'Fácil';
    }
  }
}