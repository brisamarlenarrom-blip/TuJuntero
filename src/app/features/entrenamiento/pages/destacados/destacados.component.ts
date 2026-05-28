// Componente Destacados: muestra rutinas públicas de mentores
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FirestoreService } from '../../../../core/firestore.service';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SectionTitleComponent } from '../../../../shared/ui/section-title/section-title.component';

@Component({
  selector: 'app-destacados',
  standalone: true,
  imports: [CommonModule, CardComponent, BadgeComponent, EmptyStateComponent, SectionTitleComponent],
  templateUrl: './destacados.component.html',
  styleUrl: './destacados.component.css'
})
export class DestacadosComponent implements OnInit {
  rutinasPublicas: any[] = [];

  constructor(private fs: FirestoreService, private router: Router) {}

  ngOnInit() {
    this.cargarDestacados();
  }

  cargarDestacados() {
  // Trae todas las rutinas (usamos un campo que siempre exista)
  this.fs.getCollection('rutinas').subscribe((data: any[]) => {
    // Filtra solo las públicas de mentores
    this.rutinasPublicas = data.filter((r: any) => 
      (r.esPublica === true || r.esPublica === 'true') && r.nombreMentor
    );
  });
}

  volver() { this.router.navigate(['/entrenamiento']); }
}