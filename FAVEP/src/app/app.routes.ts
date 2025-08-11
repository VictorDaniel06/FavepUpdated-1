import { NgModule } from '@angular/core';
import { RouterModule, RouterOutlet, Routes } from '@angular/router';
import { AssinaturaComponent } from '../Pages/assinatura/assinatura/assinatura.component';
import { UsuarioComponent } from '../Pages/Auth/usuario/usuario.component';
import { ContatoComponent } from '../Pages/contato/contato.component';
import { EstatisticaComponent } from '../Pages/estatistica/estatistica.component';
import { GerenciamentoComponent } from '../Pages/gerenciamento/gerenciamento.component';
import { HomeComponent } from '../Pages/home/home.component';
import { MenuCimaComponent } from '../Pages/navbar/menu-cima/menu-cima.component';
import { RelatorioComponent } from '../Pages/relatorio/relatorio/relatorio.component';
import { ParceirosComponent } from '../Pages/parceiros/parceiros.component';
import { AuthGuard } from '../services/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'assinatura', component: AssinaturaComponent },
  { path: 'contato', component: ContatoComponent },
  { path: 'parceiros', component: ParceirosComponent },
  { path: 'estatistica', component: EstatisticaComponent, canActivate: [AuthGuard] },
  { path: 'relatorio', component: RelatorioComponent, canActivate: [AuthGuard] },
  { path: 'gerenciamento', component: GerenciamentoComponent, canActivate: [AuthGuard] },
  { path: 'usuario', component: UsuarioComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes), RouterOutlet],
  exports: [RouterModule]
})
export class AppRoutingModule { }