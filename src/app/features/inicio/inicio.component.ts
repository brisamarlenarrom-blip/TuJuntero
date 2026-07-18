import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { FirestoreService } from '../../core/firestore.service';

@Component({
  selector: 'app-inicio',
  standalone: true,

  /* CommonModule permite usar directivas como:
   * - *ngIf
   * - *ngFor
   * RouterModule permite usar routerLink en el HTML.*/
  imports: [
    CommonModule,
    RouterModule
  ],

  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {

  /* =====================================================
     INFORMACIÓN DEL ENCABEZADO
     ===================================================== */

  saludo = '';
  nombre = '';

  /*
   * Guarda la fecha actual en español.
   * Actualmente no aparece en el HTML, pero puede conservarse
   * si después queremos mostrarla en la pantalla de Inicio.
   */
  fechaActual = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  /* =====================================================
     VERSÍCULO DEL DÍA
     ===================================================== */

  frase = 'Cargando...';
  referencia = '';

  /* =====================================================
     CHECK-IN EMOCIONAL
     ===================================================== */

  estadoAnimo = 0;

  /*
   * Guarda el ID del registro emocional del día actual.
   *
   * Si ya existe un registro, se actualiza.
   * Si no existe, se crea uno nuevo.
   */
  animoGuardadoHoyId = '';

  emojis = [
    { valor: 1, emoji: '😢', label: 'Mal' },
    { valor: 2, emoji: '😐', label: 'Regular' },
    { valor: 3, emoji: '🙂', label: 'Bien' },
    { valor: 4, emoji: '😊', label: 'Muy bien' },
    { valor: 5, emoji: '🤩', label: 'Excelente' }
  ];

  /* =====================================================
     ESTADÍSTICAS
     ===================================================== */

  diasSeguidos = 0;

  /*
   * Estos valores todavía son fijos.
   * Más adelante podrían calcularse usando las actividades
   * que el usuario completa durante el día.
   */
  metaDiaria = 3;
  metaDiariaTotal = 5;

  /* =====================================================
     DATOS DE LOS MÓDULOS
     ===================================================== */

  tareasPendientes = 0;

  /*
   * Estas propiedades todavía no aparecen en el HTML actual.
   * Las dejamos preparadas por si luego se incorporan al Inicio.
   */
  almuerzoRegistrado = false;
  entrenamientoHoy = 'Piernas y glúteos';

  constructor(
    private auth: AuthService,
    private fs: FirestoreService
  ) {}

  /* =====================================================
     CICLO DE VIDA DEL COMPONENTE
     ===================================================== */

  ngOnInit(): void {
    /*
     * ngOnInit se ejecuta una vez cuando Angular termina
     * de crear e inicializar el componente.
     */
    this.establecerSaludo();
    this.cargarNombre();
    this.cargarFraseDelDia();
    this.cargarTareasPendientes();
    this.cargarAnimoHoy();
  }

  /* =====================================================
     SALUDO SEGÚN EL HORARIO
     ===================================================== */

  establecerSaludo(): void {
    const horaActual = new Date().getHours();

    if (horaActual >= 4 && horaActual < 12) {
      this.saludo = 'Buenos días';
      return;
    }

    if (horaActual >= 12 && horaActual < 20) {
      this.saludo = 'Buenas tardes';
      return;
    }

    this.saludo = 'Buenas noches';
  }

  /* =====================================================
     USUARIO ACTUAL
     ===================================================== */

  cargarNombre(): void {
    const usuario = this.auth.getUsuarioActual();

    if (!usuario) {
      return;
    }

    this.nombre = usuario.nombre;
  }

  /* =====================================================
     VERSÍCULO DEL DÍA
     ===================================================== */

  async cargarFraseDelDia(): Promise<void> {
    /*
     * Se utiliza una lista limitada de versículos.
     * Según el día del mes se selecciona uno de ellos.
     */
    const versiculos = [
      'JHN.3.16',
      'PHP.4.13',
      'PSA.23.1',
      'ISA.40.31',
      'JER.29.11',
      'ROM.8.28',
      'PRO.3.5',
      'MAT.11.28'
    ];

    const diaActual = new Date().getDate();
    const indice = diaActual % versiculos.length;
    const versiculoSeleccionado = versiculos[indice];

    const bibleId = 'b32b9d1b64b4ef29-01';
    const apiKey = 'UHG4bARVhogIr9t2BfYxy';

    try {
      const response = await fetch(
        `https://api.scripture.api.bible/v1/bibles/${bibleId}/verses/${versiculoSeleccionado}?content-type=text&include-verse-numbers=false`,
        {
          headers: {
            'api-key': apiKey
          }
        }
      );

      /*
       * fetch no lanza automáticamente un error ante respuestas
       * como 404 o 500. Por eso verificamos response.ok.
       */
      if (!response.ok) {
        throw new Error(
          `Error al consultar el versículo: ${response.status}`
        );
      }

      const resultado = await response.json();

      if (!resultado.data) {
        throw new Error('La API no devolvió información del versículo.');
      }

      /*
       * Algunas APIs bíblicas pueden devolver contenido HTML.
       * El HTML actual muestra el contenido como texto normal.
       */
      this.frase = resultado.data.content.trim();
      this.referencia = resultado.data.reference;

    } catch (error) {
      /*
       * Si la API falla, la pantalla no queda vacía.
       * Se muestra un versículo alternativo.
       */
      console.error('No se pudo cargar el versículo del día:', error);

      this.frase =
        'Porque yo sé los planes que tengo para vos, dice el Señor...';

      this.referencia = 'Jeremías 29:11';
    }
  }

  /* =====================================================
     TAREAS PENDIENTES
     ===================================================== */

  cargarTareasPendientes(): void {
    const usuario = this.auth.getUsuarioActual();

    if (!usuario) {
      return;
    }

    /*
     * Busca las tareas que pertenecen al usuario actual.
     *
     * getByField devuelve un Observable, por eso necesitamos
     * suscribirnos para recibir los datos.
     */
    this.fs
      .getByField('tareas', 'usuarioId', usuario.id)
      .subscribe({
        next: (tareas: any[]) => {
          this.tareasPendientes = tareas.filter(
            tarea => tarea.estado === 'pendiente'
          ).length;
        },
        error: error => {
          console.error(
            'No se pudieron cargar las tareas pendientes:',
            error
          );

          this.tareasPendientes = 0;
        }
      });
  }

  /* =====================================================
     ESTADO DE ÁNIMO Y RACHA
     ===================================================== */

  cargarAnimoHoy(): void {
    const usuario = this.auth.getUsuarioActual();

    if (!usuario) {
      return;
    }

    const hoy = this.obtenerFechaLocal();

    /*
     * Obtiene todos los registros emocionales del usuario.
     * Con esos datos:
     *
     * 1. Busca el registro del día actual.
     * 2. Calcula la cantidad de días consecutivos.
     */
    this.fs
      .getByField('animos', 'usuarioId', usuario.id)
      .subscribe({
        next: (registros: any[]) => {
          const registroHoy = registros.find(
            registro => registro.fecha === hoy
          );

          if (registroHoy) {
            this.estadoAnimo = registroHoy.valor;
            this.animoGuardadoHoyId = registroHoy.id;
          }

          this.diasSeguidos = this.calcularRacha(registros);
        },
        error: error => {
          console.error(
            'No se pudo cargar el estado de ánimo:',
            error
          );

          this.diasSeguidos = 0;
        }
      });
  }

  seleccionarAnimo(valor: number): void {
    /*
     * Primero actualizamos la pantalla.
     * Después guardamos el dato en Firestore.
     */
    this.estadoAnimo = valor;
    void this.guardarAnimo(valor);
  }

  async guardarAnimo(valor: number): Promise<void> {
    const usuario = this.auth.getUsuarioActual();

    if (!usuario) {
      return;
    }

    const emojiSeleccionado = this.emojis.find(
      emoji => emoji.valor === valor
    );

    const datos = {
      usuarioId: usuario.id,
      fecha: this.obtenerFechaLocal(),
      valor,
      emoji: emojiSeleccionado?.emoji ?? '',
      label: emojiSeleccionado?.label ?? ''
    };

    try {
      if (this.animoGuardadoHoyId) {
        /*
         * UPDATE:
         * El usuario ya había registrado su ánimo hoy,
         * por lo que actualizamos ese documento.
         */
        await this.fs.update(
          'animos',
          this.animoGuardadoHoyId,
          datos
        );

        return;
      }

      /*
       * CREATE:
       * Todavía no existe un registro para hoy.
       */
      const referenciaCreada = await this.fs.create(
        'animos',
        datos
      );

      this.animoGuardadoHoyId = referenciaCreada?.id ?? '';

    } catch (error) {
      console.error(
        'No se pudo guardar el estado de ánimo:',
        error
      );
    }
  }

  /* =====================================================
     MÉTODOS AUXILIARES
     ===================================================== */

  private calcularRacha(registros: any[]): number {
    /*
     * Set evita fechas duplicadas y permite buscar
     * una fecha de manera más eficiente.
     */
    const fechasRegistradas = new Set(
      registros
        .map(registro => registro.fecha)
        .filter(Boolean)
    );

    let racha = 0;
    const fechaEvaluada = new Date();

    /*
     * Recorremos hacia atrás desde el día actual.
     * La racha se corta cuando encontramos un día
     * sin registro emocional.
     */
    for (let dia = 0; dia < 365; dia++) {
      const fechaTexto = this.formatearFechaLocal(fechaEvaluada);

      if (!fechasRegistradas.has(fechaTexto)) {
        break;
      }

      racha++;
      fechaEvaluada.setDate(fechaEvaluada.getDate() - 1);
    }

    return racha;
  }

  private obtenerFechaLocal(): string {
    return this.formatearFechaLocal(new Date());
  }

  private formatearFechaLocal(fecha: Date): string {
    /*
     * Evitamos usar toISOString() porque trabaja con UTC
     * y, cerca de la medianoche, podría devolver un día
     * diferente al día local del usuario.
     */
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }
}