import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { FirestoreService } from '../../../../core/firestore.service';
import { AuthService } from '../../../../core/auth.service';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, EmptyStateComponent],
  templateUrl: './biblioteca.component.html',
  styleUrl: './biblioteca.component.css'
})
export class BibliotecaComponent implements OnInit {

  libros: any[] = [];
  mostrarForm = false;
  editando = false;
  libroEditId: string | null = null;
  usuarioId = '';
  filtroActivo = 'todos';
  mensaje = '';

  libroForm: FormGroup;

  librosBiblia = [
    ...['Génesis','Éxodo','Levítico','Números','Deuteronomio','Josué','Jueces','Rut','1 Samuel','2 Samuel','1 Reyes','2 Reyes','1 Crónicas','2 Crónicas','Esdras','Nehemías','Ester','Job','Salmos','Proverbios','Eclesiastés','Cantares','Isaías','Jeremías','Lamentaciones','Ezequiel','Daniel','Oseas','Joel','Amós','Abdías','Jonás','Miqueas','Nahúm','Habacuc','Sofonías','Hageo','Zacarías','Malaquías']
      .map((titulo, i) => ({ titulo, testamento: 'Antiguo Testamento', orden: i + 1 })),
    ...['Mateo','Marcos','Lucas','Juan','Hechos','Romanos','1 Corintios','2 Corintios','Gálatas','Efesios','Filipenses','Colosenses','1 Tesalonicenses','2 Tesalonicenses','1 Timoteo','2 Timoteo','Tito','Filemón','Hebreos','Santiago','1 Pedro','2 Pedro','1 Juan','2 Juan','3 Juan','Judas','Apocalipsis']
      .map((titulo, i) => ({ titulo, testamento: 'Nuevo Testamento', orden: i + 40 }))
  ];

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.libroForm = this.fb.group({
      titulo: ['', Validators.required],
      autor: [''],
      estadoLectura: ['quiero_leer'],
      puntuacion: [0],
      resenia: ['']
    });
  }

  ngOnInit() {
    const usuario = this.auth.getUsuarioActual();
    if (usuario) this.usuarioId = usuario.id;
    this.cargarLibros();
  }

  cargarLibros() {
    this.fs.getByField('libros', 'usuarioId', this.usuarioId).subscribe(data => {
      this.libros = data;
    });
  }

  get librosFiltrados(): any[] {
    if (this.filtroActivo === 'todos') return this.libros;
    if (this.filtroActivo === 'favoritos') return this.libros.filter(l => l.favorito === true);
    return this.libros.filter(l => l.estadoLectura === this.filtroActivo);
  }

  setFiltro(filtro: string) {
    this.filtroActivo = filtro;
  }

  get totalLibros(): number { return this.libros.length; }
  get librosFavoritos(): number { return this.libros.filter(l => l.favorito === true).length; }
  get librosLeyendo(): number { return this.libros.filter(l => l.estadoLectura === 'leyendo').length; }
  get librosLeidos(): number { return this.libros.filter(l => l.estadoLectura === 'leido').length; }

  async cargarBibliotecaBiblica() {
    if (!this.usuarioId) return;

    const yaCargados = this.libros.filter(l => l.categoria === 'Biblia');

    if (yaCargados.length >= 66) {
      this.mensaje = 'La biblioteca bíblica ya fue cargada.';
      return;
    }

    for (const libro of this.librosBiblia) {
      const existe = this.libros.some(l =>
        l.categoria === 'Biblia' &&
        l.titulo === libro.titulo
      );

      if (!existe) {
        await this.fs.create('libros', {
          usuarioId: this.usuarioId,
          titulo: libro.titulo,
          autor: 'Biblia',
          categoria: 'Biblia',
          testamento: libro.testamento,
          orden: libro.orden,
          estadoLectura: 'quiero_leer',
          favorito: false,
          puntuacion: 0,
          resenia: '',
          fechaCreacion: new Date()
        });
      }
    }

    this.mensaje = 'Biblioteca bíblica cargada correctamente.';
  }

  async toggleFavorito(libro: any) {
    await this.fs.update('libros', libro.id, {
      favorito: !libro.favorito
    });
  }

  async cambiarEstado(libro: any, estado: string) {
    await this.fs.update('libros', libro.id, {
      estadoLectura: estado
    });
  }

  guardarLibro() {
    if (this.libroForm.invalid) return;

    const datos = {
      ...this.libroForm.value,
      usuarioId: this.usuarioId,
      favorito: false,
      categoria: 'Personal',
      fechaCreacion: new Date()
    };

    if (this.editando && this.libroEditId) {
      this.fs.update('libros', this.libroEditId, datos).then(() => this.cancelar());
    } else {
      this.fs.create('libros', datos).then(() => this.cancelar());
    }
  }

  editarLibro(libro: any) {
    this.editando = true;
    this.libroEditId = libro.id;
    this.mostrarForm = true;
    this.libroForm.patchValue(libro);
  }

  eliminarLibro(id: string) {
    if (confirm('¿Eliminar este libro?')) {
      this.fs.delete('libros', id);
    }
  }

  cancelar() {
    this.editando = false;
    this.libroEditId = null;
    this.mostrarForm = false;
    this.libroForm.reset({
      estadoLectura: 'quiero_leer',
      puntuacion: 0
    });
  }

  abrirForm() {
    this.mostrarForm = true;
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case 'leyendo': return '#4A9EFF';
      case 'leido': return '#34D399';
      case 'quiero_leer': return '#FBBF24';
      default: return '#4A9EFF';
    }
  }

  getIconoEstado(estado: string): string {
    switch (estado) {
      case 'leyendo': return '📖';
      case 'leido': return '✅';
      case 'quiero_leer': return '📚';
      default: return '📚';
    }
  }

  getLabelEstado(estado: string): string {
    switch (estado) {
      case 'leyendo': return 'Leyendo';
      case 'leido': return 'Leído';
      case 'quiero_leer': return 'Quiero leer';
      default: return estado;
    }
  }

  getEstrellas(puntuacion: number): string {
    return '⭐'.repeat(Number(puntuacion || 0));
  }

  volver() {
    this.router.navigate(['/aprender']);
  }
}