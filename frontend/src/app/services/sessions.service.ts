import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SessionDoc } from '../models/session.model';

@Injectable({ providedIn: 'root' })
export class SessionsService {
  private readonly http = inject(HttpClient);

  getSession(id: string): Observable<SessionDoc | null> {
    return this.http.get<SessionDoc | null>(`/api/session/${encodeURIComponent(id)}`);
  }

  saveSession(id: string, data: SessionDoc): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`/api/session/${encodeURIComponent(id)}`, data);
  }

  getPrevious(day: string, excludeId: string): Observable<SessionDoc | null> {
    const params = new HttpParams().set('day', day).set('exclude', excludeId);
    return this.http.get<SessionDoc | null>('/api/previous', { params });
  }
}
