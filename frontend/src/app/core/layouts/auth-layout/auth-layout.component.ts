import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-layout-container">
      <header class="auth-header">
        <img src="assets/logo.png" alt="Studify" />
      </header>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
      .auth-layout-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background-color: var(--background); /* Assuming some global variable */
      }
      .auth-header {
        padding-top: 2rem;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .auth-header img {
        height: 48px;
        width: auto;
      }
    `,
  ],
})
export class AuthLayoutComponent {}
