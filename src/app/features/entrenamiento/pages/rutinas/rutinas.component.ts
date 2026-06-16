import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';
import { IaService } from '../../../../core/ia.service';

@Component({
  selector: 'app-rutinas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './rutinas.component.html',
  styleUrl: './rutinas.component.css'
})
export class RutinasComponent implements OnInit {

  usuarioId = '';
  nombre = '';

  // ── Estado ───────────────────────────────────────────
  mostrarForm = false;
  cargandoIA = false;
  rutinaGenerada: any = null;
  rutinaGuardada: any = null;

  // ── Opciones de objetivo ─────────────────────────────
  objetivos = [
    { value: 'fuerza',       label: 'Fuerza',        icono: '💪' },
    { value: 'hipertrofia',  label: 'Masa muscular',  icono: '🏆' },
    { value: 'cardio',       label: 'Resistencia',    icono: '❤️' },
    { value: 'movilidad',    label: 'Movilidad',      icono: '🧘' },
    { value: 'perdida_peso', label: 'Perder peso',    icono: '🔥' }
  ];

  // ── Formulario de perfil fitness ─────────────────────
  perfilForm: FormGroup;

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router,
  private iaService: IaService
  ) {
    this.perfilForm = this.fb.group({
      objetivo:     [['fuerza'], Validators.required],
      nivel:        ['principiante', Validators.required],
      diasSemana:   [3, Validators.required],
      duracion:     [45, Validators.required],
      equipamiento: ['sin_equipamiento', Validators.required]
    });
  }

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) {
      this.usuarioId = usuario.id;
      this.nombre = usuario.nombre || '';
    }
    this.cargarRutinaGuardada();
  }

  // ── Carga rutina existente del usuario ───────────────
  cargarRutinaGuardada() {
    this.fs.getByField('rutinas_ia', 'usuarioId', this.usuarioId).subscribe(data => {
      if (data.length > 0) {
        this.rutinaGuardada = data[0];
        if (this.rutinaGuardada.perfil) {
          this.perfilForm.patchValue(this.rutinaGuardada.perfil);
        }
      }
    });
  }

  // ── Toggle objetivo (múltiple selección) ─────────────
  toggleObjetivo(valor: string) {
    const actuales: string[] = this.perfilForm.value.objetivo || [];
    const idx = actuales.indexOf(valor);
    if (idx > -1) {
      actuales.splice(idx, 1);
    } else {
      actuales.push(valor);
    }
    this.perfilForm.patchValue({ objetivo: [...actuales] });
  }

  // ── Genera rutina con IA ─────────────────────────────
  // Genera una rutina base según el perfil (sin IA)
generarRutina() {
  if (this.perfilForm.invalid) return;
  const perfil = this.perfilForm.value;

  // Arma una rutina genérica según nivel y días
  const ejerciciosBase = this.getEjerciciosPorObjetivo(perfil.objetivo);
  const diasSemana = perfil.diasSemana;
  const nivel = perfil.nivel;

  const dias: any[] = [];
  for (let i = 1; i <= diasSemana; i++) {
    dias.push({
      dia: `Día ${i}`,
      nombre: i <= 3 ? 'Entrenamiento de fuerza' : 'Cardio y movilidad',
      ejercicios: ejerciciosBase.map(e => ({
        nombre: e,
        series: nivel === 'principiante' ? 3 : nivel === 'intermedio' ? 4 : 5,
        repeticiones: nivel === 'principiante' ? '8-10' : nivel === 'intermedio' ? '10-12' : '12-15',
        descanso: nivel === 'principiante' ? '90 seg' : '60 seg',
        nota: 'Mantené la técnica correcta durante todo el movimiento'
      }))
    });
  }

  this.rutinaGenerada = {
    nombre: `Rutina ${perfil.objetivo?.join(' + ') || 'Full Body'} - ${perfil.nivel}`,
    descripcion: `${diasSemana} días por semana · ${perfil.duracion} min por sesión · ${perfil.equipamiento === 'sin_equipamiento' ? 'Sin equipamiento' : 'Con ' + perfil.equipamiento}`,
    dias: dias,
    consejos: [
      'Calentá siempre 5-10 minutos antes de empezar',
      'Estirá al finalizar cada sesión',
      'Aumentá el peso gradualmente cada semana',
      'Descansá al menos un día entre sesiones',
      'Mantenete hidratado durante el entrenamiento'
    ],
    perfil: perfil
  };
}

// Ejercicios según objetivo
getEjerciciosPorObjetivo(objetivos: string[]): string[] {
  if (!objetivos || objetivos.length === 0) return ['Sentadillas', 'Flexiones', 'Plancha', 'Zancadas', 'Puente de glúteos'];

  const ejercicios: Record<string, string[]> = {
    fuerza: ['Sentadillas con peso', 'Press de hombros', 'Peso muerto', 'Remo', 'Press de banca'],
    hipertrofia: ['Curl de bíceps', 'Extensiones de tríceps', 'Elevaciones laterales', 'Sentadillas búlgaras', 'Press inclinado'],
    cardio: ['Jumping Jacks', 'Mountain Climbers', 'Burpees', 'Saltos de tijera', 'High Knees'],
    movilidad: ['Rotaciones de cadera', 'Estiramiento de espalda', 'Círculos de brazos', 'Flexión de tobillos', 'Gato-vaca'],
    perdida_peso: ['Sentadillas con salto', 'Plancha dinámica', 'Zancadas alternas', 'Escaladores', 'Abdominales bicicleta']
  };

  let seleccionados: string[] = [];
  objetivos.forEach(obj => {
    if (ejercicios[obj]) {
      seleccionados = [...seleccionados, ...ejercicios[obj]];
    }
  });

  // Si no encontró nada, devuelve unos por defecto
  return seleccionados.length > 0 ? seleccionados.slice(0, 5) : ['Sentadillas', 'Flexiones', 'Plancha', 'Zancadas', 'Abdominales'];
}


  // ── Guarda la rutina en Firestore ────────────────────
  async guardarRutina() {
    if (!this.rutinaGenerada) return;
    const datos = {
      ...this.rutinaGenerada,
      usuarioId: this.usuarioId,
      fechaActualizacion: new Date().toISOString()
    };

    if (this.rutinaGuardada?.id) {
      await this.fs.update('rutinas_ia', this.rutinaGuardada.id, datos);
    } else {
      await this.fs.create('rutinas_ia', datos);
    }
    this.rutinaGuardada = datos;
    this.mostrarForm = false;
    this.rutinaGenerada = null;
  }

  volver() { this.router.navigate(['/entrenamiento']); }
}