// Componente Mentores: perfiles destacados
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FirestoreService } from '../../../../core/firestore.service';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SectionTitleComponent } from '../../../../shared/ui/section-title/section-title.component';

@Component({
  selector: 'app-mentores',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent, SectionTitleComponent],
  templateUrl: './mentores.component.html',
  styleUrl: './mentores.component.css'
})
export class MentoresComponent implements OnInit {
  mentores: any[] = [];

  constructor(private fs: FirestoreService, private router: Router) {}

  ngOnInit() {
    this.cargarMentores();
  }

  cargarMentores() {
    this.fs.getByField('mentores', 'tipo', 'mentor').subscribe(data => {
      this.mentores = data;
    });
  }

  volver() { this.router.navigate(['/comunidad']); }
}