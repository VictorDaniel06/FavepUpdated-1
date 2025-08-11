import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Usuario } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authUrl = 'http://localhost:5050/auth';
  private isBrowser: boolean;

  // BehaviorSubject para armazenar o usuário atual. Ele é a "fonte da verdade".
  private currentUserSubject: BehaviorSubject<Usuario | null>;
  public currentUser: Observable<Usuario | null>;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    // Inicializa o BehaviorSubject com o usuário que já pode estar no localStorage
    this.currentUserSubject = new BehaviorSubject<Usuario | null>(this.getUser());
    this.currentUser = this.currentUserSubject.asObservable();
  }

  // Método público para obter o valor atual do usuário de forma síncrona, se necessário
  public get currentUserValue(): Usuario | null {
    return this.currentUserSubject.value;
  }

  register(dadosUsuario: any): Observable<any> {
    return this.http.post(`${this.authUrl}/register`, dadosUsuario);
  }

  login(email: string, senha: string): Observable<any> {
    return this.http.post<{ token: string; user: Usuario }>(`${this.authUrl}/login`, { email, senha }).pipe(
      tap(response => {
        if (response.token && response.user) {
          this.setToken(response.token);
          // O método setUser agora vai cuidar de salvar e notificar os componentes
          this.setUser(response.user);
        }
      })
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Notifica todos os 'escutadores' que o usuário fez logout
      this.currentUserSubject.next(null);
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  setToken(token: string): void {
    if (this.isBrowser) localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem('token') : null;
  }

  /**
   * ---- MÉTODO CORRIGIDO ----
   * Agora, além de salvar no localStorage, este método também atualiza
   * o BehaviorSubject, notificando toda a aplicação sobre a mudança.
   */
  setUser(usuario: Usuario): void {
    if (this.isBrowser) {
      localStorage.setItem('user', JSON.stringify(usuario));
      // Notifica todos os componentes que estão inscritos em 'currentUser'
      this.currentUserSubject.next(usuario);
    }
  }

  getUser(): Usuario | null {
    if (this.isBrowser) {
      const json = localStorage.getItem('user');
      return json ? JSON.parse(json) : null;
    }
    return null;
  }
}
