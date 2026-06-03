import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { FirestoreService } from '../../core/firestore.service';
import { CardComponent } from '../../shared/ui/card/card.component';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {

  // ── Saludo ───────────────────────────────────────────
  saludo = '';
  nombre = '';
  fechaActual: string = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // ── Versículo ────────────────────────────────────────
  frase = 'Cargando...';
  referencia = '';

  // ── Check-in emocional ───────────────────────────────
  estadoAnimo = 0;
  emojis = [
    { valor: 1, emoji: '😢', label: 'Mal' },
    { valor: 2, emoji: '😐', label: 'Regular' },
    { valor: 3, emoji: '🙂', label: 'Bien' },
    { valor: 4, emoji: '😊', label: 'Muy bien' },
    { valor: 5, emoji: '🤩', label: 'Excelente' }
  ];

  // ── Stats ────────────────────────────────────────────
  diasSeguidos = 5;          // TODO: conectar con check-ins diarios
  metaDiaria = 3;            // TODO: conectar con Firestore
  metaDiariaTotal = 5;

  // ── Accesos rápidos ──────────────────────────────────
  tareasPendientes = 0;
  almuerzoRegistrado = false;
  entrenamientoHoy = 'Piernas y glúteos';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private fs: FirestoreService
  ) {}

  ngOnInit() {
    this.setSaludo();
    this.cargarNombre();
    this.cargarFraseDelDia(); 
    this.cargarTareasPendientes();
  }

  setSaludo() {
    const h = new Date().getHours();
    this.saludo = h < 12 ? '¡Buenos días' : h < 19 ? '¡Buenas tardes' : '¡Buenas noches';
  }

  cargarNombre() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.nombre = usuario.nombre;
  }

  async cargarFraseDelDia() {
  // Versículos predefinidos rotantes por día de la semana
  const versiculos = [
    'JHN.3.16', 'PHP.4.13', 'PSA.23.1', 'ISA.40.31',
    'JER.29.11', 'ROM.8.28', 'PRO.3.5', 'MAT.11.28'
  ];

  const hoy = new Date();
  const indice = hoy.getDate() % versiculos.length;
  const versiculo = versiculos[indice];

  const bibleId = 'b32b9d1b64b4ef29-01'; // NTV en español
  const apiKey = 'UHG4bARVhogIr9t2BfYxy';

  try {
    const response = await fetch(
      `https://api.scripture.api.bible/v1/bibles/${bibleId}/verses/${versiculo}?content-type=text&include-verse-numbers=false`,
      { headers: { 'api-key': apiKey } }
    );
    const data = await response.json();
    if (data.data) {
      this.frase = data.data.content.trim();
      this.referencia = data.data.reference;
    }
  } catch {
    this.frase = 'Porque yo sé los planes que tengo para vos, dice el Señor...';
    this.referencia = 'Jeremías 29:11';
  }
}

  cargarTareasPendientes() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) {
      this.fs.getByField('tareas', 'usuarioId', usuario.id).subscribe(data => {
        this.tareasPendientes = data.filter((t: any) => t.estado === 'pendiente').length;
      });
    }
  }

  seleccionarAnimo(valor: number) {
    this.estadoAnimo = valor;
  }
}