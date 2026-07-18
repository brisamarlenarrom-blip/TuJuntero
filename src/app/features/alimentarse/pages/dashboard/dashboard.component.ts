// ==========================================================
// DASHBOARD DEL MÓDULO ALIMENTARSE
// ==========================================================
//
// Responsabilidades principales:
//
// - Mostrar recetas públicas.
// - Filtrar recetas por categoría y búsqueda.
// - Permitir marcar recetas como favoritas.
// - Permitir crear, editar y eliminar recetas según el rol.
// - Mostrar estadísticas básicas del usuario.
// - Navegar hacia el diario de comidas.
//
// ==========================================================

import {
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  Router,
  RouterModule
} from '@angular/router';

import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Subject,
  takeUntil
} from 'rxjs';


// ==========================================================
// SERVICIOS PROPIOS
// ==========================================================

import {
  FirestoreService
} from '../../../../core/firestore.service';

import {
  AuthService
} from '../../../../core/auth.service';


// ==========================================================
// TIPOS DEL COMPONENTE
// ==========================================================

/**
 * Categorías válidas para las recetas.
 */
type CategoriaReceta =
  | 'desayuno'
  | 'almuerzo'
  | 'merienda'
  | 'cena';


/**
 * Niveles válidos para una receta.
 */
type NivelReceta =
  | 'facil'
  | 'medio'
  | 'dificil';


/**
 * Estructura de cada categoría mostrada en pantalla.
 */
interface CategoriaAlimentarse {
  valor: CategoriaReceta;
  label: string;
  icono: string;
}


/**
 * Estructura principal de una receta.
 */
interface Receta {
  id: string;
  nombre: string;
  categoria: CategoriaReceta;
  ingredientes: string;
  pasos: string;
  nivel: NivelReceta;
  tiempoPreparacion: number;

  usuarioId?: string;
  creadoPor?: string;
  nombreMentor?: string;

  esPublica?: boolean;
  favoritos?: string[];
  fechaCreacion?: Date | string | unknown;
}


/**
 * Estructura de una comida registrada.
 */
interface ComidaRegistrada {
  id?: string;
  usuarioId: string;
  fecha: string;
  calorias?: number | string;
}


/**
 * Estructura tipada del formulario.
 */
interface FormularioReceta {
  nombre: FormControl<string>;
  categoria: FormControl<CategoriaReceta>;
  ingredientes: FormControl<string>;
  pasos: FormControl<string>;
  nivel: FormControl<NivelReceta>;
  tiempoPreparacion: FormControl<number>;
}


/**
 * Datos utilizados al crear o actualizar una receta.
 */
interface DatosReceta {
  nombre: string;
  categoria: CategoriaReceta;
  ingredientes: string;
  pasos: string;
  nivel: NivelReceta;
  tiempoPreparacion: number;

  usuarioId: string;
  creadoPor: string;
  nombreMentor: string;
  esPublica: boolean;

  favoritos?: string[];
  fechaCreacion?: Date;
}


// ==========================================================
// COMPONENTE
// ==========================================================

@Component({
  selector: 'app-dashboard-alimentarse',

  standalone: true,

  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule
  ],

  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent
  implements OnInit, OnDestroy {

  // ========================================================
  // INYECCIÓN DE DEPENDENCIAS
  // ========================================================

  private readonly firestoreService =
    inject(FirestoreService);

  private readonly authService =
    inject(AuthService);

  private readonly fb =
    inject(NonNullableFormBuilder);

  private readonly router =
    inject(Router);


  // ========================================================
  // CONTROL DE SUSCRIPCIONES
  // ========================================================

  /**
   * Permite cerrar automáticamente las suscripciones
   * cuando el componente se destruye.
   */
  private readonly destroy$ =
    new Subject<void>();


  // ========================================================
  // USUARIO Y PERMISOS
  // ========================================================

  usuarioId = '';

  nombreMentor = '';

  esMentor = false;

  esAdmin = false;

  puedeGestionar = false;


  // ========================================================
  // ESTADO DE CARGA Y MENSAJES
  // ========================================================

  cargandoRecetas = true;

  cargandoComidas = true;

  guardandoReceta = false;

  mensajeError = '';


  // ========================================================
  // BUSCADOR Y FILTROS
  // ========================================================

  busqueda = '';

  categoriaActiva: CategoriaReceta =
    'desayuno';


  readonly categorias: CategoriaAlimentarse[] = [
    {
      valor: 'desayuno',
      label: 'Desayunos',
      icono: '🥣'
    },
    {
      valor: 'almuerzo',
      label: 'Almuerzos',
      icono: '🍽️'
    },
    {
      valor: 'merienda',
      label: 'Meriendas',
      icono: '☕'
    },
    {
      valor: 'cena',
      label: 'Cenas',
      icono: '🌙'
    }
  ];


  // ========================================================
  // RECETAS
  // ========================================================

  recetas: Receta[] = [];

  recetasFiltradas: Receta[] = [];


  // ========================================================
  // FORMULARIO
  // ========================================================

  mostrarForm = false;

  editando = false;

  recetaEditId: string | null = null;


  readonly recetaForm: FormGroup<FormularioReceta> =
    this.fb.group({

      nombre: this.fb.control('', {
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100)
        ]
      }),

      categoria:
        this.fb.control<CategoriaReceta>(
          'desayuno'
        ),

      ingredientes: this.fb.control('', {
        validators: [
          Validators.maxLength(1500)
        ]
      }),

      pasos: this.fb.control('', {
        validators: [
          Validators.maxLength(3000)
        ]
      }),

      nivel:
        this.fb.control<NivelReceta>(
          'facil'
        ),

      tiempoPreparacion: this.fb.control(30, {
        validators: [
          Validators.required,
          Validators.min(1),
          Validators.max(600)
        ]
      })
    });


  // ========================================================
  // ESTADÍSTICAS
  // ========================================================

  totalRecetas = 0;

  recetasFavoritas = 0;

  comidasHoy = 0;

  caloriasHoy = 0;


  // ========================================================
  // CICLO DE VIDA
  // ========================================================

  async ngOnInit(): Promise<void> {
    await this.inicializarUsuario();

    this.cargarRecetas();

    if (this.usuarioId) {
      this.cargarComidasHoy();
    } else {
      this.cargandoComidas = false;
    }
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  // ========================================================
  // INICIALIZACIÓN DEL USUARIO
  // ========================================================

  /**
   * Espera a que Firebase finalice la autenticación
   * y recupera los permisos actualizados del usuario.
   */
  private async inicializarUsuario(): Promise<void> {
    try {
      await this.authService.authReadyPromise;

      const usuario =
        await this.authService.refrescarUsuarioActual();

      if (!usuario) {
        return;
      }

      this.usuarioId =
        usuario.id ?? '';

      this.nombreMentor =
        usuario.nombre ?? '';

      this.esMentor =
        Boolean(
          usuario.esMentor ||
          usuario.rol === 'mentor'
        );

      this.esAdmin =
        usuario.rol === 'admin';

      this.puedeGestionar =
        this.esMentor ||
        this.esAdmin;

    } catch (error: unknown) {
      console.error(
        'Error al inicializar el usuario:',
        error
      );

      this.mensajeError =
        'No fue posible recuperar los datos del usuario.';
    }
  }


  // ========================================================
  // CARGA DE RECETAS
  // ========================================================

  /**
   * Escucha en tiempo real la colección de recetas.
   */
  cargarRecetas(): void {
    this.cargandoRecetas = true;

    this.firestoreService
      .getCollection('recetas')
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data: unknown[]) => {
          this.recetas =
            data
              .map((item) =>
                this.normalizarReceta(item)
              )
              .filter((receta) =>
                receta.esPublica !== false
              );

          this.actualizarEstadisticasRecetas();

          this.aplicarFiltro();

          this.cargandoRecetas = false;
        },

        error: (error: unknown) => {
          console.error(
            'Error al cargar recetas:',
            error
          );

          this.recetas = [];
          this.recetasFiltradas = [];
          this.totalRecetas = 0;
          this.recetasFavoritas = 0;
          this.cargandoRecetas = false;

          this.mensajeError =
            'No fue posible cargar las recetas.';
        }
      });
  }


  /**
   * Convierte los datos recibidos desde Firestore
   * en una receta con valores seguros.
   */
  private normalizarReceta(
    item: unknown
  ): Receta {

    const receta =
      item as Partial<Receta>;

    return {
      id:
        String(receta.id ?? ''),

      nombre:
        String(receta.nombre ?? 'Receta sin nombre'),

      categoria:
        this.esCategoriaValida(receta.categoria)
          ? receta.categoria
          : 'desayuno',

      ingredientes:
        String(receta.ingredientes ?? ''),

      pasos:
        String(receta.pasos ?? ''),

      nivel:
        this.esNivelValido(receta.nivel)
          ? receta.nivel
          : 'facil',

      tiempoPreparacion:
        Number(receta.tiempoPreparacion ?? 30),

      usuarioId:
        receta.usuarioId,

      creadoPor:
        receta.creadoPor,

      nombreMentor:
        receta.nombreMentor,

      esPublica:
        receta.esPublica !== false,

      favoritos:
        Array.isArray(receta.favoritos)
          ? receta.favoritos
          : [],

      fechaCreacion:
        receta.fechaCreacion
    };
  }


  // ========================================================
  // ESTADÍSTICAS DE RECETAS
  // ========================================================

  private actualizarEstadisticasRecetas(): void {
    this.totalRecetas =
      this.recetas.length;

    this.recetasFavoritas =
      this.recetas.filter((receta) =>
        this.esFavorita(receta)
      ).length;
  }


  // ========================================================
  // CARGA DEL DIARIO
  // ========================================================

  /**
   * Recupera las comidas registradas por el usuario
   * y calcula las estadísticas del día actual.
   */
  cargarComidasHoy(): void {
    this.cargandoComidas = true;

    const hoy =
      this.obtenerFechaLocalActual();

    this.firestoreService
      .getByField(
        'comidas',
        'usuarioId',
        this.usuarioId
      )
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data: unknown[]) => {
          const comidas =
            data as ComidaRegistrada[];

          const comidasDeHoy =
            comidas.filter((comida) =>
              comida.fecha === hoy
            );

          this.comidasHoy =
            comidasDeHoy.length;

          this.caloriasHoy =
            comidasDeHoy.reduce(
              (
                acumulador: number,
                comida: ComidaRegistrada
              ) =>
                acumulador +
                Number(comida.calorias ?? 0),
              0
            );

          this.cargandoComidas = false;
        },

        error: (error: unknown) => {
          console.error(
            'Error al cargar las comidas del día:',
            error
          );

          this.comidasHoy = 0;
          this.caloriasHoy = 0;
          this.cargandoComidas = false;
        }
      });
  }


  /**
   * Obtiene la fecha local en formato YYYY-MM-DD.
   *
   * Se evita utilizar directamente toISOString(),
   * porque utiliza horario UTC y podría cambiar de día
   * según la zona horaria del usuario.
   */
  private obtenerFechaLocalActual(): string {
    const fecha = new Date();

    const anio =
      fecha.getFullYear();

    const mes =
      String(fecha.getMonth() + 1)
        .padStart(2, '0');

    const dia =
      String(fecha.getDate())
        .padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }


  // ========================================================
  // FILTROS
  // ========================================================

  setCategoria(
    categoria: CategoriaReceta
  ): void {
    this.categoriaActiva =
      categoria;

    this.aplicarFiltro();
  }


  /**
   * Filtra por categoría, nombre, ingredientes
   * y nombre del mentor.
   */
  aplicarFiltro(): void {
    const texto =
      this.normalizarTexto(this.busqueda);

    this.recetasFiltradas =
      this.recetas.filter((receta) => {

        const coincideCategoria =
          receta.categoria ===
          this.categoriaActiva;

        const coincideBusqueda =
          !texto ||
          this.normalizarTexto(
            receta.nombre
          ).includes(texto) ||
          this.normalizarTexto(
            receta.ingredientes
          ).includes(texto) ||
          this.normalizarTexto(
            receta.nombreMentor ?? ''
          ).includes(texto);

        return (
          coincideCategoria &&
          coincideBusqueda
        );
      });
  }


  /**
   * Convierte un texto a minúsculas y elimina tildes.
   *
   * Permite que una búsqueda como "facil" encuentre
   * también valores escritos como "fácil".
   */
  private normalizarTexto(
    valor: string
  ): string {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .trim();
  }


  // ========================================================
  // FAVORITOS
  // ========================================================

  esFavorita(
    receta: Receta
  ): boolean {
    return Boolean(
      this.usuarioId &&
      Array.isArray(receta.favoritos) &&
      receta.favoritos.includes(
        this.usuarioId
      )
    );
  }


  async toggleFavorito(
    receta: Receta
  ): Promise<void> {
    if (
      !this.usuarioId ||
      !receta.id
    ) {
      return;
    }

    try {
      if (this.esFavorita(receta)) {
        await this.firestoreService
          .removeFromArray(
            'recetas',
            receta.id,
            'favoritos',
            this.usuarioId
          );
      } else {
        await this.firestoreService
          .addToArray(
            'recetas',
            receta.id,
            'favoritos',
            this.usuarioId
          );
      }

    } catch (error: unknown) {
      console.error(
        'Error al actualizar favorito:',
        error
      );

      this.mensajeError =
        'No fue posible actualizar la receta favorita.';
    }
  }


  // ========================================================
  // PERMISOS
  // ========================================================

  puedeEditarReceta(
    receta: Receta
  ): boolean {
    return (
      this.esAdmin ||
      receta.creadoPor === this.usuarioId
    );
  }


  puedeEliminarReceta(
    receta: Receta
  ): boolean {
    return this.puedeEditarReceta(receta);
  }


  // ========================================================
  // APERTURA Y CIERRE DEL FORMULARIO
  // ========================================================

  abrirForm(): void {
    if (!this.puedeGestionar) {
      return;
    }

    this.editando = false;

    this.recetaEditId = null;

    this.mostrarForm = true;

    this.recetaForm.reset({
      nombre: '',
      categoria: this.categoriaActiva,
      ingredientes: '',
      pasos: '',
      nivel: 'facil',
      tiempoPreparacion: 30
    });
  }


  cancelar(): void {
    this.editando = false;

    this.recetaEditId = null;

    this.mostrarForm = false;

    this.mensajeError = '';

    this.recetaForm.reset({
      nombre: '',
      categoria: 'desayuno',
      ingredientes: '',
      pasos: '',
      nivel: 'facil',
      tiempoPreparacion: 30
    });
  }


  // ========================================================
  // CREACIÓN Y ACTUALIZACIÓN
  // ========================================================

  async guardarReceta(): Promise<void> {
    if (
      this.recetaForm.invalid ||
      !this.puedeGestionar ||
      this.guardandoReceta
    ) {
      this.recetaForm.markAllAsTouched();
      return;
    }

    this.guardandoReceta = true;

    this.mensajeError = '';

    const valores =
      this.recetaForm.getRawValue();

    const datosBase: DatosReceta = {
      nombre:
        valores.nombre.trim(),

      categoria:
        valores.categoria,

      ingredientes:
        valores.ingredientes.trim(),

      pasos:
        valores.pasos.trim(),

      nivel:
        valores.nivel,

      tiempoPreparacion:
        Number(valores.tiempoPreparacion),

      usuarioId:
        this.usuarioId,

      creadoPor:
        this.usuarioId,

      nombreMentor:
        this.nombreMentor,

      esPublica:
        true
    };

    try {
      if (
        this.editando &&
        this.recetaEditId
      ) {
        await this.firestoreService.update(
          'recetas',
          this.recetaEditId,
          datosBase
        );

      } else {
        const nuevaReceta: DatosReceta = {
          ...datosBase,
          favoritos: [],
          fechaCreacion: new Date()
        };

        await this.firestoreService.create(
          'recetas',
          nuevaReceta
        );
      }

      this.cancelar();

    } catch (error: unknown) {
      console.error(
        'Error al guardar la receta:',
        error
      );

      this.mensajeError =
        this.editando
          ? 'No fue posible actualizar la receta.'
          : 'No fue posible crear la receta.';

    } finally {
      this.guardandoReceta = false;
    }
  }


  // ========================================================
  // EDICIÓN
  // ========================================================

  editarReceta(
    receta: Receta
  ): void {
    if (!this.puedeEditarReceta(receta)) {
      return;
    }

    this.editando = true;

    this.recetaEditId =
      receta.id;

    this.mostrarForm = true;

    this.mensajeError = '';

    this.recetaForm.patchValue({
      nombre:
        receta.nombre,

      categoria:
        receta.categoria,

      ingredientes:
        receta.ingredientes,

      pasos:
        receta.pasos,

      nivel:
        receta.nivel,

      tiempoPreparacion:
        receta.tiempoPreparacion
    });
  }


  // ========================================================
  // ELIMINACIÓN
  // ========================================================

  async eliminarReceta(
    receta: Receta
  ): Promise<void> {
    if (
      !receta.id ||
      !this.puedeEliminarReceta(receta)
    ) {
      return;
    }

    const confirmarEliminacion =
      window.confirm(
        `¿Querés eliminar la receta "${receta.nombre}"?`
      );

    if (!confirmarEliminacion) {
      return;
    }

    try {
      await this.firestoreService.delete(
        'recetas',
        receta.id
      );

    } catch (error: unknown) {
      console.error(
        'Error al eliminar la receta:',
        error
      );

      this.mensajeError =
        'No fue posible eliminar la receta.';
    }
  }


  // ========================================================
  // NAVEGACIÓN
  // ========================================================

  irADiario(): void {
    void this.router.navigate([
      '/alimentarse/diario'
    ]);
  }


  // ========================================================
  // HELPERS PARA EL HTML
  // ========================================================

  getNivelLabel(
    nivel: NivelReceta | string
  ): string {
    const niveles: Record<NivelReceta, string> = {
      facil: 'Fácil',
      medio: 'Medio',
      dificil: 'Difícil'
    };

    return this.esNivelValido(nivel)
      ? niveles[nivel]
      : 'Fácil';
  }


  getCategoriaLabel(): string {
    const categoria =
      this.categorias.find(
        (item) =>
          item.valor ===
          this.categoriaActiva
      );

    return categoria?.label ??
      'Recetas';
  }


  /**
   * Se puede utilizar desde el HTML para mostrar
   * errores de validación.
   */
  campoInvalido(
    nombreCampo: keyof FormularioReceta
  ): boolean {
    const control =
      this.recetaForm.controls[nombreCampo];

    return (
      control.invalid &&
      control.touched
    );
  }


  // ========================================================
  // VALIDACIONES INTERNAS
  // ========================================================

  private esCategoriaValida(
    categoria: unknown
  ): categoria is CategoriaReceta {
    return (
      categoria === 'desayuno' ||
      categoria === 'almuerzo' ||
      categoria === 'merienda' ||
      categoria === 'cena'
    );
  }


  private esNivelValido(
    nivel: unknown
  ): nivel is NivelReceta {
    return (
      nivel === 'facil' ||
      nivel === 'medio' ||
      nivel === 'dificil'
    );
  }
}