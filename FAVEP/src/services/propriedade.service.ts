import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Propriedade } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class PropriedadeService {
  private baseUrl = 'http://localhost:5050/property';

  constructor(private http: HttpClient) { }

  // Buscar todas as propriedades
  getPropriedades(): Observable<Propriedade[]> {
    return this.http.get<Propriedade[]>(`${this.baseUrl}/properties`).pipe(
      catchError(error => {
        console.error('Erro ao buscar propriedades:', error);
        return of([]);
      })
    );
  }

  // CORREÇÃO: A assinatura do método agora reflete o payload correto, que não inclui 'usuarioId'.
  adicionarPropriedade(prop: Omit<Propriedade, 'usuarioId'>): Observable<Propriedade> {
    return this.http.post<Propriedade>(`${this.baseUrl}/registerProp`, prop).pipe(
      catchError(error => {
        console.error('Erro ao adicionar propriedade:', error);
        throw error;
      })
    );
  }

  // Atualizar propriedade
  atualizarPropriedade(nomepropriedade: string, prop: Partial<Propriedade>): Observable<Propriedade> {
    return this.http.put<Propriedade>(`${this.baseUrl}/updateProp/${nomepropriedade}`, prop).pipe(
      catchError(error => {
        console.error('Erro ao atualizar propriedade:', error);
        throw error;
      })
    );
  }

  // Excluir propriedade
  excluirPropriedade(nomepropriedade: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/propDelete/${nomepropriedade}`).pipe(
      catchError(error => {
        console.error('Erro ao excluir propriedade:', error);
        throw error;
      })
    );
  }

  // (Opcional) Buscar propriedade pelo nome
  getPropriedadeById(nomepropriedade: string): Observable<Propriedade> {
    return this.http.get<Propriedade>(`${this.baseUrl}/propGetById/${nomepropriedade}`).pipe(
      catchError(error => {
        console.error('Erro ao buscar propriedade pelo nome:', error);
        throw error;
      })
    );
  }
}