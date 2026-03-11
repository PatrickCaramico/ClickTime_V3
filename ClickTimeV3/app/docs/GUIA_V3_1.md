# ClickTime V3.1 - Guia de Implementação

## 🎉 Novidades da V3.1

### ✅ Funcionalidades Implementadas

#### 1. **Sistema de "Esqueci a Senha" com Captcha Simples**

- Modal elegante com SweetAlert2
- Desafio matemático simples (soma aleatória)
- Simulação de envio de código de recuperação
- Código armazenado no localStorage para demonstração

**Fluxo:**

1. Usuário clica em "Esqueci minha senha"
2. Abre modal pedindo e-mail
3. Exibe desafio matemático
4. Ao acertar o resultado, simula envio de código

#### 2. **Perfis: ADM vs Usuário**

- Dois tipos de credenciais de demonstração:
  - **Admin**: admin@inventario.com / 123456
  - **Usuário**: funcionario@inventario.com / 123456
- UI diferenciada para admin com painel de customização
- Sistema de permissões com classes CSS

**Credenciais Disponíveis:**

```json
{
  "admin": {
    "email": "admin@inventario.com",
    "password": "123456",
    "role": "admin"
  },
  "user": {
    "email": "funcionario@inventario.com",
    "password": "123456",
    "role": "user"
  }
}
```

#### 3. **Guest Mode (Modo Convidado)**

- Botão "Entrar como Convidado" no login
- Acesso limitado com restrições visuais
- Identificação como "Visitante"
- localStorage: `userName: 'Visitante'`

#### 4. **Customização de Cores (Admin Only)**

- Painel lateral exclusivo para administradores
- Seletor de cores nativo do sistema
- Presets de paletas prontas:
  - **Foco Profundo**: #2e8ae6
  - **Energia**: #ff8c42
  - **Relax**: #2ecc71
- Cores salvas persistem entre sessões

#### 5. **Frases Motivacionais Aleatórias**

- 10 frases diferentes incluídas
- Exibidas ao:
  - Entrar na página
  - Iniciar uma sessão de foco
  - Ao abrir a aplicação
- Aparecem no console e na UI

#### 6. **Modo Foco Extremo com Fullscreen API**

- Botão "Fullscreen" na página de aplicação
- Ativa modo tela cheia do navegador
- Timer em tamanho gigante
- Frase motivacional ampliada
- Suporte para orientação fixa (retrato)

**Tecla de saída:**

- ESC para sair do fullscreen

#### 7. **Presets de Paletas de Cores**

Três presets visuais:

| Preset          | Cor     | Uso                  |
| --------------- | ------- | -------------------- |
| 😎 Professional | #2e8ae6 | Foco profundo        |
| ⚡ Energia      | #ff8c42 | Produtividade máxima |
| 🌿 Relax        | #2ecc71 | Ambiente calmo       |

---

## 📁 Estrutura de Arquivos

### Novos Arquivos Criados:

```
assets/Js/
├── auth-system.js          # Sistema de autenticação (novo)
├── application-ui.js       # UI da aplicação (novo)
└── login.js               # (mantido para compatibilidade)

login.html                  # Nova página de login principal
├── (substitui index.html como entrada do login)
```

### Arquivos Modificados:

```
index.html                  # Redirecionado para login.html
sistema/
└── sistema.html           # Integrado com novo auth system
```

---

## 🔐 Sistema de Autenticação

### Classe: `AuthManager`

```javascript
// Login
const result = authManager.login(email, password);
if (result.success) {
  console.log(result.user); // { email, role, displayName, isGuest }
}

// Login como convidado
authManager.loginAsGuest();

// Verificar se autenticado
authManager.isAuthenticated();

// Logout
authManager.logout();

// Verificar se é admin
authManager.isAdmin();
```

### Classe: `User`

```javascript
// Propriedades
user.email; // E-mail do usuário
user.role; // 'admin' ou 'user'
user.isGuest; // booleano
user.displayName; // Nome exibível
user.themeColor; // Cor do tema salvo
user.loginTime; // Timestamp do login

// Métodos
user.isAdmin(); // Retorna se é administrador
user.getDisplayName(); // Obtém nome para exibição
```

---

## 🎨 Sistema de Temas

### Classe: `ThemeManager`

```javascript
// Definir cor customizada
themeManager.setTheme("#ff5733");

// Aplicar preset
themeManager.applyPreset("professional");
themeManager.applyPreset("energy");
themeManager.applyPreset("relax");

// Obter cor atual
const color = themeManager.getPrimaryColor(); // #2e8ae6

// Cores são salvas em localStorage
// localStorage.setItem('clicktime_theme', '#2e8ae6')
```

---

## 💬 Sistema de Frases Motivacionais

### Classe: `MotivationalManager`

```javascript
// Obter frase aleatória
const phrase = MotivationalManager.getRandomPhrase();
// → "Você está no caminho certo, continue focado! 🚀"

// Obter todas as frases
const allPhrases = MotivationalManager.getAllPhrases();
```

### Frases Incluídas:

1. "Você está no caminho certo, continue focado! 🚀"
2. "Cada segundo conta, aproveite seu tempo! ⏱️"
3. "Foco total = Resultados extraordinários! 💪"
4. "Você é capaz de tudo que se propuser! ✨"
5. "Concentração é a chave do sucesso! 🔑"
6. "Sua dedicação vai dar frutos! 🌱"
7. "Você está fazendo um ótimo trabalho! 👏"
8. "Mantenha a persistência, o sucesso vem! 🎯"
9. "Seu esforço vale a pena! 💎"
10. "Você merece este momento de foco! 🌟"

---

## 🎯 Sistema Captcha

### Classe: `CaptchaManager`

```javascript
// Gerar novo desafio
captchaManager.generateChallenge();
// → "12 + 35 = ?"

// Verificar resposta
const isCorrect = captchaManager.verify(47);
// → true

// Obter desafio atual
const challenge = captchaManager.getChallenge();

// Resetar para novo desafio
captchaManager.reset();
```

---

## 🖥️ Classe ApplicationUI

Gerencia a interface da aplicação após login:

```javascript
// Inicializa automaticamente
// Disponível como variável global: appUI

appUI.getCurrentUser(); // Obtém usuário atual
appUI.applyUserProfile(); // Aplica perfil visual
appUI.logout(); // Realiza logout
appUI.enterFullscreenMode(); // Ativa tela cheia
appUI.exitFullscreenMode(); // Sai de tela cheia
```

---

## 📱 Classe AdvancedTimer

Temporizador avançado para sessões de foco:

```javascript
const timer = new AdvancedTimer("timer");

// Iniciar temporizador (em minutos)
timer.start(25); // Inicia Pomodoro de 25 min

// Controles
timer.pause(); // Pausa
timer.resume(); // Retoma
timer.stop(); // Para completamente
timer.reset(); // Reseta

// Callbacks
timer.onTimeEnd = () => {
  console.log("Tempo acabou!");
};

// Status
timer.getRemainingTime(); // Segundos restantes
timer.isActive(); // Se está rodando
```

---

## 🎤 Classe NotificationManager

Notificações elegantes com SweetAlert2:

```javascript
// Sucesso
NotificationManager.success("Pronto!", "Tudo funcionando");

// Erro
NotificationManager.error("Oops!", "Algo deu errado");

// Aviso
NotificationManager.warning("Atenção", "Tem certeza?");

// Info
NotificationManager.info("Informação", "Conheça as novidades");

// Confirmação
NotificationManager.confirm("Deseja continuar?").then((result) => {
  if (result.isConfirmed) {
    console.log("Confirmado!");
  }
});
```

---

## 🔒 localStorage - Dados Salvos

```javascript
// Usuário autenticado
localStorage.getItem("clicktime_user");
// {
//   "email": "admin@inventario.com",
//   "role": "admin",
//   "displayName": "admin",
//   "isGuest": false,
//   "themeColor": "#2e8ae6",
//   "loginTime": "2024-..."
// }

// Tema customizado
localStorage.getItem("clicktime_theme");
// "#ff5733"
```

---

## 🚀 Como Usar

### 1. **Primeiro Acesso**

1. Abra `index.html` (redireciona para `login.html`)
2. Use uma das credenciais demo
3. Sistema detecta se é admin e mostra recursos extras

### 2. **Como Admin**

1. Faça login com `admin@inventario.com / 123456`
2. Veja o painel lateral mostrando customizações
3. Escolha um preset ou customize a cor
4. Mudanças refletem no tema em tempo real

### 3. **Modo Convidado**

1. Clique em "Entrar como Convidado"
2. Confirmação com SweetAlert2
3. Redirecionado com restrições visuais
4. Acesso limitado a recursos específicos

### 4. **Fullscreen Extremo**

1. Clique em "Fullscreen" na página da aplicação
2. Timer ocupa tela inteira
3. Frase motivacional ampliada
4. Pressione ESC para sair

### 5. **Esqueci a Senha**

1. Clique em "Esqueci minha senha"
2. Digite seu e-mail
3. Resolva o desafio matemático
4. Simulação de envio de código

---

## 🔧 Integração em HTML Existente

Para adicionar os novos recursos a uma página existente:

```html
<!-- No <head> -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<!-- Antes de </body> -->
<script src="./assets/Js/auth-system.js"></script>
<script src="./assets/Js/application-ui.js"></script>
```

### Elementos Especiais:

```html
<!-- Frase motivacional -->
<div class="motivational-phrase" data-motivational></div>

<!-- Botão fullscreen -->
<button onclick="toggleFullscreen()">🖥️ Fullscreen</button>

<!-- Recursos admin -->
<div class="admin-only">Apenas para admins</div>
<div data-admin-only>Alternativa de attribute</div>

<!-- Recursos restritos para convidados -->
<div data-guest-restricted>Não disponível para convidados</div>

<!-- Logout -->
<button onclick="logout()">Logout</button>
```

---

## 📊 Classes CSS Aplicadas

```css
/* Quando admin está logado */
body.is-admin {
  /* Fundo diferente, mais escuro */
  /* Mostra painel de customização */
}

/* Quando em modo fullscreen */
body.in-fullscreen {
  /* Fundo preto, elementos ampliados */
  /* Modo foco extremo */
}

/* Quando convidado */
body.is-guest {
  /* Elementos com opacity reduzida */
}
```

---

## 🎓 Exemplos de Uso

### Login com Validação Customizada

```javascript
const emailInput = document.querySelector('input[type="email"]');
const passwordInput = document.querySelector('input[type="password"]');

function handleCustomLogin() {
  const email = emailInput.value;
  const password = passwordInput.value;

  const result = authManager.login(email, password);

  if (result.success) {
    const user = result.user;
    console.log(`Bem-vindo, ${user.getDisplayName()}!`);
    // Aplicar perfil
    if (user.isAdmin()) {
      console.log("Acessando painel admin...");
    }
  } else {
    console.error(result.message);
  }
}
```

### Aplicar Tema Dinâmico

```javascript
function changeThemeToEnergyMode() {
  themeManager.applyPreset("energy");
  NotificationManager.success("Tema aplicado! ⚡");
}

function setCustomColor() {
  const colorPicker = document.getElementById("colorInput");
  themeManager.setTheme(colorPicker.value);
}
```

### Iniciar Sessão com Motivação

```javascript
function startFocusSession() {
  const phrase = MotivationalManager.getRandomPhrase();
  NotificationManager.info("Hora de focar! 🎯", phrase);

  // Inicia timer de 25 min
  advancedTimer.start(25);
  advancedTimer.onTimeEnd = () => {
    NotificationManager.success("Parabéns!", "Sessão concluída!");
  };
}
```

---

## 🐛 Troubleshooting

### "Não consigo entrar como admin"

- Verifique: `admin@inventario.com` / `123456`
- localStorage pode estar bloqueado (modo privado)

### "Frases não aparecem"

- Verifique se `application-ui.js` está carregado
- Abra DevTools (F12) e veja console

### "Fullscreen não funciona"

- Não suportado em alguns navegadores antigos
- Tente Chrome/Firefox/Edge recente

### "Cores não persistem após reload"

- Verifique localStorage: `localStorage.getItem('clicktime_theme')`
- Considere modo privado do navegador

---

## 📝 Notas Importantes

1. **localStorage está ativado**: O sistema depende do localStorage para persistência
2. **SweetAlert2 é obrigatório**: Adicione via CDN (já incluído em login.html)
3. **Email real não é enviado**: É uma simulação para demo
4. **Segurança**: Para produção, implemente autenticação real backend

---

## 🎯 Próximas Melhorias Sugeridas

- [ ] Backend de autenticação real
- [ ] Envio de email de recuperação
- [ ] Sistema de 2FA (autenticação de dois fatores)
- [ ] Mais presets de temas
- [ ] Histórico de sessões de foco
- [ ] Estatísticas de produtividade
- [ ] Modo offline com sincronização

---

**ClickTime V3.1** © 2024 | Desenvolvido por Patrick Souza
