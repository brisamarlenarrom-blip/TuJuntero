// Componente Asistente IA con Gemini
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { IaService } from '../../../../core/ia.service';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-asistente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, RouterModule],
  templateUrl: './asistente.component.html',
  styleUrl: './asistente.component.css'
})
export class AsistenteComponent {
  formAsistente: FormGroup;
  respuesta = '';
  cargando = false;
  paso: 'formulario' | 'respuesta' = 'formulario'; // Controla qué se muestra
  usuarioId = '';

  constructor(
    private fb: FormBuilder,
    private iaService: IaService,
    private auth: AuthService,
    private router: Router
  ) {
    this.formAsistente = this.fb.group({
      materias: ['', Validators.required],
      trabaja: ['no'],
      horasTrabajo: ['0'],
      horarioEstudio: ['noche'],
      estiloEstudio: ['practicando'],
      tiempoConcentracion: ['30'],
      diasLibres: ['finde']
    });
  }

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
  }

  // Genera el prompt y llama a Gemini
  async generarRespuesta() {
    if (this.formAsistente.invalid) return;
    this.cargando = true;
    const datos = this.formAsistente.value;

    // Construye el prompt para la IA
    const prompt = `
Actuá como un asesor académico experto.

Creá un plan de estudio personalizado usando estos datos:

MATERIAS: ${datos.materias}

TRABAJA: ${datos.trabaja}
HORAS DE TRABAJO: ${datos.horasTrabajo}

HORARIO PREFERIDO PARA ESTUDIAR: ${datos.horarioEstudio}

ESTILO DE ESTUDIO: ${datos.estiloEstudio}

TIEMPO DE CONCENTRACIÓN: ${datos.tiempoConcentracion} minutos

DÍAS LIBRES: ${datos.diasLibres}

IMPORTANTE:

- NO usar Markdown.
- NO usar **.
- NO usar ##.
- NO usar tablas.
- NO usar listas con guiones.
- Usar títulos en MAYÚSCULAS.
- Dejar líneas en blanco entre secciones.
- Usar emojis moderadamente.
- Escribir de forma clara y ordenada.
- Que el texto se vea bien dentro de una aplicación.

FORMATO OBLIGATORIO:

PLAN DE ESTUDIO PERSONALIZADO 📚

HORARIOS RECOMENDADOS

(detallar horarios)

TÉCNICAS DE ESTUDIO

(detallar técnicas)

CONSEJOS PARA MANTENER LA CONSTANCIA

(detallar consejos)

MENSAJE MOTIVADOR 🌟

(escribir un mensaje motivador personalizado)

Máximo 400 palabras.
`;

    try {
      this.respuesta = await this.iaService.preguntar(prompt);
      this.paso = 'respuesta';
    } catch (error) {
      this.respuesta = 'Ocurrió un error. Intentá de nuevo.';
      this.paso = 'respuesta';
    }
    this.cargando = false;
  }

  // Vuelve al formulario
  nuevoPlan() {
    this.paso = 'formulario';
    this.respuesta = '';
  }

  volver() { this.router.navigate(['/aprender']); }
}