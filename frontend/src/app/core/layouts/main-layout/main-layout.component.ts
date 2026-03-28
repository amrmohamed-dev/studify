import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <div class="app-shell">
      <app-navbar></app-navbar>

      <main class="app-content">
        <router-outlet></router-outlet>
      </main>

      <app-footer></app-footer>
    </div>
  `,
})
export class MainLayoutComponent {}
