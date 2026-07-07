// Dashboard de Alimentarse
// Muestra recetas públicas por categoría, buscador, favoritos
// y permite crear/editar/eliminar recetas según el rol del usuario.

import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-dashboard-alimentarse',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // Usuario
  usuarioId = '';
  nombreMentor = '';
  esMentor = false;
  esAdmin = false;
  puedeGestionar = false;

  // Buscador
  busqueda = '';

  // Recetas
  recetas: any[] = [];
  recetasFiltradas: any[] = [];

  // Formulario
  mostrarForm = false;
  editando = false;
  recetaEditId: string | null = null;
  recetaForm: FormGroup;

  // Estadísticas
  totalRecetas = 0;
  recetasFavoritas = 0;
  comidasHoy = 0;
  caloriasHoy = 0;

  // Categorías
  categoriaActiva = 'desayuno';

  categorias = [
    { valor: 'desayuno', label: 'Desayunos', icono: '🥣' },
    { valor: 'almuerzo', label: 'Almuerzos', icono: '🍽️' },
    { valor: 'merienda', label: 'Meriendas', icono: '☕' },
    { valor: 'cena', label: 'Cenas', icono: '🌙' }
  ];

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.recetaForm = this.fb.group({
      nombre: ['', Validators.required],
      categoria: ['desayuno', Validators.required],
      ingredientes: [''],
      pasos: [''],
      nivel: ['facil'],
      tiempoPreparacion: [30]
    });
  }

  async ngOnInit() {
    await this.auth.authReadyPromise;

    const usuario = await this.auth.refrescarUsuarioActual();

    if (usuario) {
      this.usuarioId = usuario.id;
      this.nombreMentor = usuario.nombre || '';
      this.esMentor = usuario.esMentor || usuario.rol === 'mentor';
      this.esAdmin = usuario.rol === 'admin';
      this.puedeGestionar = this.esMentor || this.esAdmin;
    }

    this.cargarRecetas();
    this.cargarComidasHoy();
  }

  cargarRecetas() {
    this.fs.getCollection('recetas').subscribe((data: any[]) => {
      this.recetas = data.filter(r => r.esPublica !== false);

      this.totalRecetas = this.recetas.length;

      this.recetasFavoritas = this.recetas.filter(r =>
        Array.isArray(r.favoritos) && r.favoritos.includes(this.usuarioId)
      ).length;

      this.aplicarFiltro();
    });
  }

  cargarComidasHoy() {
    const hoy = new Date().toISOString().split('T')[0];

    this.fs.getByField('comidas', 'usuarioId', this.usuarioId).subscribe(data => {
      const comidasDeHoy = data.filter((c: any) => c.fecha === hoy);

      this.comidasHoy = comidasDeHoy.length;

      this.caloriasHoy = comidasDeHoy.reduce(
        (acc: number, c: any) => acc + Number(c.calorias || 0),
        0
      );
    });
  }

  setCategoria(categoria: string) {
    this.categoriaActiva = categoria;
    this.aplicarFiltro();
  }

  aplicarFiltro() {
    const texto = this.busqueda.toLowerCase().trim();

    this.recetasFiltradas = this.recetas.filter(r => {
      const coincideCategoria = r.categoria === this.categoriaActiva;

      const coincideBusqueda =
        !texto ||
        r.nombre?.toLowerCase().includes(texto) ||
        r.ingredientes?.toLowerCase().includes(texto) ||
        r.nombreMentor?.toLowerCase().includes(texto);

      return coincideCategoria && coincideBusqueda;
    });
  }

  esFavorita(receta: any): boolean {
    return Array.isArray(receta.favoritos) &&
      receta.favoritos.includes(this.usuarioId);
  }

  async toggleFavorito(receta: any) {
    if (!this.usuarioId) return;

    if (this.esFavorita(receta)) {
      await this.fs.removeFromArray('recetas', receta.id, 'favoritos', this.usuarioId);
    } else {
      await this.fs.addToArray('recetas', receta.id, 'favoritos', this.usuarioId);
    }
  }

  puedeEditarReceta(receta: any): boolean {
    return this.esAdmin || receta.creadoPor === this.usuarioId;
  }

  abrirForm() {
    if (!this.puedeGestionar) return;

    this.editando = false;
    this.recetaEditId = null;
    this.mostrarForm = true;

    this.recetaForm.reset({
      nombre: '',
      categoria: this.categoriaActiva || 'desayuno',
      ingredientes: '',
      pasos: '',
      nivel: 'facil',
      tiempoPreparacion: 30
    });
  }

  guardarReceta() {
    if (this.recetaForm.invalid || !this.puedeGestionar) return;

    const datos = {
      ...this.recetaForm.value,
      usuarioId: this.usuarioId,
      creadoPor: this.usuarioId,
      nombreMentor: this.nombreMentor,
      esPublica: true,
      favoritos: this.editando ? undefined : [],
      fechaCreacion: this.editando ? undefined : new Date()
    };

    Object.keys(datos).forEach(key => {
      if (datos[key] === undefined) delete datos[key];
    });

    if (this.editando && this.recetaEditId) {
      this.fs.update('recetas', this.recetaEditId, datos).then(() => this.cancelar());
    } else {
      this.fs.create('recetas', datos).then(() => this.cancelar());
    }
  }

  editarReceta(receta: any) {
    if (!this.puedeEditarReceta(receta)) return;

    this.editando = true;
    this.recetaEditId = receta.id;
    this.mostrarForm = true;

    this.recetaForm.patchValue({
      nombre: receta.nombre || '',
      categoria: receta.categoria || 'desayuno',
      ingredientes: receta.ingredientes || '',
      pasos: receta.pasos || '',
      nivel: receta.nivel || 'facil',
      tiempoPreparacion: receta.tiempoPreparacion || 30
    });
  }

  eliminarReceta(id: string) {
    if (confirm('¿Eliminar esta receta?')) {
      this.fs.delete('recetas', id);
    }
  }

  cancelar() {
    this.editando = false;
    this.recetaEditId = null;
    this.mostrarForm = false;

    this.recetaForm.reset({
      nombre: '',
      categoria: 'desayuno',
      ingredientes: '',
      pasos: '',
      nivel: 'facil',
      tiempoPreparacion: 30
    });
  }

  irADiario() {
    this.router.navigate(['/alimentarse/diario']);
  }

  getNivelLabel(nivel: string): string {
    switch (nivel) {
      case 'facil': return 'Fácil';
      case 'medio': return 'Medio';
      case 'dificil': return 'Difícil';
      default: return 'Fácil';
    }
  }

  getCategoriaLabel(): string {
    const categoria = this.categorias.find(c => c.valor === this.categoriaActiva);
    return categoria ? categoria.label : 'recetas';
  }
}