import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { Subscription } from 'rxjs'; // Importar Subscription

// --- SERVIÇOS ---
import { DashboardDataService } from '../../services/dashboard-data.service';
import { AuthService } from '../../services/auth.service'; // 1. IMPORTAR O AUTHSERVICE

registerLocaleData(localePt);

@Component({
  selector: 'app-estatistica',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './estatistica.component.html',
  styleUrls: ['./estatistica.component.css']
})
export class EstatisticaComponent implements OnInit, OnDestroy {
  menuAberto = false;

  @ViewChild('produtividadeChart', { static: true }) produtividadeChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('financeiroChart', { static: true }) financeiroChart!: ElementRef<HTMLCanvasElement>;

  // Informações do usuário (virão do AuthService)
  usuarioNome: string = '';
  usuarioFoto: string = 'https://placehold.co/40x40/aabbcc/ffffff?text=User';

  // Demais propriedades para os cards e gráficos
  totalPropriedades: number = 0;
  areaTotal: number = 0;
  producaoAtual: number = 0;
  resultadoFinanceiro: number = 0;
  dadosProdutividade: number[] = [];
  culturas: string[] = [];
  meses: string[] = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  dadosReceitasMensais: number[] = new Array(12).fill(0);
  dadosDespesasMensais: number[] = new Array(12).fill(0);

  // Variável para guardar a inscrição e limpá-la depois
  private userSubscription: Subscription | undefined;

  // 2. INJETAR O AUTHSERVICE NO CONSTRUTOR
  constructor(
    private dashboardDataService: DashboardDataService,
    private authService: AuthService
  ) {
    Chart.register(...registerables);
  }

  // 3. ATUALIZAR ngOnInit PARA USAR O PADRÃO REATIVO
  ngOnInit(): void {
    // Inscreve-se para ouvir mudanças nos dados do usuário
    this.userSubscription = this.authService.currentUser.subscribe(user => {
      if (user) {
        this.usuarioNome = user.nome;
        this.usuarioFoto = user.fotoPerfil || 'https://placehold.co/40x40/aabbcc/ffffff?text=User';
      }
    });

    // Carrega os dados específicos do dashboard (gráficos, cards)
    this.carregarDadosDoDashboard();
  }

  // 4. CRIAR ngOnDestroy PARA LIMPEZA
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  // 5. REMOVER A LÓGICA DE PERFIL DESTE MÉTODO
  carregarDadosDoDashboard(): void {
    this.dashboardDataService.carregarDadosDashboard().subscribe({
      next: (data) => {
        // A informação do 'perfil' não é mais necessária aqui
        const { propriedades, producoes, movimentacoes } = data;

        // Processamento dos dados para os cards e gráficos (sem alterações)
        this.totalPropriedades = propriedades.length;
        // CORREÇÃO: Utilizando 'area_ha' em vez de 'area'
        this.areaTotal = propriedades.reduce((sum, prop) => sum + prop.area_ha, 0);

        const producaoPorCultura: { [key: string]: number } = {};
        let totalProducao = 0;
        producoes.forEach(prod => {
          // CORREÇÃO: Utilizando 'produtividade' em vez de 'quantidade'
          if (prod.produtividade) {
            totalProducao += prod.produtividade;
            producaoPorCultura[prod.cultura] = (producaoPorCultura[prod.cultura] || 0) + prod.produtividade;
          }
        });
        this.producaoAtual = totalProducao;

        let totalReceitas = 0;
        let totalDespesas = 0;
        movimentacoes.forEach(mov => {
          if (mov.tipo === 'receita') totalReceitas += mov.valor;
          else if (mov.tipo === 'despesa') totalDespesas += mov.valor;
        });
        this.resultadoFinanceiro = totalReceitas - totalDespesas;

        this.culturas = Object.keys(producaoPorCultura);
        this.dadosProdutividade = this.culturas.map(cultura => producaoPorCultura[cultura]);

        this.dadosReceitasMensais.fill(0);
        this.dadosDespesasMensais.fill(0);
        movimentacoes.forEach(mov => {
          const month = new Date(mov.data).getMonth();
          if (month >= 0 && month < 12) {
            if (mov.tipo === 'receita') this.dadosReceitasMensais[month] += mov.valor;
            else if (mov.tipo === 'despesa') this.dadosDespesasMensais[month] += mov.valor;
          }
        });

        this.criarGraficos();
      },
      error: (err) => {
        console.error('Erro ao carregar dados do dashboard:', err);
      }
    });
  }

  // O restante do seu código (criarGraficos, alternarMenu, etc.) permanece igual.
  // ... (código dos gráficos e menu)
  
  criarGraficos(): void {
    if (this.produtividadeChart && this.produtividadeChart.nativeElement) {
      const existingChart = Chart.getChart(this.produtividadeChart.nativeElement);
      if (existingChart) {
        existingChart.destroy();
      }

      new Chart(this.produtividadeChart.nativeElement, {
        type: 'bar',
        data: {
          labels: this.culturas,
          datasets: [{
            label: 'Produção Total (kg)',
            data: this.dadosProdutividade,
            backgroundColor: [
              'rgba(75, 192, 192, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(50, 205, 50, 0.6)'
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 99, 132, 1)', 'rgba(50, 205, 50, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Produção Total (kg)'
              },
              ticks: {
                callback: function(value: any) {
                  return new Intl.NumberFormat('pt-BR').format(value) + ' kg';
                }
              }
            },
            x: {
              title: {
                display: true,
                text: 'Culturas'
              }
            }
          },
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('pt-BR').format(context.parsed.y) + ' kg';
                  }
                  return label;
                }
              }
            }
          }
        }
      });
    }

    if (this.financeiroChart && this.financeiroChart.nativeElement) {
      const existingChart = Chart.getChart(this.financeiroChart.nativeElement);
      if (existingChart) {
        existingChart.destroy();
      }

      new Chart(this.financeiroChart.nativeElement, {
        type: 'bar',
        data: {
          labels: this.meses,
          datasets: [
            {
              label: 'Receitas',
              data: this.dadosReceitasMensais,
              backgroundColor: 'rgba(40, 167, 69, 0.6)',
              borderColor: 'rgba(40, 167, 69, 1)',
              borderWidth: 1
            },
            {
              label: 'Despesas',
              data: this.dadosDespesasMensais,
              backgroundColor: 'rgba(220, 53, 69, 0.6)',
              borderColor: 'rgba(220, 53, 69, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Valor (R$)'
              },
              ticks: {
                callback: function(value: any) {
                  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
                }
              }
            },
            x: {
              title: {
                display: true,
                text: 'Mês'
              }
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                  }
                  return label;
                }
              }
            }
          }
        }
      });
    }
  }

  alternarMenu() {
    this.menuAberto = !this.menuAberto;
  }

  @HostListener('document:click', ['$event'])
  fecharMenuFora(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const clicouNoBotao = target.closest('.menu-toggle');
    const clicouNoMenu = target.closest('.main-menu');

    if (!clicouNoBotao && !clicouNoMenu) {
      this.menuAberto = false;
    }
  }
}