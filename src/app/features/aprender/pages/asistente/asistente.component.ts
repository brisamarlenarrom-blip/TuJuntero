// ==========================================================
// ASISTENTE DE ESTUDIO IA
// ==========================================================

import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterModule
} from '@angular/router';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  firstValueFrom
} from 'rxjs';


// ==========================================================
// ANGULAR MATERIAL
// ==========================================================

import {
  MatButtonModule
} from '@angular/material/button';

import {
  MatCardModule
} from '@angular/material/card';

import {
  MatFormFieldModule
} from '@angular/material/form-field';

import {
  MatInputModule
} from '@angular/material/input';

import {
  MatProgressSpinnerModule
} from '@angular/material/progress-spinner';

import {
  MatSelectModule
} from '@angular/material/select';


// ==========================================================
// SERVICIOS PROPIOS
// ==========================================================

import {
  AuthService
} from '../../../../core/auth.service';

import {
  IaService
} from '../../../../core/ia.service';


// ==========================================================
// TIPOS DEL COMPONENTE
// ==========================================================

/**
 * Pantallas disponibles dentro del asistente.
 */
type PasoAsistente =
  | 'formulario'
  | 'respuesta';


/**
 * Opciones laborales utilizadas por el HTML.
 */
type OpcionTrabajo =
  | 'no'
  | 'medio_tiempo'
  | 'tiempo_completo';


/**
 * Horarios preferidos para estudiar.
 */
type HorarioEstudio =
  | 'mañana'
  | 'tarde'
  | 'noche';


/**
 * Métodos de estudio disponibles.
 */
type EstiloEstudio =
  | 'leyendo'
  | 'videos'
  | 'resumenes'
  | 'practicando'
  | 'explicando';


/**
 * Opciones de disponibilidad semanal.
 */
type DiasLibres =
  | 'finde'
  | 'algunos_dias'
  | 'todos_los_dias';


/**
 * Estructura tipada del formulario reactivo.
 */
interface FormularioAsistente {
  materias: FormControl<string>;
  trabaja: FormControl<OpcionTrabajo>;
  horasTrabajo: FormControl<number>;
  horarioEstudio: FormControl<HorarioEstudio>;
  estiloEstudio: FormControl<EstiloEstudio>;
  tiempoConcentracion: FormControl<number>;
  diasLibres: FormControl<DiasLibres>;
}


/**
 * Valores finales obtenidos del formulario.
 */
interface DatosAsistente {
  materias: string;
  trabaja: OpcionTrabajo;
  horasTrabajo: number;
  horarioEstudio: HorarioEstudio;
  estiloEstudio: EstiloEstudio;
  tiempoConcentracion: number;
  diasLibres: DiasLibres;
}


@Component({
  selector: 'app-asistente',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,

    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],

  templateUrl: './asistente.component.html',
  styleUrl: './asistente.component.css'
})
export class AsistenteComponent implements OnInit {

  // ========================================================
  // INYECCIÓN DE DEPENDENCIAS
  // ========================================================

  /**
   * FormBuilder que evita valores null en los controles.
   */
  private readonly fb = inject(
    NonNullableFormBuilder
  );


  /**
   * Servicio que se comunica con el backend de IA.
   */
  private readonly iaService = inject(
    IaService
  );


  /**
   * Servicio encargado del usuario autenticado.
   */
  private readonly authService = inject(
    AuthService
  );


  /**
   * Servicio utilizado para navegar hacia Aprender.
   */
  private readonly router = inject(
    Router
  );


  // ========================================================
  // ESTADO DEL COMPONENTE
  // ========================================================

  /**
   * Respuesta que se muestra en pantalla.
   */
  respuesta = '';


  /**
   * Evita múltiples solicitudes y modifica el botón.
   */
  cargando = false;


  /**
   * Controla si se muestra el formulario o el resultado.
   */
  paso: PasoAsistente = 'formulario';


  /**
   * Identificador del usuario autenticado.
   */
  usuarioId = '';


  /**
   * Mensaje para informar errores sin romper la pantalla.
   */
  mensajeError = '';


  /**
   * Informa si la rutina fue generada localmente porque
   * el servidor de IA no respondió.
   */
  respuestaGeneradaLocalmente = false;


  // ========================================================
  // FORMULARIO REACTIVO TIPADO
  // ========================================================

  readonly formAsistente: FormGroup<FormularioAsistente> =
    this.fb.group({

      materias: this.fb.control('', {
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(500)
        ]
      }),

      trabaja:
        this.fb.control<OpcionTrabajo>('no'),

      horasTrabajo: this.fb.control(0, {
        validators: [
          Validators.required,
          Validators.min(0),
          Validators.max(16)
        ]
      }),

      horarioEstudio:
        this.fb.control<HorarioEstudio>('noche'),

      estiloEstudio:
        this.fb.control<EstiloEstudio>('practicando'),

      tiempoConcentracion: this.fb.control(30, {
        validators: [
          Validators.required,
          Validators.min(15),
          Validators.max(90)
        ]
      }),

      diasLibres:
        this.fb.control<DiasLibres>('finde')
    });


  // ========================================================
  // CICLO DE VIDA
  // ========================================================

  ngOnInit(): void {
    this.obtenerUsuarioActual();

    /*
     * Cada vez que cambia la situación laboral,
     * ajustamos automáticamente el campo horasTrabajo.
     */
    this.formAsistente.controls.trabaja
      .valueChanges
      .subscribe((opcionTrabajo) => {

        if (opcionTrabajo === 'no') {
          this.formAsistente.controls.horasTrabajo
            .setValue(0);
        }

        if (
          opcionTrabajo !== 'no' &&
          this.formAsistente.controls.horasTrabajo.value === 0
        ) {
          this.formAsistente.controls.horasTrabajo
            .setValue(4);
        }
      });
  }


  // ========================================================
  // GENERACIÓN DEL PLAN
  // ========================================================

  /**
   * Valida el formulario, construye el prompt y solicita
   * el plan al servicio de inteligencia artificial.
   *
   * Si el backend no responde, genera automáticamente
   * una planificación local para que la función no quede rota.
   */
  async generarRespuesta(): Promise<void> {

    // Evita solicitudes duplicadas.
    if (this.cargando) {
      return;
    }


    // Muestra los errores de los controles.
    if (this.formAsistente.invalid) {
      this.formAsistente.markAllAsTouched();
      return;
    }


    this.cargando = true;
    this.mensajeError = '';
    this.respuesta = '';
    this.respuestaGeneradaLocalmente = false;


    const datos: DatosAsistente =
      this.formAsistente.getRawValue();


    const prompt =
      this.construirPrompt(datos);


    try {

      const respuestaIa =
        await firstValueFrom(
          this.iaService.preguntar(prompt)
        );


      const textoNormalizado =
        respuestaIa.trim();


      if (!textoNormalizado) {
        throw new Error(
          'El servicio devolvió una respuesta vacía.'
        );
      }


      this.respuesta =
        textoNormalizado;

      this.paso =
        'respuesta';

    } catch (error: unknown) {

      console.error(
        'Error al comunicarse con la IA:',
        error
      );


      /*
       * En lugar de dejar al usuario sin resultado,
       * se genera una rutina local utilizando los mismos datos.
       */
      this.respuesta =
        this.generarPlanLocal(datos);

      this.respuestaGeneradaLocalmente =
        true;

      this.mensajeError =
        this.obtenerMensajeError(error);

      this.paso =
        'respuesta';

    } finally {

      this.cargando =
        false;
    }
  }


  // ========================================================
  // NAVEGACIÓN Y REINICIO
  // ========================================================

  /**
   * Regresa al formulario conservando los datos ingresados.
   */
  nuevoPlan(): void {
    this.paso = 'formulario';
    this.respuesta = '';
    this.mensajeError = '';
    this.respuestaGeneradaLocalmente = false;
  }


  /**
   * Limpia completamente el formulario.
   */
  reiniciarFormulario(): void {

    this.formAsistente.reset({
      materias: '',
      trabaja: 'no',
      horasTrabajo: 0,
      horarioEstudio: 'noche',
      estiloEstudio: 'practicando',
      tiempoConcentracion: 30,
      diasLibres: 'finde'
    });


    this.respuesta = '';
    this.mensajeError = '';
    this.respuestaGeneradaLocalmente = false;
    this.paso = 'formulario';
  }


  /**
   * Regresa al panel principal del módulo Aprender.
   */
  volver(): void {
    void this.router.navigate([
      '/aprender'
    ]);
  }


  // ========================================================
  // HELPERS PARA EL HTML
  // ========================================================

  /**
   * Determina si un control debe mostrar un error.
   */
  campoInvalido(
    nombreCampo: keyof FormularioAsistente
  ): boolean {

    const control =
      this.formAsistente.controls[nombreCampo];

    return control.invalid &&
      control.touched;
  }


  /**
   * Indica si debe mostrarse el campo de horas laborales.
   */
  get usuarioTrabaja(): boolean {
    return (
      this.formAsistente.controls.trabaja.value !== 'no'
    );
  }


  // ========================================================
  // USUARIO ACTUAL
  // ========================================================

  /**
   * Recupera el usuario autenticado desde AuthService.
   */
  private obtenerUsuarioActual(): void {

    const usuario =
      this.authService.getUsuarioActual();

    this.usuarioId =
      usuario?.id ?? '';
  }


  // ========================================================
  // CONSTRUCCIÓN DEL PROMPT
  // ========================================================

  /**
   * Crea las instrucciones completas que recibe la IA.
   */
  private construirPrompt(
    datos: DatosAsistente
  ): string {

    const situacionLaboral =
      this.formatearTrabajo(datos);

    return `
Actuá como un asesor académico experto.

Creá una rutina semanal de estudio personalizada, clara, realista y posible de cumplir.

DATOS DEL ESTUDIANTE

Materias o temas:
${datos.materias.trim()}

Situación laboral:
${situacionLaboral}

Horario de mayor rendimiento:
${this.formatearHorario(datos.horarioEstudio)}

Forma preferida de estudiar:
${this.formatearEstilo(datos.estiloEstudio)}

Tiempo máximo de concentración:
${datos.tiempoConcentracion} minutos por bloque.

Disponibilidad semanal:
${this.formatearDiasLibres(datos.diasLibres)}

INSTRUCCIONES

La rutina debe distribuir todas las materias mencionadas.

Indicá días concretos de estudio.

Indicá horarios aproximados.

Incluí bloques de estudio de ${datos.tiempoConcentracion} minutos.

Agregá pausas de entre 5 y 15 minutos.

Ordená las materias por dificultad o prioridad.

No propongas jornadas excesivas.

Adaptá los horarios a la situación laboral.

Incluí un espacio semanal para repaso.

Incluí un espacio semanal para práctica oral, ejercicios o autoevaluación.

Usá un lenguaje sencillo y motivador.

No uses tablas.

No uses Markdown.

No uses asteriscos.

No uses listas con guiones.

La respuesta debe tener como máximo 500 palabras.

FORMATO OBLIGATORIO

PLAN DE ESTUDIO PERSONALIZADO 📚

ORGANIZACIÓN SEMANAL

Detallá cada día disponible con bloques y pausas.

MÉTODO RECOMENDADO

Explicá cómo estudiar cada bloque según su estilo preferido.

REPASO Y AUTOEVALUACIÓN

Indicá cuándo repasar y cómo comprobar lo aprendido.

CONSEJOS PARA MANTENER LA CONSTANCIA

Incluí consejos breves y realistas.

MENSAJE MOTIVADOR 🌟

Cerrá con un mensaje personalizado.
    `.trim();
  }


  // ========================================================
  // PLAN LOCAL DE RESPALDO
  // ========================================================

  /**
   * Genera una rutina personalizada sin utilizar una API externa.
   *
   * Esta función actúa como respaldo cuando el servidor local
   * no está encendido, no tiene conexión o devuelve un error.
   */
  private generarPlanLocal(
    datos: DatosAsistente
  ): string {

    const materias =
      this.separarMaterias(datos.materias);


    const horario =
      this.obtenerRangoHorario(datos.horarioEstudio);


    const dias =
      this.obtenerDiasDisponibles(datos.diasLibres);


    const duracionBloque =
      datos.tiempoConcentracion;


    const pausa =
      duracionBloque <= 30
        ? 5
        : duracionBloque <= 60
          ? 10
          : 15;


    const cantidadBloques =
      datos.trabaja === 'tiempo_completo'
        ? 1
        : datos.trabaja === 'medio_tiempo'
          ? 2
          : 2;


    const organizacionSemanal =
      dias
        .map((dia, indiceDia) => {

          const bloques: string[] = [];

          for (
            let indiceBloque = 0;
            indiceBloque < cantidadBloques;
            indiceBloque++
          ) {

            const indiceMateria =
              (
                indiceDia * cantidadBloques +
                indiceBloque
              ) % materias.length;


            const materia =
              materias[indiceMateria];


            const horaBloque =
              this.calcularHoraBloque(
                horario.horaInicio,
                indiceBloque,
                duracionBloque,
                pausa
              );


            bloques.push(
              `${horaBloque}: ${materia}. ` +
              `Estudiá durante ${duracionBloque} minutos ` +
              `y descansá ${pausa} minutos.`
            );
          }


          return `${dia.toUpperCase()}\n${bloques.join('\n')}`;
        })
        .join('\n\n');


    const tecnica =
      this.obtenerTecnicaLocal(
        datos.estiloEstudio
      );


    const materiaRepaso =
      materias[0] ?? 'la materia más importante';


    return `
PLAN DE ESTUDIO PERSONALIZADO 📚

ORGANIZACIÓN SEMANAL

Tu horario recomendado es ${horario.descripcion}.

${organizacionSemanal}

MÉTODO RECOMENDADO

${tecnica}

Al comenzar cada bloque, elegí un objetivo pequeño y concreto. Por ejemplo: comprender un tema, resolver ejercicios o practicar una explicación oral.

REPASO Y AUTOEVALUACIÓN

En el último día disponible, utilizá el bloque final para repasar ${materiaRepaso} y los temas que hayan resultado más difíciles.

Al terminar, intentá explicar lo aprendido sin mirar los apuntes. También podés responder preguntas, resolver ejercicios o grabarte hablando durante dos minutos.

CONSEJOS PARA MANTENER LA CONSTANCIA

Prepará el material antes de comenzar.

Silenciá las notificaciones durante cada bloque.

No intentes recuperar todo en un solo día si no pudiste estudiar.

Marcá cada bloque terminado para visualizar tu avance.

Dejá al menos un momento de descanso real durante la semana.

MENSAJE MOTIVADOR 🌟

No necesitás estudiar de manera perfecta. Un bloque cumplido con atención vale más que varias horas sin concentración. Avanzá paso a paso y reconocé cada progreso.
    `.trim();
  }


  // ========================================================
  // FORMATEO DE DATOS
  // ========================================================

  private formatearTrabajo(
    datos: DatosAsistente
  ): string {

    const opciones: Record<OpcionTrabajo, string> = {
      no:
        'No trabaja actualmente.',

      medio_tiempo:
        `Trabaja medio tiempo, aproximadamente ` +
        `${datos.horasTrabajo} horas por día.`,

      tiempo_completo:
        `Trabaja tiempo completo, aproximadamente ` +
        `${datos.horasTrabajo} horas por día.`
    };

    return opciones[datos.trabaja];
  }


  private formatearHorario(
    horario: HorarioEstudio
  ): string {

    const horarios: Record<HorarioEstudio, string> = {
      mañana:
        'por la mañana, entre las 6:00 y las 12:00',

      tarde:
        'por la tarde, entre las 12:00 y las 18:00',

      noche:
        'por la noche, entre las 18:00 y las 24:00'
    };

    return horarios[horario];
  }


  private formatearEstilo(
    estilo: EstiloEstudio
  ): string {

    const estilos: Record<EstiloEstudio, string> = {
      leyendo:
        'aprende principalmente leyendo material',

      videos:
        'aprende principalmente viendo explicaciones en video',

      resumenes:
        'aprende haciendo resúmenes y organizando conceptos',

      practicando:
        'aprende realizando ejercicios y actividades prácticas',

      explicando:
        'aprende explicando los temas en voz alta o a otras personas'
    };

    return estilos[estilo];
  }


  private formatearDiasLibres(
    dias: DiasLibres
  ): string {

    const opciones: Record<DiasLibres, string> = {
      finde:
        'principalmente los fines de semana',

      algunos_dias:
        'algunos días durante la semana',

      todos_los_dias:
        'todos los días, distribuyendo la carga de manera equilibrada'
    };

    return opciones[dias];
  }


  // ========================================================
  // HELPERS DEL PLAN LOCAL
  // ========================================================

  private separarMaterias(
    materiasTexto: string
  ): string[] {

    const materias =
      materiasTexto
        .split(/[,;\n()]+/)
        .map((materia) =>
          materia
            .replace(/^\d+\s*(materias?)?\s*:?\s*/i, '')
            .trim()
        )
        .filter((materia) =>
          materia.length > 0
        );


    if (materias.length > 0) {
      return materias;
    }


    return [
      materiasTexto.trim() || 'Materia principal'
    ];
  }


  private obtenerDiasDisponibles(
    diasLibres: DiasLibres
  ): string[] {

    const opciones: Record<DiasLibres, string[]> = {
      finde: [
        'Sábado',
        'Domingo'
      ],

      algunos_dias: [
        'Martes',
        'Jueves',
        'Sábado'
      ],

      todos_los_dias: [
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado'
      ]
    };

    return opciones[diasLibres];
  }


  private obtenerRangoHorario(
    horario: HorarioEstudio
  ): {
    horaInicio: number;
    descripcion: string;
  } {

    const horarios: Record<
      HorarioEstudio,
      {
        horaInicio: number;
        descripcion: string;
      }
    > = {

      mañana: {
        horaInicio: 8,
        descripcion:
          'por la mañana, comenzando aproximadamente a las 08:00'
      },

      tarde: {
        horaInicio: 15,
        descripcion:
          'por la tarde, comenzando aproximadamente a las 15:00'
      },

      noche: {
        horaInicio: 19,
        descripcion:
          'por la noche, comenzando aproximadamente a las 19:00'
      }
    };

    return horarios[horario];
  }


  private calcularHoraBloque(
    horaInicio: number,
    indiceBloque: number,
    duracionBloque: number,
    pausa: number
  ): string {

    const minutosTotales =
      horaInicio * 60 +
      indiceBloque * (
        duracionBloque +
        pausa
      );


    const horas =
      Math.floor(
        minutosTotales / 60
      );


    const minutos =
      minutosTotales % 60;


    return (
      `${String(horas).padStart(2, '0')}:` +
      `${String(minutos).padStart(2, '0')}`
    );
  }


  private obtenerTecnicaLocal(
    estilo: EstiloEstudio
  ): string {

    const tecnicas: Record<EstiloEstudio, string> = {

      leyendo:
        'Leé primero los títulos y conceptos principales. ' +
        'Después realizá una lectura más detallada y escribí ' +
        'tres ideas importantes con tus propias palabras.',

      videos:
        'Mirá videos cortos sobre un único tema por bloque. ' +
        'Pausá cuando aparezca una idea importante y anotá un ' +
        'resumen breve para evitar una observación pasiva.',

      resumenes:
        'Dividí cada tema en conceptos pequeños. Escribí resúmenes ' +
        'breves, cuadros comparativos o palabras clave y cerrá el ' +
        'material para comprobar cuánto recordás.',

      practicando:
        'Destiná una parte pequeña del bloque a repasar la teoría ' +
        'y utilizá la mayor parte del tiempo para resolver ejercicios, ' +
        'preguntas o casos prácticos.',

      explicando:
        'Estudiá el contenido y luego explicalo en voz alta sin leer. ' +
        'Podés grabarte durante dos minutos y volver a repasar las ' +
        'partes en las que te hayas bloqueado.'
    };

    return tecnicas[estilo];
  }


  // ========================================================
  // MENSAJES DE ERROR
  // ========================================================

  private obtenerMensajeError(
    error: unknown
  ): string {

    if (error instanceof HttpErrorResponse) {

      if (error.status === 0) {
        return (
          'El servidor de inteligencia artificial no está disponible. ' +
          'Se generó una rutina local para que puedas continuar.'
        );
      }


      if (error.status === 401) {
        return (
          'La clave utilizada por el servidor de IA no está autorizada. ' +
          'Se generó una rutina local.'
        );
      }


      if (error.status === 404) {
        return (
          'No se encontró la ruta /api/chat. ' +
          'Se generó una rutina local.'
        );
      }


      if (error.status >= 500) {
        return (
          'El servidor tuvo un problema al consultar la IA. ' +
          'Se generó una rutina local.'
        );
      }
    }


    return (
      'No fue posible comunicarse con la inteligencia artificial. ' +
      'Se generó una rutina local para que puedas continuar.'
    );
  }
}