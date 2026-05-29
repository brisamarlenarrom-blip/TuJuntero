import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-dashboard-alimentarse',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // ── Usuario ──────────────────────────────────────────
  usuarioId = '';

  // ── Stats ────────────────────────────────────────────
  totalRecetas = 0;
  comidasHoy = 0;
  recetasFavoritas = 0;
  caloriasHoy = 0;

  // ── Recetas recientes ─────────────────────────────────
  recetasRecientes: any[] = [];

  // ── Categoría activa ─────────────────────────────────
  categoriaActiva = 'Desayunos';
  categorias = [
    { label: 'Desayunos', icono: '🥞' },
    { label: 'Almuerzos', icono: '🍝' },
    { label: 'Meriendas', icono: '☕' },
    { label: 'Cenas',     icono: '🍲' }
  ];

  constructor(private fs: FirestoreService, private auth: AuthService) {}

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
    this.cargarResumen();
  }

  cargarResumen() {
    this.fs.getByField('recetas', 'usuarioId', this.usuarioId).subscribe(data => {
      this.totalRecetas = data.length;
      this.recetasFavoritas = data.filter((r: any) => r.favorita).length;
      this.recetasRecientes = data.slice(0, 3);
    });

    const hoy = new Date().toISOString().split('T')[0];
    this.fs.getByField('comidas', 'usuarioId', this.usuarioId).subscribe(data => {
      const hoyData = data.filter((c: any) => c.fecha === hoy);
      this.comidasHoy = hoyData.length;
      this.caloriasHoy = hoyData.reduce((acc: number, c: any) => acc + (c.calorias || 0), 0);
    });
  }

  setCategoria(cat: string) {
    this.categoriaActiva = cat;
  }
}