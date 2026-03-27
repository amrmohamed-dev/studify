import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-request-sent',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './request-sent.component.html',
  styleUrls: ['./request-sent.component.scss'],
})
export class RequestSentComponent implements OnInit, OnDestroy {
  private socket!: Socket;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.socket = io('http://localhost:3000');

    this.socket.on('room:approved', (data: { roomId: string }) => {
      if (data.roomId) {
        this.router.navigate([`/rooms/${data.roomId}`]);
      }
    });
  }

  backToDashboard(): void {
    this.router.navigate(['/rooms']);
  }

  ngOnDestroy(): void {
    this.socket.off('room:approved');
    this.socket.disconnect();
  }
}