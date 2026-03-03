import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModeTabsComponent } from './mode-tabs.component';

describe('ModeTabsComponent', () => {
  let component: ModeTabsComponent;
  let fixture: ComponentFixture<ModeTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModeTabsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModeTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
