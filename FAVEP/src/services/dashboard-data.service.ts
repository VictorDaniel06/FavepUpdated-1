import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Importa todos os serviços necessários
import { UsuarioService } from './usuario.service';
import { PropriedadeService } from './propriedade.service';
import { ProducaoService } from './producao.service';
import { MovimentacaoService } from './movimentacao.service';
// CORREÇÃO: Importar o AuthService para obter os dados do usuário logado
import { AuthService } from './auth.service';

// Importa todas as interfaces necessárias
import { Usuario, Propriedade, Producao, Movimentacao } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class DashboardDataService {

  constructor(
    private usuarioService: UsuarioService,
    private propriedadeService: PropriedadeService,
    private producaoService: ProducaoService,
    private movimentacaoService: MovimentacaoService,
    // CORREÇÃO: Injetar o AuthService
    private authService: AuthService
  ) { }

  carregarDadosDashboard(): Observable<{
    perfil: Usuario | null;
    propriedades: Propriedade[];
    producoes: Producao[];
    movimentacoes: Movimentacao[];
  }> {
    // CORREÇÃO: O perfil do usuário é obtido do AuthService, que já possui o estado do usuário
    // logado, evitando uma chamada HTTP desnecessária e que resulta em erro 404.
    // A função of() cria um Observable a partir do valor síncrono.
    const perfilObservable = of(this.authService.currentUserValue);

    return forkJoin({
      perfil: perfilObservable,
      propriedades: this.propriedadeService.getPropriedades(),
      producoes: this.producaoService.getProducoes(),
      movimentacoes: this.movimentacaoService.getMovimentacoes()
    }).pipe(
      catchError(error => {
        console.error('Erro ao carregar dados consolidados do dashboard:', error);
        return of({
          perfil: null,
          propriedades: [],
          producoes: [],
          movimentacoes: []
        });
      })
    );
  }
}