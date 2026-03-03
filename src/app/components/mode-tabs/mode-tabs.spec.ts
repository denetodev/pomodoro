import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModeTabs } from './mode-tabs';

describe('ModeTabs', () => {
  let component: ModeTabs;
  let fixture: ComponentFixture<ModeTabs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModeTabs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModeTabs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
