import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IaEntrenamientoComponent } from './ia-entrenamiento.component';

describe('IaEntrenamientoComponent', () => {
  let component: IaEntrenamientoComponent;
  let fixture: ComponentFixture<IaEntrenamientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IaEntrenamientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IaEntrenamientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
