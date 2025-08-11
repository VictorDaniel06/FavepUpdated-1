import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Movimentacao } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class MovimentacaoService {
  private baseUrl = 'http://localhost:5050/finance';

  constructor(private http: HttpClient) { }

 getMovimentacoes(): Observable<Movimentacao[]> {
     // CORREÇÃO: O endpoint correto é /finances
     return this.http.get<Movimentacao[]>(`${this.baseUrl}/finances`).pipe(
       catchError(error => {
         console.error('Erro ao buscar movimentações:', error);
         return of([]);
       })
     );
   }
 
   adicionarMovimentacao(mov: Omit<Movimentacao, 'id'>): Observable<Movimentacao> {
     // CORREÇÃO: O endpoint correto é /registerFinance
     return this.http.post<Movimentacao>(`${this.baseUrl}/registerFinance`, mov);
   }
 
   atualizarMovimentacao(id: string, mov: Partial<Movimentacao>): Observable<Movimentacao> {
     // CORREÇÃO: O endpoint correto é /financeUpdate/:id
     return this.http.put<Movimentacao>(`${this.baseUrl}/financeUpdate/${id}`, mov);
   }
 
   excluirMovimentacao(id: string): Observable<any> {
     // CORREÇÃO: O endpoint correto é /financeDelete/:id (seguindo o padrão dos outros controllers)
     return this.http.delete(`${this.baseUrl}/financeDelete/${id}`);
   }
}