import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlimentarseComponent } from './alimentarse.component';

describe('AlimentarseComponent', () => {
  let component: AlimentarseComponent;
  let fixture: ComponentFixture<AlimentarseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlimentarseComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AlimentarseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
