import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-simple-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './simple-page.component.html',
})
export class SimplePageComponent {
  private route = inject(ActivatedRoute);

  title = this.route.snapshot.data['title'] ?? 'Studify';
  description = this.route.snapshot.data['description'] ?? '';
  actionLabel = this.route.snapshot.data['actionLabel'] ?? 'Back Home';
  actionLink = this.route.snapshot.data['actionLink'] ?? '/home';
}
