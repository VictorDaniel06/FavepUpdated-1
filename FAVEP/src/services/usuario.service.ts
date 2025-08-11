import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Usuario } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private baseUrl = 'http://localhost:5050/auth';

  constructor(private http: HttpClient) { }

  getPerfilUsuario(): Observable<Usuario | null> {
    return this.http.get<Usuario>(`${this.baseUrl}/users/me`).pipe(
      catchError(error => {
        console.error('Erro ao buscar perfil do usuário:', error);
        return of(null);
      })
    );
  }

  // CORREÇÃO: O ID do usuário não é passado na URL, o back-end o obtém do token.
  atualizarPerfilUsuario(dados: Partial<Usuario>): Observable<Usuario> {
    // CORREÇÃO: O endpoint correto é /update, sem ID.
    return this.http.put<Usuario>(`${this.baseUrl}/update`, dados).pipe(
      catchError(error => {
        console.error('Erro ao atualizar perfil:', error);
        throw error;
      })
    );
  }
}