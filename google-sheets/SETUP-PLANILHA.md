# Como ligar o formulário do site ao Google Sheets

Leva uns 5 minutos. Faça com a conta Google da empresa.

1. Acesse https://sheets.new e crie uma planilha. Dê o nome **Elite Prime Clean — Leads**.
2. No menu, clique em **Extensões → Apps Script**.
3. Apague o código que aparece e cole todo o conteúdo do arquivo `google-sheets/Code.gs`.
4. Na linha `NOTIFY_EMAIL`, coloque o e-mail que deve receber um aviso a cada pedido novo
   (ou deixe `""` para não receber e-mail).
5. Clique em **Salvar** (ícone de disquete).
6. Clique em **Implantar → Nova implantação**.
   - Em "Tipo", clique na engrenagem e escolha **App da Web**.
   - **Executar como:** Eu (sua conta).
   - **Quem pode acessar:** Qualquer pessoa.
   - Clique em **Implantar** e depois em **Autorizar acesso**. O Google vai mostrar um aviso
     ("app não verificado"): clique em **Avançado → Acessar (não seguro)**. É normal, porque o
     script é seu.
7. Copie a **URL do app da Web**. Ela termina com `/exec`.
8. Me mande essa URL. Eu coloco no arquivo `assets/js/main.js`, na linha `var SHEETS_URL = "";`.

Pronto: cada pedido vira uma linha na planilha, em abas separadas (**Commercial** e **Residential**).

> Se mudar o código depois, use **Implantar → Gerenciar implantações → Editar → Nova versão**,
> para a URL continuar a mesma.
