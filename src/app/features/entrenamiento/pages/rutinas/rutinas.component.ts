// Componente Mis Rutinas
// Permite generar una rutina personalizada mediante reglas
// según el objetivo, nivel, días, duración y equipamiento del usuario.

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-rutinas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './rutinas.component.html',
  styleUrl: './rutinas.component.css'
})
export class RutinasComponent implements OnInit {

  // ─────────────────────────────────────────────
  // DATOS DEL USUARIO
  // ─────────────────────────────────────────────

  usuarioId = '';
  nombreUsuario = '';

  // ─────────────────────────────────────────────
  // ESTADO DE LA PANTALLA
  // ─────────────────────────────────────────────

  mostrarForm = false;
  generandoRutina = false;

  // Rutina que acaba de generarse desde el formulario
  rutinaGenerada: any = null;

  // Rutina personal que ya existe en Firestore
  rutinaGuardada: any = null;

  // Mensaje de confirmación o error
  mensaje = '';

  // ─────────────────────────────────────────────
  // OBJETIVOS DISPONIBLES
  // ─────────────────────────────────────────────

  objetivos = [
    {
      value: 'fuerza',
      label: 'Fuerza',
      icono: '🏋️'
    },
    {
      value: 'cardio',
      label: 'Cardio',
      icono: '❤️'
    },
    {
      value: 'movilidad',
      label: 'Movilidad',
      icono: '🧘'
    },
    {
      value: 'hiit',
      label: 'HIIT',
      icono: '⚡'
    }
  ];

  // ─────────────────────────────────────────────
  // FORMULARIO DEL PERFIL FITNESS
  // ─────────────────────────────────────────────

  perfilForm: FormGroup;

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.perfilForm = this.fb.group({
      // Permite seleccionar uno o varios objetivos
      objetivo: [['fuerza'], Validators.required],

      // Nivel de experiencia
      nivel: ['principiante', Validators.required],

      // Cantidad de días disponibles
      diasSemana: [
        3,
        [
          Validators.required,
          Validators.min(2),
          Validators.max(5)
        ]
      ],

      // Duración aproximada por entrenamiento
      duracion: [
        45,
        [
          Validators.required,
          Validators.min(20),
          Validators.max(120)
        ]
      ],

      // Material disponible
      equipamiento: ['sin_equipamiento', Validators.required]
    });
  }

  // ─────────────────────────────────────────────
  // INICIALIZACIÓN
  // ─────────────────────────────────────────────

  async ngOnInit() {
    // Espera a que Firebase recupere la sesión
    await this.auth.authReadyPromise;

    const usuario = await this.auth.refrescarUsuarioActual();

    if (usuario) {
      this.usuarioId = usuario.id;
      this.nombreUsuario = usuario.nombre || '';
    }

    this.cargarRutinaGuardada();
  }

  // ─────────────────────────────────────────────
  // CARGAR RUTINA PERSONAL
  // ─────────────────────────────────────────────

  cargarRutinaGuardada() {
    if (!this.usuarioId) return;

    this.fs
      .getByField('rutinas', 'usuarioId', this.usuarioId)
      .subscribe((data: any[]) => {

        // Busca únicamente la rutina generada por el formulario
        const rutinaPersonal = data.find(
          (rutina: any) => rutina.tipo === 'generada'
        );

        this.rutinaGuardada = rutinaPersonal || null;

        // Si existe una rutina, recupera también las opciones elegidas
        if (this.rutinaGuardada?.perfil) {
          this.perfilForm.patchValue(
            this.rutinaGuardada.perfil
          );
        }
      });
  }

  // ─────────────────────────────────────────────
  // SELECCIONAR OBJETIVOS
  // ─────────────────────────────────────────────

  toggleObjetivo(valor: string) {
    const actuales: string[] = [
      ...(this.perfilForm.value.objetivo || [])
    ];

    const posicion = actuales.indexOf(valor);

    if (posicion >= 0) {
      // Evita dejar el formulario sin ningún objetivo
      if (actuales.length === 1) return;

      actuales.splice(posicion, 1);
    } else {
      actuales.push(valor);
    }

    this.perfilForm.patchValue({
      objetivo: actuales
    });

    this.perfilForm.get('objetivo')?.markAsTouched();
  }

  // ─────────────────────────────────────────────
  // GENERADOR AUTOMÁTICO BASADO EN REGLAS
  // ─────────────────────────────────────────────

  generarRutina() {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    this.generandoRutina = true;
    this.mensaje = '';

    const perfil = this.perfilForm.getRawValue();

    const objetivosSeleccionados: string[] =
      perfil.objetivo || ['fuerza'];

    const diasSemana = Number(perfil.diasSemana);
    const duracion = Number(perfil.duracion);
    const nivel = perfil.nivel;
    const equipamiento = perfil.equipamiento;

    const dias: any[] = [];

    // Genera un entrenamiento diferente para cada día
    for (let numeroDia = 1; numeroDia <= diasSemana; numeroDia++) {

      // Alterna los objetivos seleccionados
      const objetivoDia =
        objetivosSeleccionados[
          (numeroDia - 1) % objetivosSeleccionados.length
        ];

      const ejercicios = this.getEjerciciosPorObjetivo(
        objetivoDia,
        equipamiento
      );

      dias.push({
        dia: `Día ${numeroDia}`,

        objetivo: objetivoDia,

        nombre: this.getNombreObjetivo(objetivoDia),

        duracion,

        ejercicios: ejercicios.map((ejercicio: string) => ({
          nombre: ejercicio,

          series: this.getSeriesPorNivel(nivel),

          repeticiones: this.getRepeticiones(
            nivel,
            objetivoDia
          ),

          descanso: this.getDescanso(
            nivel,
            objetivoDia
          ),

          nota: this.getNotaObjetivo(objetivoDia)
        }))
      });
    }

    const nombresObjetivos = objetivosSeleccionados
      .map(objetivo => this.getNombreObjetivo(objetivo))
      .join(' + ');

    this.rutinaGenerada = {
      nombre: `Rutina de ${nombresObjetivos}`,

      descripcion:
        `${diasSemana} días por semana · ` +
        `${duracion} minutos por sesión · ` +
        `${this.getLabelNivel(nivel)} · ` +
        `${this.getLabelEquipamiento(equipamiento)}`,

      categoria: objetivosSeleccionados[0],

      objetivos: objetivosSeleccionados,

      nivel,

      diasSemana,

      duracion,

      equipamiento,

      dias,

      consejos: [
        'Realizá entre 5 y 10 minutos de calentamiento antes de comenzar.',
        'Priorizá siempre una técnica correcta.',
        'Tomá agua antes, durante y después de entrenar.',
        'Descansá si sentís dolor o una molestia fuera de lo normal.',
        'Aumentá la intensidad de manera progresiva.'
      ],

      perfil
    };

    this.generandoRutina = false;
  }

  // ─────────────────────────────────────────────
  // EJERCICIOS SEGÚN OBJETIVO Y EQUIPAMIENTO
  // ─────────────────────────────────────────────

  getEjerciciosPorObjetivo(
    objetivo: string,
    equipamiento: string
  ): string[] {

    const ejerciciosSinEquipamiento: Record<string, string[]> = {
      fuerza: [
        'Sentadillas',
        'Flexiones',
        'Zancadas',
        'Puente de glúteos',
        'Plancha'
      ],

      cardio: [
        'Jumping Jacks',
        'Rodillas al pecho',
        'Saltos laterales',
        'Mountain Climbers',
        'Marcha rápida'
      ],

      movilidad: [
        'Círculos de brazos',
        'Rotaciones de cadera',
        'Gato-vaca',
        'Movilidad de tobillos',
        'Estiramiento dinámico de piernas'
      ],

      hiit: [
        'Burpees',
        'Sentadillas con salto',
        'Mountain Climbers',
        'Rodillas al pecho',
        'Plancha dinámica'
      ]
    };

    const ejerciciosConMancuernas: Record<string, string[]> = {
      fuerza: [
        'Sentadilla con mancuernas',
        'Press de hombros',
        'Peso muerto con mancuernas',
        'Remo con mancuernas',
        'Zancadas con mancuernas'
      ],

      cardio: [
        'Marcha con mancuernas',
        'Thrusters',
        'Step lateral con peso',
        'Peso muerto rápido',
        'Golpes frontales con mancuernas livianas'
      ],

      movilidad: ejerciciosSinEquipamiento['movilidad'],

      hiit: [
        'Thrusters',
        'Sentadilla con press',
        'Renegade row',
        'Peso muerto rápido',
        'Zancadas alternas con peso'
      ]
    };

    const ejerciciosConBandas: Record<string, string[]> = {
      fuerza: [
        'Sentadilla con banda',
        'Remo con banda',
        'Press de hombros con banda',
        'Caminata lateral con banda',
        'Puente de glúteos con banda'
      ],

      cardio: [
        'Pasos laterales con banda',
        'Rodillas al pecho',
        'Jumping Jacks',
        'Sentadilla rápida con banda',
        'Mountain Climbers'
      ],

      movilidad: [
        'Apertura de hombros con banda',
        'Movilidad de cadera',
        'Estiramiento de espalda',
        'Rotación de tronco',
        'Movilidad de tobillos'
      ],

      hiit: [
        'Sentadilla con banda',
        'Pasos laterales rápidos',
        'Mountain Climbers',
        'Zancadas alternas',
        'Jumping Jacks'
      ]
    };

    const ejerciciosGym: Record<string, string[]> = {
      fuerza: [
        'Prensa de piernas',
        'Press de banca',
        'Remo en polea',
        'Peso muerto',
        'Press de hombros'
      ],

      cardio: [
        'Cinta caminadora',
        'Bicicleta fija',
        'Elíptico',
        'Remo ergómetro',
        'Escaladora'
      ],

      movilidad: ejerciciosSinEquipamiento['movilidad'],

      hiit: [
        'Sprint en cinta',
        'Remo rápido',
        'Bicicleta por intervalos',
        'Burpees',
        'Battle ropes'
      ]
    };

    switch (equipamiento) {
      case 'mancuernas':
        return ejerciciosConMancuernas[objetivo] ||
          ejerciciosSinEquipamiento[objetivo];

      case 'bandas':
        return ejerciciosConBandas[objetivo] ||
          ejerciciosSinEquipamiento[objetivo];

      case 'gym_completo':
        return ejerciciosGym[objetivo] ||
          ejerciciosSinEquipamiento[objetivo];

      default:
        return ejerciciosSinEquipamiento[objetivo] ||
          ejerciciosSinEquipamiento['fuerza'];
    }
  }

  // ─────────────────────────────────────────────
  // GUARDAR O ACTUALIZAR RUTINA
  // ─────────────────────────────────────────────

  async guardarRutina() {
    if (!this.rutinaGenerada || !this.usuarioId) return;

    try {
      const ahora = new Date().toISOString();

      const datos = {
        ...this.rutinaGenerada,

        usuarioId: this.usuarioId,

        creadoPor: this.usuarioId,

        nombreCreador: this.nombreUsuario,

        tipo: 'generada',

        estado: 'activa',

        esPublica: false,

        fechaActualizacion: ahora
      };

      if (this.rutinaGuardada?.id) {
        await this.fs.update(
          'rutinas',
          this.rutinaGuardada.id,
          datos
        );

        this.mensaje = 'Rutina actualizada correctamente.';
      } else {
        const referencia = await this.fs.create(
          'rutinas',
          {
            ...datos,
            fechaCreacion: ahora
          }
        );

        this.rutinaGuardada = {
          id: referencia.id,
          ...datos
        };

        this.mensaje = 'Rutina guardada correctamente.';
      }

      this.mostrarForm = false;
      this.rutinaGenerada = null;

    } catch (error) {
      console.error('Error al guardar la rutina:', error);
      this.mensaje = 'No se pudo guardar la rutina.';
    }
  }

  // ─────────────────────────────────────────────
  // ABRIR Y CERRAR FORMULARIO
  // ─────────────────────────────────────────────

  abrirGenerador() {
    this.mensaje = '';
    this.rutinaGenerada = null;
    this.mostrarForm = true;
  }

  cerrarGenerador() {
    this.mostrarForm = false;
    this.rutinaGenerada = null;
    this.generandoRutina = false;
  }

  // ─────────────────────────────────────────────
  // HELPERS DEL GENERADOR
  // ─────────────────────────────────────────────

  getSeriesPorNivel(nivel: string): number {
    switch (nivel) {
      case 'intermedio':
        return 4;

      case 'avanzado':
        return 5;

      default:
        return 3;
    }
  }

  getRepeticiones(
    nivel: string,
    objetivo: string
  ): string {

    if (objetivo === 'cardio' || objetivo === 'hiit') {
      switch (nivel) {
        case 'intermedio':
          return '40 segundos';

        case 'avanzado':
          return '50 segundos';

        default:
          return '30 segundos';
      }
    }

    if (objetivo === 'movilidad') {
      return '30 segundos por lado';
    }

    switch (nivel) {
      case 'intermedio':
        return '10-12';

      case 'avanzado':
        return '12-15';

      default:
        return '8-10';
    }
  }

  getDescanso(
    nivel: string,
    objetivo: string
  ): string {

    if (objetivo === 'hiit') {
      return nivel === 'principiante'
        ? '30 segundos'
        : '20 segundos';
    }

    if (objetivo === 'cardio') {
      return '30 segundos';
    }

    if (objetivo === 'movilidad') {
      return '15 segundos';
    }

    switch (nivel) {
      case 'intermedio':
        return '60 segundos';

      case 'avanzado':
        return '45 segundos';

      default:
        return '90 segundos';
    }
  }

  getNotaObjetivo(objetivo: string): string {
    switch (objetivo) {
      case 'cardio':
        return 'Mantené un ritmo que puedas sostener.';

      case 'movilidad':
        return 'Realizá movimientos suaves y controlados.';

      case 'hiit':
        return 'Alterná momentos intensos con descansos cortos.';

      default:
        return 'Mantené una técnica correcta durante todo el ejercicio.';
    }
  }

  getNombreObjetivo(objetivo: string): string {
    switch (objetivo) {
      case 'fuerza':
        return 'Fuerza';

      case 'cardio':
        return 'Cardio';

      case 'movilidad':
        return 'Movilidad';

      case 'hiit':
        return 'HIIT';

      default:
        return 'Entrenamiento';
    }
  }

  getLabelNivel(nivel: string): string {
    switch (nivel) {
      case 'intermedio':
        return 'Nivel intermedio';

      case 'avanzado':
        return 'Nivel avanzado';

      default:
        return 'Nivel principiante';
    }
  }

  getLabelEquipamiento(equipamiento: string): string {
    switch (equipamiento) {
      case 'mancuernas':
        return 'Con mancuernas';

      case 'bandas':
        return 'Con bandas elásticas';

      case 'gym_completo':
        return 'Gimnasio completo';

      default:
        return 'Sin equipamiento';
    }
  }

  // ─────────────────────────────────────────────
  // NAVEGACIÓN
  // ─────────────────────────────────────────────

  volver() {
    this.router.navigate(['/entrenamiento']);
  }
}