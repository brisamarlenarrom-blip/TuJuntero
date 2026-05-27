// Importaciones para la pantalla de Inicio
import { Component, OnInit } from '@angular/core';       // Component y OnInit (se ejecuta al cargar)
import { CommonModule } from '@angular/common';           // Directivas *ngIf
import { RouterModule } from '@angular/router';           // Para routerLink en las tarjetas
import { ApiService } from '../../core/api.service';      // Servicio HTTP (MockAPI - frases)
import { AuthService } from '../../core/auth.service';    // Servicio de autenticación
import { FirestoreService } from '../../core/firestore.service';  // Firebase Firestore (tareas)
import { CardComponent } from '../../shared/ui/card/card.component';   // Tarjeta genérica
@Component({
  selector: 'app-inicio',
  standalone: true,
imports: [CommonModule, RouterModule, CardComponent],   // RouterModule para que funcione routerLink
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {
  
  // ============ PROPIEDADES ============
  saludo = '';              // "Buenos días", "Buenas tardes" o "Buenas noches"
  nombre = '';              // Nombre del usuario logueado
  frase = 'Cargando...';    // Versículo del día
  referencia = '';          // Cita bíblica (ej: "Jeremías 29:11")
  
  // Fecha actual formateada en español
  fechaActual: string = new Date().toLocaleDateString('es-AR', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  estadoAnimo = 0;              // Estado de ánimo seleccionado (0 = ninguno, 1 a 5)
  tareasPendientes = 0;         // Se carga desde Firestore
  almuerzoRegistrado = false;   // Por ahora fijo, después se conecta a Firestore
  entrenamientoHoy = 'Piernas y glúteos';  // Por ahora fijo

  // Inyecta los servicios necesarios
  constructor(
    private api: ApiService,         // Para las frases (MockAPI)
    private auth: AuthService,       // Para la autenticación
    private fs: FirestoreService     // Para las tareas (Firestore)
  ) {}

  // Se ejecuta al cargar la pantalla
  ngOnInit() {
    this.setSaludo();               // Define el saludo según la hora
    this.cargarNombre();            // Obtiene el nombre del usuario logueado
    this.cargarFraseDelDia();       // Busca el versículo del día
    this.cargarTareasPendientes();  // Carga las tareas reales desde Firestore
  }

  // Define si es "Buenos días", "Buenas tardes" o "Buenas noches"
  setSaludo() {
    const h = new Date().getHours();  // Hora actual (0 a 23)
    this.saludo = h < 12 ? '¡Buenos días' : h < 19 ? '¡Buenas tardes' : '¡Buenas noches';
  }

  // Obtiene el nombre del usuario logueado (si hay sesión)
  cargarNombre() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) {
      this.nombre = usuario.nombre;
    }
  }

  // Busca el versículo del día en MockAPI según el día de la semana
  cargarFraseDelDia() {
    const diaSemana = new Date().getDay().toString();  // 0=domingo, 1=lunes, ..., 6=sábado
    this.api.getItemsByTipo('frase').subscribe({
      next: (data) => {
        const fraseHoy = data.find((f: any) => f.diaSemana === diaSemana);
        if (fraseHoy) {
          this.frase = fraseHoy.contenido;
          this.referencia = fraseHoy.autor;
        } else if (data.length > 0) {
          this.frase = data[0].contenido;
          this.referencia = data[0].autor;
        }
      },
      error: () => {
        this.frase = 'Porque yo sé los planes que tengo para vos, dice el Señor...';
        this.referencia = 'Jeremías 29:11';
      }
    });
  }

  // Carga la cantidad real de tareas pendientes desde Firestore
  cargarTareasPendientes() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) {
      this.fs.getByField('tareas', 'usuarioId', usuario.id).subscribe(data => {
        this.tareasPendientes = data.filter((t: any) => t.estado === 'pendiente').length;
      });
    }
  }

  // Guarda el estado de ánimo seleccionado (1 a 5)
  seleccionarAnimo(valor: number) {
    this.estadoAnimo = valor;
  }
}