# ClickTime V3.1

Aplicação web de foco e contagem regressiva com autenticação por perfil, personalização visual e controles de sessão.

## Visão geral

O ClickTime V3.1 foi projetado para uso simples no dia a dia (usuário final) e controle de recursos por perfil (admin, usuário e convidado).

Principais objetivos:

- produtividade com timer visual;
- experiência moderna (tema, fullscreen, animações e frases motivacionais);
- segurança básica de sessão com regras por contexto de uso.

## Perfis e acesso

Credenciais de demonstração:

- Admin: admin@clicktime.com (ou admin) / 123456
- Usuário: usuario@clicktime.com (ou usuario) / 123456
- Convidado: acesso pelo botão Entrar como Convidado

Cadastro de novos usuários (sem backend):

- Tela dedicada de criação com os campos: Nome e sobrenome, Usuário, Senha e Perfil.
- Cadastro persistido em localStorage por 24h (limpeza automática após expiração).
- Login de usuários novos por Usuário + Senha.

Diferenças de perfil:

- Admin: acesso a ferramentas administrativas completas e gestão de usuários locais.
- Usuário: timer principal com limite de 2h por sessão (ajuste de sessão limitado a no máximo 1h).
- Convidado: timer principal com limite de 45 min por sessão e sessão de login com contagem curta (2 min).

## Funcionalidades principais

- Login com perfil e modo convidado.
- Recuperação de acesso com captcha simples para usuários locais (últimas 24h).
- Gestão de usuários no painel ADM (personalização):
  - listar usuários criados nas últimas 24h;
  - filtrar por perfil (Todos/Admin/Usuário);
  - buscar por nome, usuário ou e-mail técnico;
  - editar senha;
  - excluir usuário (com aviso quando usuário alvo está logado).
- Timer com:
  - data e hora alvo;
  - exibição correta de horas totais (inclusive acima de 24h);
  - barra de progresso (% restante);
  - nome do evento (opcional) para contexto;
  - alerta sonoro ao fim.
- Histórico de focos por usuário (com duração e data/hora).
- Frases motivacionais dinâmicas.
- Personalização:
  - paletas premium;
  - cor personalizada;
  - alternância claro/escuro.
- Sessão visível no painel de personalização:
  - contagem regressiva de sessão;
  - ajuste manual de duração (com controle de permissão por perfil);
  - alertas sonoros de proximidade do encerramento.
- Fullscreen para modo foco.
- Notificação do navegador ao finalizar o timer (quando permitido).

## Lógica de sessão (atual)

- Quando o timer está ativo:
  - não é exibido aviso de “manter sessão”;
  - a expiração automática é adiada para não interromper a contagem.
- Quando não há timer ativo:
  - há carência configurável de 3 ou 4 minutos;
  - após essa carência, a sessão volta a contar normalmente.
- A carência é configurável no painel de personalização.
- Admin pode reduzir manualmente a sessão ativa no painel de personalização.

## Estrutura do projeto

```text
ClickTimeV3/
├─ index.html                 # entrada (redireciona)
└─ app/
   ├─ html/
   │  ├─ login.html
   │  ├─ START.html
   │  ├─ VISUALIZADOR_ADMIN.html
   │  └─ ...
   ├─ sistema/
   │  ├─ sistema.html
   │  ├─ script.js
   │  └─ css/style.css
   ├─ assets/
   │  ├─ Js/
   │  │  ├─ auth-system.js
   │  │  └─ application-ui.js
   │  └─ css/
   └─ docs/
```

## Execução local

Opção recomendada (VS Code + Live Server):

1. Abrir a pasta do projeto no VS Code.
2. Iniciar o Live Server pela raiz do workspace.
3. Acessar a aplicação por index.html.

Também funciona por servidor estático simples (ex.: Python ou Node) desde que o projeto seja servido por HTTP.

## Observações para entrega

- Projeto front-end (HTML/CSS/JS), sem backend.
- Dados de sessão/histórico/tema persistem no localStorage/sessionStorage.
- Usuários criados são locais e temporários (24h), conforme escopo MVP de entrega.
- Recomendado testar em Chrome/Edge atualizados.

## Próximos incrementos sugeridos

- exportar histórico em CSV;
- presets de duração rápida (Pomodoro 25/5, 50/10);
- backend opcional para histórico compartilhado por equipe.
