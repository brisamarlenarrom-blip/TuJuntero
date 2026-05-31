import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';

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

  // ── Formulario de perfil fitness ─────────────────────
  perfilForm: FormGroup;

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.perfilForm = this.fb.group({
      objetivo:     ['fuerza', Validators.required],
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
        // Pre-carga el formulario con los datos guardados
        if (this.rutinaGuardada.perfil) {
          this.perfilForm.patchValue(this.rutinaGuardada.perfil);
        }
      }
    });
  }

  // ── Genera rutina con IA ─────────────────────────────
  async generarRutina() {
    if (this.perfilForm.invalid) return;
    this.cargandoIA = true;
    this.rutinaGenerada = null;

    const perfil = this.perfilForm.value;
    const objetivoLabel: Record<string, string> = {
      fuerza: 'ganar fuerza', hipertrofia: 'ganar masa muscular',
      cardio: 'mejorar resistencia cardiovascular', movilidad: 'mejorar movilidad y flexibilidad', perdida_peso: 'perder peso'
    };
    const equipLabel: Record<string, string> = {
      sin_equipamiento: 'sin equipamiento (solo peso corporal)',
      mancuernas: 'mancuernas', gym_completo: 'gimnasio completo con máquinas y pesas', bandas: 'bandas elásticas'
    };

    const prompt = `Sos un entrenador personal experto. Generá una rutina de entrenamiento personalizada en español para:
- Nombre: ${this.nombre}
- Objetivo: ${objetivoLabel[perfil.objetivo] || perfil.objetivo}
- Nivel: ${perfil.nivel}
- Días por semana: ${perfil.diasSemana}
- Duración por sesión: ${perfil.duracion} minutos
- Equipamiento: ${equipLabel[perfil.equipamiento] || perfil.equipamiento}

Respondé SOLO con un JSON válido, sin texto adicional, sin markdown, sin backticks. El formato debe ser exactamente:
{
  "nombre": "nombre de la rutina",
  "descripcion": "descripción breve",
  "dias": [
    {
      "dia": "Día 1",
      "nombre": "nombre del día",
      "ejercicios": [
        { "nombre": "nombre ejercicio", "series": 3, "repeticiones": "10-12", "descanso": "60 seg", "nota": "consejo técnico" }
      ]
    }
  ],
  "consejos": ["consejo 1", "consejo 2", "consejo 3"]
}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();
      const texto = data.content[0].text;
      const clean = texto.replace(/```json|```/g, '').trim();
      this.rutinaGenerada = JSON.parse(clean);
      this.rutinaGenerada.perfil = perfil;

    } catch (e) {
      console.error('Error generando rutina:', e);
    } finally {
      this.cargandoIA = false;
    }
  }

  // ── Guarda la rutina en Firestore ────────────────────
  async guardarRutina() {
    if (!this.rutinaGenerada) return;
    const datos = { ...this.rutinaGenerada, usuarioId: this.usuarioId, fechaActualizacion: new Date().toISOString() };

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