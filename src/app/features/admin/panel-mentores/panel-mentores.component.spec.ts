import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelMentoresComponent } from './panel-mentores.component';

describe('PanelMentoresComponent', () => {
  let component: PanelMentoresComponent;
  let fixture: ComponentFixture<PanelMentoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelMentoresComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PanelMentoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
