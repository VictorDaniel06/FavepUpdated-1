import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { Subscription } from 'rxjs';

// --- SERVIÇOS ---
import { DashboardDataService } from '../../services/dashboard-data.service';
import { PropriedadeService } from '../../services/propriedade.service';
import { ProducaoService } from '../../services/producao.service';
import { MovimentacaoService } from '../../services/movimentacao.service';
import { AuthService } from '../../services/auth.service';
import {
  Usuario,
  Propriedade,
  Producao,
  Movimentacao,
} from '../../models/api.models';

registerLocaleData(localePt);

@Component({
  selector: 'app-gerenciamento',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './gerenciamento.component.html',
  styleUrl: './gerenciamento.component.css',
})
export class GerenciamentoComponent implements OnInit, OnDestroy {

  menuAberto = false;
  usuarioNome: string = '';
  usuarioFoto: string = 'https://placehold.co/40x40/aabbcc/ffffff?text=User';

  abaAtiva: string = 'propriedades';
  modalAberto: boolean = false;
  confirmacaoAberta: boolean = false;
  modalTitulo: string = '';
  mensagemConfirmacao: string = '';
  tipoEdicao: string = '';
  itemParaExcluir: any = null;
  tipoExclusao: string = '';
  filtroAtivo: string = 'todos';
  filtroPeriodo: string = '30';
  termoBusca: string = '';
  opcoesFiltro: { valor: string; texto: string }[] = [{ valor: 'todos', texto: 'Todos' }];

  propriedades: Propriedade[] = [];
  producoes: Producao[] = [];
  movimentacoes: Movimentacao[] = [];

  propriedadesFiltradas: Propriedade[] = [];
  producoesFiltradas: Producao[] = [];
  movimentacoesFiltradas: Movimentacao[] = [];

  propriedadeEditada: Partial<Propriedade> = {};
  // CORREÇÃO: Incluído 'produtividade' no objeto.
  producaoEditada: Partial<Producao> = {};
  movimentacaoEditada: Partial<Movimentacao> = { tipo: 'receita' };

  todasCulturas: string[] = [];
  safras: string[] = [];

  private userSubscription: Subscription | undefined;

  constructor(
    private dashboardDataService: DashboardDataService,
    private propriedadeService: PropriedadeService,
    private producaoService: ProducaoService,
    private movimentacaoService: MovimentacaoService,
    private authService: AuthService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser.subscribe(user => {
      if (user) {
        this.usuarioNome = user.nome;
        this.usuarioFoto = user.fotoPerfil || 'https://placehold.co/40x40/aabbcc/ffffff?text=User';
      }
    });
    this.carregarTodosDados();
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  carregarTodosDados(): void {
    this.dashboardDataService.carregarDadosDashboard().subscribe({
      next: (data) => {
        // As interfaces já estão corretas, então os dados serão mapeados corretamente.
        const { propriedades, producoes, movimentacoes } = data;
        this.propriedades = propriedades;
        this.producoes = producoes;
        this.movimentacoes = movimentacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

        const uniqueCrops = new Set<string>(this.producoes.map(p => p.cultura));
        this.opcoesFiltro = [{ valor: 'todos', texto: 'Todos' }, ...Array.from(uniqueCrops).sort().map(c => ({ valor: c, texto: c }))];
        this.todasCulturas = Array.from(uniqueCrops).sort();
        this.safras = Array.from(new Set(this.producoes.map(p => p.safra).filter(Boolean))).sort();
        this.aplicarFiltros();
      },
      error: (err) => console.error('Erro ao carregar dados:', err),
    });
  }

  selecionarAba(aba: string): void {
    this.abaAtiva = aba;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.filtrarPropriedades();
    this.filtrarProducoes();
    this.filtrarMovimentacoes();
  }

  // CORREÇÃO: Filtrar por 'nomepropriedade'.
  filtrarPropriedades(): void {
    this.propriedadesFiltradas = this.propriedades.filter(prop =>
      !this.termoBusca || prop.nomepropriedade.toLowerCase().includes(this.termoBusca.toLowerCase()) ||
      (prop.localizacao && prop.localizacao.toLowerCase().includes(this.termoBusca.toLowerCase()))
    );
  }

  // CORREÇÃO: Usar 'nomepropriedade' para buscar o nome da propriedade.
  filtrarProducoes(): void {
    this.producoesFiltradas = this.producoes.filter(prod => {
      const filtroCultura = this.filtroAtivo === 'todos' || prod.cultura === this.filtroAtivo;
      const busca = !this.termoBusca ||
        this.getNomePropriedade(prod.nomepropriedade).toLowerCase().includes(this.termoBusca.toLowerCase()) ||
        prod.cultura.toLowerCase().includes(this.termoBusca.toLowerCase()) ||
        prod.safra.toLowerCase().includes(this.termoBusca.toLowerCase());
      return filtroCultura && busca;
    });
  }

  // CORREÇÃO: Usar 'nomepropriedade' para buscar o nome da propriedade.
  filtrarMovimentacoes(): void {
    const dias = parseInt(this.filtroPeriodo, 10);
    const dataLimite = new Date();
    if (!isNaN(dias)) {
      dataLimite.setDate(dataLimite.getDate() - dias);
    }

    this.movimentacoesFiltradas = this.movimentacoes.filter(mov => {
      const periodo = this.filtroPeriodo === 'todos' || new Date(mov.data) >= dataLimite;
      const busca = !this.termoBusca ||
        (mov.descricao && mov.descricao.toLowerCase().includes(this.termoBusca.toLowerCase())) ||
        (mov.nomepropriedade && this.getNomePropriedade(mov.nomepropriedade).toLowerCase().includes(this.termoBusca.toLowerCase()));
      return periodo && busca;
    });
  }

  // CORREÇÃO: Usar 'area_ha'.
  calcularAreaTotal(): number {
    return this.propriedades.reduce((total, prop) => total + (prop.area_ha || 0), 0);
  }

  contarCulturasAtivas(): number {
    return new Set(this.producoes.map(p => p.cultura)).size;
  }

  // CORREÇÃO: Usar 'produtividade'.
  calcularProducaoTotal(): number {
    return this.producoes.reduce((total, prod) => total + (prod.produtividade || 0), 0);
  }

  // CORREÇÃO: Usar 'nomepropriedade' e 'area_ha'.
  calcularAreaPlantada(): number {
    const propertyNames = new Set(this.producoes.map(p => p.nomepropriedade));
    return this.propriedades
      .filter(p => propertyNames.has(p.nomepropriedade))
      .reduce((total, prop) => total + (prop.area_ha || 0), 0);
  }

  calcularProdutividadeMedia(): number {
    const totalProducao = this.calcularProducaoTotal();
    const totalArea = this.calcularAreaPlantada();
    return totalArea > 0 ? totalProducao / totalArea : 0;
  }

  calcularTotalReceitas(): number {
    return this.movimentacoes
      .filter(m => m.tipo === 'receita')
      .reduce((total, m) => total + m.valor, 0);
  }

  calcularTotalDespesas(): number {
    return this.movimentacoes
      .filter(m => m.tipo === 'despesa')
      .reduce((total, m) => total + m.valor, 0);
  }

  calcularResultadoFinanceiro(): number {
    return this.calcularTotalReceitas() - this.calcularTotalDespesas();
  }

  executarExclusao(): void {
    if (!this.itemParaExcluir) return;
    let exclusaoObservable;

    switch (this.tipoExclusao) {
      case 'propriedades':
        // CORREÇÃO: Usar 'nomepropriedade' para exclusão.
        if (!this.itemParaExcluir.nomepropriedade) return;
        exclusaoObservable = this.propriedadeService.excluirPropriedade(this.itemParaExcluir.nomepropriedade);
        break;
      case 'producao':
        if (!this.itemParaExcluir.id) return;
        exclusaoObservable = this.producaoService.excluirProducao(String(this.itemParaExcluir.id));
        break;
      case 'financeiro':
        if (!this.itemParaExcluir.id) return;
        exclusaoObservable = this.movimentacaoService.excluirMovimentacao(String(this.itemParaExcluir.id));
        break;
      default:
        this.cancelarExclusao();
        return;
    }

    exclusaoObservable.subscribe({
      next: () => {
        this.carregarTodosDados();
        this.cancelarExclusao();
      },
      error: (err) => console.error(`Erro ao excluir ${this.tipoExclusao}:`, err),
    });
  }

  salvar(): void {
    switch (this.tipoEdicao) {
      case 'propriedades': this.salvarPropriedade(); break;
      case 'producao': this.salvarProducao(); break;
      case 'financeiro': this.salvarMovimentacao(); break;
    }
  }

  // CORREÇÃO: Lógica para tratar criação vs atualização com 'nomepropriedade'.
  salvarPropriedade(): void {
    const { nomepropriedade, ...dados } = this.propriedadeEditada;
    
    const observable = this.propriedades.some(p => p.nomepropriedade === nomepropriedade)
      ? this.propriedadeService.atualizarPropriedade(nomepropriedade!, dados)
      : this.propriedadeService.adicionarPropriedade({ ...dados, nomepropriedade: nomepropriedade! } as Omit<Propriedade, 'usuarioId'>);

    observable.subscribe({
      next: () => { this.carregarTodosDados(); this.fecharModal(); },
      error: (err) => console.error('Erro ao salvar propriedade:', err),
    });
  }

  // CORREÇÃO: Lógica de salvar produção com modelo atualizado.
  salvarProducao(): void {
    const { id, ...dados } = this.producaoEditada;
    const observable = id
      ? this.producaoService.atualizarProducao(String(id), dados)
      : this.producaoService.adicionarProducao(dados as Omit<Producao, 'id'>);

    observable.subscribe({
      next: () => { this.carregarTodosDados(); this.fecharModal(); },
      error: (err) => console.error('Erro ao salvar produção:', err),
    });
  }

  // CORREÇÃO: Lógica de salvar movimentação com modelo atualizado.
  salvarMovimentacao(): void {
    const { id, ...dados } = this.movimentacaoEditada;
    const observable = id
      ? this.movimentacaoService.atualizarMovimentacao(String(id), dados)
      : this.movimentacaoService.adicionarMovimentacao(dados as Omit<Movimentacao, 'id'>);

    observable.subscribe({
      next: () => { this.carregarTodosDados(); this.fecharModal(); },
      error: (err) => console.error('Erro ao salvar movimentação:', err),
    });
  }

  @HostListener('document:click', ['$event'])
  fecharMenuFora(event: MouseEvent) {
    const alvo = event.target as HTMLElement;
    if (!alvo.closest('.menu-toggle') && !alvo.closest('.main-menu')) {
      this.menuAberto = false;
    }
  }

  abrirModalAdicionar(): void {
    this.modalAberto = true;
    this.tipoEdicao = this.abaAtiva;
    this.modalTitulo = `Adicionar ${this.getTituloModal()}`;

    switch (this.tipoEdicao) {
      case 'propriedades': this.propriedadeEditada = {}; break;
      // CORREÇÃO: Inicializa o objeto de produção com os campos necessários.
      case 'producao': this.producaoEditada = { cultura: '', safra: '', areaproducao: 0, produtividade: 0, data: new Date(), nomepropriedade: '' }; break;
      case 'financeiro': this.movimentacaoEditada = { tipo: 'receita', data: new Date(), descricao: '', valor: 0 }; break;
    }
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.propriedadeEditada = {};
    this.producaoEditada = {};
    this.movimentacaoEditada = { tipo: 'receita' };
  }

  editarPropriedade(prop: Propriedade): void {
    this.propriedadeEditada = { ...prop };
    this.modalTitulo = 'Editar Propriedade';
    this.tipoEdicao = 'propriedades';
    this.modalAberto = true;
  }

  editarProducao(prod: Producao): void {
    this.producaoEditada = { ...prod, data: this.datePipe.transform(prod.data, 'yyyy-MM-dd') as any };
    this.modalTitulo = 'Editar Produção';
    this.tipoEdicao = 'producao';
    this.modalAberto = true;
  }

  editarMovimentacao(mov: Movimentacao): void {
    this.movimentacaoEditada = { ...mov, data: this.datePipe.transform(mov.data, 'yyyy-MM-dd') as any };
    this.modalTitulo = 'Editar Movimentação Financeira';
    this.tipoEdicao = 'financeiro';
    this.modalAberto = true;
  }

  // CORREÇÃO: Usar 'nomepropriedade' para a mensagem de confirmação.
  confirmarExclusao(item: any, tipo: string): void {
    this.itemParaExcluir = item;
    this.tipoExclusao = tipo;
    this.mensagemConfirmacao = `Confirmar exclusão de "${item.nomepropriedade || item.descricao || item.cultura}"?`;
    this.confirmacaoAberta = true;
  }

  cancelarExclusao(): void {
    this.confirmacaoAberta = false;
    this.itemParaExcluir = null;
    this.tipoExclusao = '';
  }

  getTituloModal(): string {
    const titulos: { [key: string]: string } = {
      propriedades: 'Propriedade',
      producao: 'Produção',
      financeiro: 'Movimentação Financeira',
    };
    return titulos[this.abaAtiva] || 'Item';
  }

  // CORREÇÃO: O ID da propriedade agora é uma string (nomepropriedade).
  getNomePropriedade(nomepropriedade: string): string {
    const prop = this.propriedades.find((p) => p.nomepropriedade === nomepropriedade);
    return prop ? prop.nomepropriedade : 'N/A';
  }

  trackById(index: number, item: any): string {
    // CORREÇÃO: Usa 'nomepropriedade' como fallback para o ID.
    return item.id || item.nomepropriedade;
  }

  alternarMenu(): void {
    this.menuAberto = !this.menuAberto;
  }
}