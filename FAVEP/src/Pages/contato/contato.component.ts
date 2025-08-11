import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { MenuCimaComponent } from '../navbar/menu-cima/menu-cima.component';


@Component({
  selector: 'app-contato',
   standalone: true,
  imports: [RouterLink, FooterComponent, RouterLinkActive, MenuCimaComponent],
  templateUrl: './contato.component.html',
  styleUrls: ['./contato.component.css']
})
export class ContatoComponent {
  
   sendEmail(event: Event) {
    event.preventDefault();
    const nome = (document.getElementById("nome-email") as HTMLInputElement).value;
    const email = (document.getElementById("email") as HTMLInputElement).value; // Adicionado email
    const mensagem = (document.getElementById("mensagem-email") as HTMLTextAreaElement).value;
    const destinatario = "contato@favep.com.br"; // Altere aqui para o email da FAVEP

    // Verificação básica de preenchimento (já é feita pelo 'required' no HTML, mas útil para o JS)
    if (!nome || !email || !mensagem) {
        alert("Por favor, preencha todos os campos do formulário.");
        return;
    }

    const assunto = `Mensagem do Site - ${nome}`;
    const corpo = `Nome: ${nome}\nEmail: ${email}\nMensagem: ${mensagem}`; // Inclui email no corpo
    
    // Abrir cliente de email
    window.location.href = `mailto:${destinatario}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  }

  sendWhatsApp(event: Event) {
    event.preventDefault();
    // Você pode adicionar campos de nome e mensagem no HTML e pegá-los aqui, se quiser enviar mensagem personalizada.
    // Por simplicidade, vou usar um texto padrão aqui.
    // const nome = (document.getElementById("nome-whatsapp") as HTMLInputElement)?.value || "Usuário";
    // const mensagem = (document.getElementById("mensagem-whatsapp") as HTMLTextAreaElement)?.value || "Gostaria de mais informações.";

    const textoPadrao = encodeURIComponent("Olá, gostaria de mais informações sobre os serviços da FAVEP.");
    const numero = "551632520000"; // Número de WhatsApp da FAVEP

    window.open(`https://wa.me/${numero}?text=${textoPadrao}`, "_blank");
  }
}

