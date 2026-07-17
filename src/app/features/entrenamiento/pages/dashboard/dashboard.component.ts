// Dashboard principal del módulo Entrenamiento.
// Muestra el progreso del usuario, sus rutinas personales,
// ejercicios publicados por mentores y accesos según el rol.

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-dashboard-entrenamiento',
  standalone: true,

  // FormsModule se utiliza para el buscador con ngModel.
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],

  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // ─────────────────────────────────────────────
  // DATOS DEL USUARIO
  // ─────────────────────────────────────────────

  usuarioId = '';
  nombreUsuario = '';

  esMentor = false;
  esAdmin = false;

  // Mentor y administrador pueden cargar ejercicios.
  puedeGestionarEjercicios = false;

  // ─────────────────────────────────────────────
  // BUSCADOR
  // ─────────────────────────────────────────────

  busqueda = '';

  // ─────────────────────────────────────────────
  // ESTADÍSTICAS
  // ─────────────────────────────────────────────

  totalRutinas = 0;
  entrenamientosHoy = 0;
  rutinasActivas = 0;
  rachaEntrenamiento = 0;

  // ─────────────────────────────────────────────
  // RUTINAS PERSONALES DEL USUARIO
  // ─────────────────────────────────────────────

  rutinas: any[] = [];

  // ─────────────────────────────────────────────
  // EJERCICIOS PUBLICADOS POR MENTORES
  // ─────────────────────────────────────────────

  ejercicios: any[] = [];
  ejerciciosFiltrados: any[] = [];

  // ─────────────────────────────────────────────
  // CATEGORÍAS
  // ─────────────────────────────────────────────

  categoriaActiva = 'fuerza';

  categorias = [
    {
      valor: 'fuerza',
      label: 'Fuerza',
      icono: '🏋️'
    },
    {
      valor: 'cardio',
      label: 'Cardio',
      icono: '❤️'
    },
    {
      valor: 'movilidad',
      label: 'Movilidad',
      icono: '🧘'
    },
    {
      valor: 'hiit',
      label: 'HIIT',
      icono: '⚡'
    }
  ];

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private router: Router
  ) {}

  // ─────────────────────────────────────────────
  // INICIALIZACIÓN
  // ─────────────────────────────────────────────

  async ngOnInit() {
    // Espera a que Firebase termine de recuperar la sesión.
    await this.auth.authReadyPromise;

    // Recupera nuevamente el usuario para obtener el rol actualizado.
    const usuario = await this.auth.refrescarUsuarioActual();

    if (usuario) {
      this.usuarioId = usuario.id;
      this.nombreUsuario = usuario.nombre || '';

      this.esMentor =
        usuario.esMentor === true ||
        usuario.rol === 'mentor';

      this.esAdmin =
        usuario.rol === 'admin';

      this.puedeGestionarEjercicios =
        this.esMentor ||
        this.esAdmin;
    }

    this.cargarResumen();
    this.cargarEjercicios();
  }

  // ─────────────────────────────────────────────
  // CARGA DEL RESUMEN
  // ─────────────────────────────────────────────

  cargarResumen() {
    if (!this.usuarioId) return;

    // Obtiene solamente las rutinas pertenecientes al usuario.
    this.fs
      .getByField('rutinas', 'usuarioId', this.usuarioId)
      .subscribe((data: any[]) => {

        this.totalRutinas = data.length;

        this.rutinasActivas = data.filter(
          (rutina: any) => rutina.estado === 'activa'
        ).length;

        // Muestra como máximo tres rutinas en el Dashboard.
        this.rutinas = data.slice(0, 3);
      });

    // Obtiene los entrenamientos registrados en la bitácora.
    this.fs
      .getByField('entrenamientos', 'usuarioId', this.usuarioId)
      .subscribe((data: any[]) => {

        const hoy = this.obtenerFechaLocal(new Date());

        this.entrenamientosHoy = data.filter(
          (entrenamiento: any) =>
            this.normalizarFecha(entrenamiento.fecha) === hoy
        ).length;

        this.rachaEntrenamiento =
          this.calcularRachaEntrenamiento(data);
      });
  }

  // ─────────────────────────────────────────────
  // CARGA DE EJERCICIOS DE LOS MENTORES
  // ─────────────────────────────────────────────

  cargarEjercicios() {
    this.fs
      .getCollection('ejercicios')
      .subscribe((data: any[]) => {

        // Se muestran los ejercicios públicos.
        // Los documentos viejos sin esPublico también se consideran visibles.
        this.ejercicios = data.filter(
          (ejercicio: any) => ejercicio.esPublico !== false
        );

        this.aplicarFiltro();
      });
  }

  // ─────────────────────────────────────────────
  // FILTROS
  // ─────────────────────────────────────────────

  setCategoria(categoria: string) {
    this.categoriaActiva = categoria;
    this.aplicarFiltro();
  }

  aplicarFiltro() {
    const texto = this.busqueda
      .toLowerCase()
      .trim();

    this.ejerciciosFiltrados = this.ejercicios.filter(
      (ejercicio: any) => {

        const categoriaEjercicio = String(
          ejercicio.categoria || ''
        ).toLowerCase();

        const coincideCategoria =
          categoriaEjercicio === this.categoriaActiva;

        const coincideBusqueda =
          !texto ||
          String(ejercicio.nombre || '')
            .toLowerCase()
            .includes(texto) ||

          String(ejercicio.descripcion || '')
            .toLowerCase()
            .includes(texto) ||

          String(ejercicio.grupoMuscular || '')
            .toLowerCase()
            .includes(texto) ||

          String(ejercicio.nombreMentor || '')
            .toLowerCase()
            .includes(texto);

        return coincideCategoria && coincideBusqueda;
      }
    );
  }

  // Devuelve el nombre visible de la categoría seleccionada.
  getCategoriaLabel(): string {
    const categoria = this.categorias.find(
      item => item.valor === this.categoriaActiva
    );

    return categoria
      ? categoria.label
      : 'Entrenamiento';
  }

  // Devuelve el icono correspondiente a cada categoría.
  getIconoCategoria(categoria: string): string {
    const encontrada = this.categorias.find(
      item => item.valor === categoria
    );

    return encontrada
      ? encontrada.icono
      : '🏋️';
  }

  // ─────────────────────────────────────────────
  // RACHA DE ENTRENAMIENTO
  // ─────────────────────────────────────────────

  calcularRachaEntrenamiento(
    entrenamientos: any[]
  ): number {

    if (!entrenamientos.length) return 0;

    // Guarda las fechas sin repetir.
    const fechasUnicas = new Set<string>();

    entrenamientos.forEach((entrenamiento: any) => {
      const fecha = this.normalizarFecha(
        entrenamiento.fecha
      );

      if (fecha) {
        fechasUnicas.add(fecha);
      }
    });

    let racha = 0;
    const fechaEvaluada = new Date();

    /*
     * Si hoy todavía no entrenó, también permite calcular
     * una racha que termine ayer.
     */
    const hoy = this.obtenerFechaLocal(fechaEvaluada);

    if (!fechasUnicas.has(hoy)) {
      fechaEvaluada.setDate(
        fechaEvaluada.getDate() - 1
      );
    }

    while (true) {
      const fechaTexto =
        this.obtenerFechaLocal(fechaEvaluada);

      if (!fechasUnicas.has(fechaTexto)) {
        break;
      }

      racha++;

      fechaEvaluada.setDate(
        fechaEvaluada.getDate() - 1
      );
    }

    return racha;
  }

  // Convierte diferentes formatos de fecha a YYYY-MM-DD.
  normalizarFecha(fecha: any): string {
    if (!fecha) return '';

    // Fecha guardada como texto.
    if (typeof fecha === 'string') {
      return fecha.split('T')[0];
    }

    // Timestamp de Firestore.
    if (fecha?.toDate) {
      return this.obtenerFechaLocal(
        fecha.toDate()
      );
    }

    // Objeto Date de JavaScript.
    if (fecha instanceof Date) {
      return this.obtenerFechaLocal(fecha);
    }

    return '';
  }

  // Evita problemas de zona horaria al obtener la fecha.
  obtenerFechaLocal(fecha: Date): string {
    const anio = fecha.getFullYear();

    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      fecha.getDate()
    ).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  // ─────────────────────────────────────────────
  // ESTADOS DE LAS RUTINAS
  // ─────────────────────────────────────────────

  getColorEstado(estado: string): string {
    switch (estado) {
      case 'activa':
        return '#4A9EFF';

      case 'pausada':
        return '#FBBF24';

      case 'completada':
        return '#34D399';

      default:
        return '#4A9EFF';
    }
  }

  getLabelEstado(estado: string): string {
    switch (estado) {
      case 'activa':
        return 'En progreso';

      case 'pausada':
        return 'Pendiente';

      case 'completada':
        return 'Completada';

      default:
        return estado || 'Activa';
    }
  }

  // ─────────────────────────────────────────────
  // NAVEGACIÓN
  // ─────────────────────────────────────────────

  verRutina() {
    this.router.navigate([
      '/entrenamiento/rutinas'
    ]);
  }

  // Solo mentor o administrador accederán a esta pantalla.
  administrarEjercicios() {
    if (!this.puedeGestionarEjercicios) return;

    this.router.navigate([
      '/entrenamiento/ejercicios'
    ]);
  }
}