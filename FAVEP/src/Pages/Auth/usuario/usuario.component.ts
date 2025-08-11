import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs'; // Importar Subscription

// Imports dos seus serviços e modelos
import { AuthService } from '../../../services/auth.service';
import { UsuarioService } from '../../../services/usuario.service';
import { Usuario } from '../../../models/api.models';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  providers: [DatePipe],
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.css']
})
export class UsuarioComponent implements OnInit, OnDestroy {
  // Propriedades para o template
  menuAberto = false;
  usuarioNome: string = '';
  usuarioFoto: string = 'https://placehold.co/40x40/aabbcc/ffffff?text=User';

  // Propriedades para o estado do componente
  usuario: Usuario | null = null;
  usuarioEditavel: Partial<Usuario> = {};
  editModalAberto = false;

  // Variável para guardar a inscrição e limpá-la depois
  private userSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private authService: AuthService,
    private usuarioService: UsuarioService
  ) { }

  /**
   * ---- MÉTODO ngOnInit CORRIGIDO ----
   * Em vez de buscar os dados uma única vez, agora nos inscrevemos
   * no Observable 'currentUser' do AuthService.
   */
  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser.subscribe(user => {
      if (user) {
        // Se um usuário for emitido (login, atualização de perfil), atualizamos o estado
        this.usuario = { ...user, senha: '' }; // Garante que a senha nunca seja armazenada
        this.atualizarHeaderInfo();
      } else {
        // Se o usuário for nulo (logout), limpamos o estado
        this.usuario = null;
        this.atualizarHeaderInfo();
      }
    });
  }

  /**
   * ---- NOVO MÉTODO ngOnDestroy ----
   * É uma boa prática cancelar a inscrição em Observables quando
   * o componente é destruído para evitar vazamentos de memória.
   */
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  // Atualiza as variáveis que são exibidas no HTML
  private atualizarHeaderInfo(): void {
    if (this.usuario) {
      this.usuarioNome = this.usuario.nome;
      this.usuarioFoto = this.usuario.fotoPerfil || 'https://placehold.co/40x40/aabbcc/ffffff?text=User';
    } else {
      this.usuarioNome = '';
      this.usuarioFoto = 'https://placehold.co/40x40/aabbcc/ffffff?text=User';
    }
  }

  salvarAlteracoesPerfil(): void {
    if (!this.usuario) {
        console.error('Usuário não está logado para atualização.');
        return;
    }
    
    // CORREÇÃO: O ID não é mais necessário na chamada do serviço.
    const { id, ...payload } = this.usuarioEditavel;

    this.usuarioService.atualizarPerfilUsuario(payload).subscribe({
      next: (updatedUser) => {
        console.log('Perfil atualizado com sucesso:', updatedUser);
        
        // Ao salvar, usamos o authService.setUser para atualizar o localStorage
        // e notificar todos os outros componentes da mudança.
        this.authService.setUser({ ...this.usuario, ...updatedUser });

        this.fecharModalEdicao();
        alert('Perfil atualizado com sucesso!');
      },
      error: (err) => {
        console.error('Erro ao salvar alterações no perfil:', err);
        alert('Erro ao atualizar perfil. Tente novamente.');
      }
    });
  }

  // --- Métodos de UI e Navegação (sem alterações) ---

  abrirModalEdicao(): void {
    if (this.usuario) {
      this.usuarioEditavel = { ...this.usuario };
      this.editModalAberto = true;
    }
  }

  fecharModalEdicao(): void {
    this.editModalAberto = false;
  }

  alternarMenu(): void {
    this.menuAberto = !this.menuAberto;
  }

 

  navegarParaContato(): void {
    this.router.navigate(['/contato']);
  }
}