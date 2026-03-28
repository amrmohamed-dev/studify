import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { StudySession, SessionType } from '../../shared/models/room.models';

interface SessionResponse {
  status: string;
  data: {
    session: StudySession | null;
    autoStartedSession?: StudySession | null;
  };
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly api = '/api/v1/sessions';

  getActiveSession(roomId: string): Observable<StudySession | null> {
    return this.http
      .get<SessionResponse>(`${this.api}/room/${roomId}/active`)
      .pipe(map((response) => response.data.session));
  }

  startSession(
    roomId: string,
    type: SessionType,
    duration: number,
  ): Observable<StudySession | null> {
    return this.http
      .post<SessionResponse>(`${this.api}/start`, {
        roomId,
        type,
        duration,
      })
      .pipe(map((response) => response.data.session));
  }

  endSession(sessionId: string): Observable<StudySession | null> {
    return this.http
      .patch<SessionResponse>(`${this.api}/${sessionId}/end`, {})
      .pipe(map((response) => response.data.autoStartedSession ?? null));
  }
}
