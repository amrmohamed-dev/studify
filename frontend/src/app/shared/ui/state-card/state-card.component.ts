import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

type StateKind = 'loading' | 'empty' | 'error';

@Component({
  selector: 'app-state-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="state-card" [class.state-card--error]="kind === 'error'">
      <span class="state-card__badge">{{ badgeLabel }}</span>
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>

      @if (actionLabel && actionLink) {
        <a class="btn-primary state-card__action" [routerLink]="actionLink">
          {{ actionLabel }}
        </a>
      }

      <ng-content></ng-content>
    </section>
  `,
  styles: [
    `
      .state-card {
        display: grid;
        gap: var(--space-3);
        align-items: start;
        padding: clamp(28px, 4vw, 40px);
        border-radius: var(--radius-xl);
        background: var(--color-surface);
        border: 1px solid rgba(var(--color-primary-rgb), 0.08);
        box-shadow: var(--shadow-soft);
      }

      .state-card h2 {
        margin: 0;
        font-size: clamp(1.4rem, 3vw, 2rem);
      }

      .state-card p {
        margin: 0;
        color: var(--color-text-muted);
        max-width: 56ch;
      }

      .state-card__badge {
        width: fit-content;
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-pill);
        background: rgba(var(--color-primary-rgb), 0.12);
        color: var(--color-primary);
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .state-card--error {
        border-color: rgba(var(--color-error-rgb), 0.16);
      }

      .state-card--error .state-card__badge {
        background: rgba(var(--color-error-rgb), 0.1);
        color: var(--color-error);
      }

      .state-card__action {
        width: fit-content;
        margin-top: var(--space-2);
      }
    `,
  ],
})
export class StateCardComponent {
  @Input() kind: StateKind = 'empty';
  @Input({ required: true }) title = '';
  @Input({ required: true }) message = '';
  @Input() actionLabel = '';
  @Input() actionLink = '';

  get badgeLabel(): string {
    switch (this.kind) {
      case 'loading':
        return 'Loading';
      case 'error':
        return 'Something went wrong';
      default:
        return 'Nothing here yet';
    }
  }
}
