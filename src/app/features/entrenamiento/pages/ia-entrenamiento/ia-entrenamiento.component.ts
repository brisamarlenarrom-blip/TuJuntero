// Componente IA Entrenamiento: genera rutinas personalizadas con Gemini
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { IaService } from '../../../../core/ia.service';

@Component({
  selector: 'app-ia-entrenamiento',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatCheckboxModule, MatProgressSpinnerModule, RouterModule],
  templateUrl: './ia-entrenamiento.component.html',
  styleUrl: './ia-entrenamiento.component.css'
})
export class IaEntrenamientoComponent {
  formEntreno: FormGroup;
  respuesta = '';
  cargando = false;
  paso: 'formulario' | 'respuesta' = 'formulario';

  // Opciones de objetivos
  objetivos = [
    { value: 'fuerza', label: '💪 Fuerza' },
    { value: 'masa_muscular', label: '🏆 Masa muscular' },
    { value: 'resistencia', label: '❤️ Resistencia' },
    { value: 'movilidad', label: '🧘 Movilidad' },
    { value: 'perder_peso', label: '🔥 Perder peso' }
  ];

  constructor(
    private fb: FormBuilder,
    private iaService: IaService,
    private router: Router
  ) {
    this.formEntreno = this.fb.group({
      fuerza: [false],
      masa_muscular: [false],
      resistencia: [false],
      movilidad: [false],
      perder_peso: [false],
      nivel: ['principiante'],
      diasPorSemana: ['3'],
      duracion: ['45'],
      equipamiento: ['sin_equipamiento']
    });
  }

  // Obtiene los objetivos seleccionados como texto
  getObjetivosSeleccionados(): string {
    const seleccionados = this.objetivos.filter(o => this.formEntreno.value[o.value]);
    return seleccionados.map(o => o.label).join(', ') || 'General';
  }

  // Genera el prompt y llama a Gemini
  async generarRutina() {
    this.cargando = true;
    const datos = this.formEntreno.value;

    const prompt = `
Actuá como un entrenador personal profesional. Creá una rutina de entrenamiento personalizada con estos datos:

- Objetivos: ${this.getObjetivosSeleccionados()}
- Nivel: ${datos.nivel}
- Días por semana: ${datos.diasPorSemana}
- Duración por sesión: ${datos.duracion} minutos
- Equipamiento: ${datos.equipamiento}

Por favor incluí:
1. 🔥 Calentamiento (5-10 min)
2. 💪 Rutina detallada día por día con ejercicios, series, repeticiones y descanso
3. 🧘 Estiramiento final (5 min)
4. 💡 Consejos según el nivel y objetivos

Respondé en español, con emojis y formato claro. Máximo 600 palabras.`;

    try {
       this.iaService.preguntar(prompt).subscribe((data: any) => {
       this.respuesta = data?.choices?.[0]?.message?.content || data?.respuesta || 'Sin respuesta';
       this.cargando = false;
       this.paso = 'respuesta';
});
    } catch (error) {
      this.respuesta = 'Ocurrió un error. Intentá de nuevo más tarde.';
      this.paso = 'respuesta';
    }
    this.cargando = false;
  }

  nuevaRutina() {
    this.paso = 'formulario';
    this.respuesta = '';
  }

  volver() { this.router.navigate(['/entrenamiento']); }
}