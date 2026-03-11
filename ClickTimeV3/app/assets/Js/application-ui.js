/**
 * ClickTime V3.1 - Utilitários da Aplicação
 * Gerencia UI da aplicação principal após login
 */

// ============= INTERFACE DE USUÁRIO NA APLICAÇÃO =============
class ApplicationUI {
    constructor() {
        this.TIMER_ACTIVE_STORAGE_KEY = 'clicktime_timer_active';
        this.TIMER_IDLE_SINCE_STORAGE_KEY = 'clicktime_timer_idle_since';
        this.SESSION_IDLE_GRACE_MINUTES_KEY = 'clicktime_session_idle_grace_minutes';
        this.currentTheme = JSON.parse(localStorage.getItem('clicktime_theme') || '"#2e8ae6"');
        this.initializeApp();
    }

    /**
     * Inicializa a aplicação
     */
    initializeApp() {
        this.applyUserProfile();
        if (!this.currentUser) return;

        this.applyTheme();
        this.displayMotivationalPhrase();
        this.startMotivationalRotation(30000);
        this.setupFullscreenMode();
        this.setupSessionStateListeners();
        this.setupSessionExpirationWatcher();
    }

    setupSessionStateListeners() {
        window.addEventListener('clicktime:timer-state', () => {
            this.setupSessionExpirationWatcher();
        });

        window.addEventListener('clicktime:session-grace-changed', () => {
            localStorage.setItem(this.TIMER_IDLE_SINCE_STORAGE_KEY, String(Date.now()));
            this.setupSessionExpirationWatcher();
        });

        window.addEventListener('storage', (event) => {
            if (
                event.key === this.TIMER_ACTIVE_STORAGE_KEY ||
                event.key === this.TIMER_IDLE_SINCE_STORAGE_KEY ||
                event.key === 'clicktime_session_expires_at' ||
                event.key === this.SESSION_IDLE_GRACE_MINUTES_KEY
            ) {
                this.setupSessionExpirationWatcher();
            }
        });
    }

    /**
     * Aplica perfil do usuário à aplicação
     */
    applyUserProfile() {
        const userData = localStorage.getItem('clicktime_user');

        if (!userData && sessionStorage.getItem('clicktime_guest_mode') === '1') {
            this.currentUser = {
                email: 'guest@clicktime.local',
                role: 'user',
                isGuest: true,
                displayName: 'Visitante'
            };
            this.updateUserDisplay(this.currentUser);
            this.applyPermissions(this.currentUser);
            return;
        }

        if (!userData) {
            this.redirectToLogin();
            return;
        }

        try {
            const user = JSON.parse(userData);
            this.currentUser = user;
            this.updateUserDisplay(user);
            this.applyPermissions(user);
        } catch (e) {
            console.error('Erro ao carregar perfil:', e);
            this.redirectToLogin();
        }
    }

    /**
     * Atualiza exibição do nome do usuário
     */
    updateUserDisplay(user) {
        // Procura elementos com IDs convencionais
        const nameElements = document.querySelectorAll(
            '#userName, #nome, .user-name, [data-user-name], .nome, .username-display'
        );

        const displayText = user.isGuest 
            ? '👋 Bem-vindo, Visitante!' 
            : `👋 Bem-vindo, ${user.displayName}!`;

        nameElements.forEach(el => {
            el.textContent = displayText;
        });

        const profileBadge = document.getElementById('profileBadge');
        if (profileBadge) {
            profileBadge.classList.remove('is-admin', 'is-user', 'is-guest');

            if (user.isGuest) {
                profileBadge.classList.add('is-guest');
                profileBadge.textContent = '🚀 Visitante | Perfil Convidado';
            } else if (user.role === 'admin') {
                profileBadge.classList.add('is-admin');
                profileBadge.textContent = `👑 ${user.displayName} | Perfil Admin`;
            } else {
                profileBadge.classList.add('is-user');
                profileBadge.textContent = `👤 ${user.displayName} | Perfil Usuario`;
            }
        }
    }

    /**
     * Aplica permissões baseado no perfil
     */
    applyPermissions(user) {
        if (user.role === 'admin') {
            document.body.classList.add('is-admin');
            this.showAdminFeatures();
        } else {
            document.body.classList.remove('is-admin');
            this.hideAdminFeatures();
        }

        if (user.isGuest) {
            document.body.classList.add('is-guest');
            this.restrictGuestFeatures();
        } else {
            document.body.classList.remove('is-guest');
        }
    }

    /**
     * Mostra features de admin
     */
    showAdminFeatures() {
        const adminElements = document.querySelectorAll('[data-admin-only], .admin-only');
        adminElements.forEach(el => {
            el.style.display = '';
            el.removeAttribute('hidden');
        });
    }

    /**
     * Esconde features de admin
     */
    hideAdminFeatures() {
        const adminElements = document.querySelectorAll('[data-admin-only], .admin-only');
        adminElements.forEach(el => {
            el.style.display = 'none';
            el.setAttribute('hidden', '');
        });
    }

    /**
     * Restringe features para convidados
     */
    restrictGuestFeatures() {
        const guestRestricted = document.querySelectorAll('[data-guest-restricted]');
        guestRestricted.forEach(el => {
            el.style.opacity = '0.5';
            el.style.pointerEvents = 'none';
            el.title = 'Recurso não disponível em modo convidado';
        });
    }

    /**
     * Aplica tema salvo
     */
    applyTheme() {
        const primaryColor = JSON.parse(localStorage.getItem('clicktime_theme') || '"#2e8ae6"');
        document.documentElement.style.setProperty('--primary', primaryColor);
        document.documentElement.style.setProperty('--primary-custom', primaryColor);
    }

    /**
     * Exibe frase motivacional
     */
    displayMotivationalPhrase() {
        const phrase = MotivationalManager.getRandomPhrase();
        
        const phraseElements = document.querySelectorAll(
            '.motivational-phrase, [data-motivational], .phrase-display'
        );

        phraseElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                el.textContent = phrase;
                el.style.opacity = '1';
            }, 500);
        });

        console.log(`%c✨ ${phrase}`, 
            "font-size: 14px; color: #2e8ae6; font-weight: bold;");
    }

    /**
     * Inicia rotação automática de frases motivacionais
     */
    startMotivationalRotation(intervalMs = 30000) {
        if (this._motivationalInterval) {
            clearInterval(this._motivationalInterval);
        }
        this._motivationalInterval = setInterval(() => {
            this.displayMotivationalPhrase();
        }, intervalMs);
    }

    /**
     * Configura modo fullscreen
     */
    setupFullscreenMode() {
        // Procura botão de fullscreen
        const fullscreenBtns = document.querySelectorAll(
            '[data-fullscreen-btn], #fullscreenBtn'
        );

        fullscreenBtns.forEach(btn => {
            btn.addEventListener('click', () => this.enterFullscreenMode());
        });

        // Listener para saída de fullscreen
        document.addEventListener('fullscreenchange', () => {
            this.handleFullscreenChange();
        });
        document.addEventListener('webkitfullscreenchange', () => {
            this.handleFullscreenChange();
        });
    }

    /**
     * Entra em modo fullscreen
     */
    enterFullscreenMode() {
        const elem = document.documentElement;
        
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => {
                console.error(`Erro ao entrar em fullscreen: ${err.message}`);
            });
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }

        // Adiciona visual de fullscreen
        document.body.classList.add('in-fullscreen');
        
        if (window.screen.orientation && window.screen.orientation.lock) {
            try {
                window.screen.orientation.lock('portrait');
            } catch (e) {
                console.warn('Não foi possível travar orientação');
            }
        }
    }

    /**
     * Manipula mudança de fullscreen
     */
    handleFullscreenChange() {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
        
        if (!isFullscreen) {
            document.body.classList.remove('in-fullscreen');
        } else {
            document.body.classList.add('in-fullscreen');
        }
    }

    /**
     * Sai de fullscreen
     */
    exitFullscreenMode() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else if (document.webkitFullscreenElement) {
            document.webkitExitFullscreen();
        }
        document.body.classList.remove('in-fullscreen');
    }

    getDefaultSessionDurationMs() {
        if (typeof AUTH_CONFIG !== 'undefined' && AUTH_CONFIG.SESSION_DEFAULT_MINUTES) {
            return AUTH_CONFIG.SESSION_DEFAULT_MINUTES * 60 * 1000;
        }

        return 120 * 60 * 1000;
    }

    clearSessionTimers() {
        if (this.sessionExpirationTimeout) {
            clearTimeout(this.sessionExpirationTimeout);
            this.sessionExpirationTimeout = null;
        }

        if (this.sessionWarningTimeout) {
            clearTimeout(this.sessionWarningTimeout);
            this.sessionWarningTimeout = null;
        }
    }

    isTimerActive() {
        return localStorage.getItem(this.TIMER_ACTIVE_STORAGE_KEY) === '1';
    }

    getTimerIdleSince() {
        const raw = localStorage.getItem(this.TIMER_IDLE_SINCE_STORAGE_KEY);
        const parsed = Number(raw);

        if (!raw || Number.isNaN(parsed) || parsed <= 0) {
            const now = Date.now();
            localStorage.setItem(this.TIMER_IDLE_SINCE_STORAGE_KEY, String(now));
            return now;
        }

        return parsed;
    }

    getSessionIdleGraceMs() {
        const raw = localStorage.getItem(this.SESSION_IDLE_GRACE_MINUTES_KEY);
        const parsed = Number(raw);
        const minutes = parsed === 3 ? 3 : 4;
        return minutes * 60 * 1000;
    }

    deferSessionCheck(ms = 30000) {
        this.clearSessionTimers();
        this.sessionExpirationTimeout = setTimeout(() => {
            this.setupSessionExpirationWatcher();
        }, ms);
    }

    setupSessionExpirationWatcher() {
        this.clearSessionTimers();

        if (this.isTimerActive()) {
            this.deferSessionCheck(30000);
            return;
        }

        const idleSince = this.getTimerIdleSince();
        const idleElapsed = Date.now() - idleSince;
        const graceRemaining = this.getSessionIdleGraceMs() - idleElapsed;

        if (graceRemaining > 0) {
            const desiredMinExpiry = Date.now() + graceRemaining + this.getDefaultSessionDurationMs();
            const currentExpiry = Number(localStorage.getItem('clicktime_session_expires_at'));
            const manuallyReduced = localStorage.getItem('clicktime_session_manually_reduced') === '1';

            if (!manuallyReduced && (!currentExpiry || Number.isNaN(currentExpiry) || currentExpiry < desiredMinExpiry)) {
                authManager.setSessionExpiry(desiredMinExpiry);
            }

            this.deferSessionCheck(Math.min(graceRemaining, 60000));
            return;
        }

        const expiresAtRaw = localStorage.getItem('clicktime_session_expires_at');
        const expiresAt = Number(expiresAtRaw);

        if (!expiresAtRaw || Number.isNaN(expiresAt)) {
            const renewedExpiry = Date.now() + this.getDefaultSessionDurationMs();
            authManager.setSessionExpiry(renewedExpiry);
            this.setupSessionExpirationWatcher();
            return;
        }

        const msRemaining = expiresAt - Date.now();

        if (msRemaining <= 0) {
            this.forceSessionExpiration();
            return;
        }

        const warningOffsetMs = 2 * 60 * 1000;
        const warningInMs = msRemaining - warningOffsetMs;

        if (warningInMs > 0) {
            this.sessionWarningTimeout = setTimeout(() => {
                this.showSessionExpiringWarning();
            }, warningInMs);
        }

        this.sessionExpirationTimeout = setTimeout(() => {
            this.forceSessionExpiration();
        }, msRemaining);
    }

    showSessionExpiringWarning() {
        if (this.isTimerActive()) {
            this.setupSessionExpirationWatcher();
            return;
        }

        Swal.fire({
            title: 'Sua sessão expira em 2 minutos ⏳',
            text: 'Deseja continuar logado?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Continuar sessão',
            cancelButtonText: 'Encerrar'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('clicktime_session_manually_reduced');
                const renewedExpiry = Date.now() + this.getDefaultSessionDurationMs();
                authManager.setSessionExpiry(renewedExpiry);

                Swal.fire({
                    title: 'Sessão renovada ✅',
                    text: 'Você continua logado.',
                    icon: 'success',
                    timer: 1400,
                    showConfirmButton: false
                });

                this.setupSessionExpirationWatcher();
            }
        });
    }

    forceSessionExpiration() {
        if (this.isTimerActive()) {
            this.setupSessionExpirationWatcher();
            return;
        }

        this.clearSessionTimers();

        Swal.fire({
            title: 'Sessão encerrada ⏳',
            text: 'Seu tempo de sessão terminou. Faça login novamente.',
            icon: 'info',
            timer: 2200,
            showConfirmButton: false
        }).then(() => {
            authManager.logout();
        });
    }

    /**
     * Redireciona para login
     */
    redirectToLogin() {
        Swal.fire({
            title: 'Sessão Expirada',
            text: 'Por favor, faça login novamente',
            icon: 'warning',
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            window.location.href = '../html/login.html';
        });
    }

    /**
     * Logout
     */
    logout() {
        Swal.fire({
            title: 'Desconectado! 👋',
            text: 'Você foi desconectado com sucesso',
            icon: 'info',
            timer: 1500,
            showConfirmButton: false
        }).then(() => {
            authManager.logout();
        });
    }

    /**
     * Get usuário atual
     */
    getCurrentUser() {
        return this.currentUser;
    }
}

// ============= GERENCIADOR DE TEMPORIZADOR AVANÇADO =============
class AdvancedTimer {
    constructor(elementId = 'timer') {
        this.timerElement = document.getElementById(elementId);
        this.isRunning = false;
        this.totalSeconds = 0;
        this.remainingSeconds = 0;
        this.interval = null;
        this.onTimeEnd = null;
    }

    /**
     * Inicia temporizador
     */
    start(minutes) {
        if (this.isRunning) return;
        
        this.totalSeconds = minutes * 60;
        this.remainingSeconds = this.totalSeconds;
        this.isRunning = true;

        // Exibe frase motivacional ao iniciar
        if (window.appUI) {
            appUI.displayMotivationalPhrase();
        }

        this.interval = setInterval(() => {
            this.remainingSeconds--;
            this.updateDisplay();

            if (this.remainingSeconds <= 0) {
                this.stop();
                if (this.onTimeEnd) this.onTimeEnd();
            }
        }, 1000);
    }

    /**
     * Para temporizador
     */
    stop() {
        this.isRunning = false;
        clearInterval(this.interval);
    }

    /**
     * Pausa temporizador
     */
    pause() {
        this.isRunning = false;
        clearInterval(this.interval);
    }

    /**
     * Retoma temporizador
     */
    resume() {
        if (!this.isRunning && this.remainingSeconds > 0) {
            this.isRunning = true;
            this.interval = setInterval(() => {
                this.remainingSeconds--;
                this.updateDisplay();

                if (this.remainingSeconds <= 0) {
                    this.stop();
                    if (this.onTimeEnd) this.onTimeEnd();
                }
            }, 1000);
        }
    }

    /**
     * Atualiza display do timer
     */
    updateDisplay() {
        if (!this.timerElement) return;

        const minutes = Math.floor(this.remainingSeconds / 60);
        const seconds = this.remainingSeconds % 60;

        this.timerElement.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Muda cor se crítico (< 1 minuto)
        if (this.remainingSeconds < 60 && this.remainingSeconds > 0) {
            this.timerElement.style.color = '#ff6b6b';
        } else {
            this.timerElement.style.color = '';
        }
    }

    /**
     * Reseta temporizador
     */
    reset() {
        this.stop();
        this.remainingSeconds = 0;
        this.totalSeconds = 0;
        this.updateDisplay();
    }

    /**
     * Obtém tempo restante em segundos
     */
    getRemainingTime() {
        return this.remainingSeconds;
    }

    /**
     * Verifica se está executando
     */
    isActive() {
        return this.isRunning;
    }
}

// ============= GERENCIADOR DE NOTIFICAÇÕES =============
class NotificationManager {
    /**
     * Mostra notificação elegante
     */
    static success(title, message = '', timer = 2000) {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'success',
            timer: timer,
            showConfirmButton: false,
            position: 'top-end',
            toast: true
        });
    }

    /**
     * Mostra erro
     */
    static error(title, message = '') {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'error',
            confirmButtonText: 'Ok'
        });
    }

    /**
     * Mostra aviso
     */
    static warning(title, message = '', confirmText = 'Ok') {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'warning',
            confirmButtonText: confirmText
        });
    }

    /**
     * Mostra info
     */
    static info(title, message = '') {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'info',
            confirmButtonText: 'Ok'
        });
    }

    /**
     * Mostra confirmação
     */
    static confirm(title, message = '', confirmText = 'Sim', cancelText = 'Cancelar') {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText
        });
    }
}

// ============= CSS PARA FULLSCREEN =============
const fullscreenStyles = `
.in-fullscreen #timer,
.in-fullscreen .timer-display {
    font-size: 4rem;
    text-align: center;
    color: var(--primary, #2e8ae6);
    text-shadow: 0 0 10px rgba(46, 138, 230, 0.5);
}

.in-fullscreen .motivational-phrase,
.in-fullscreen [data-motivational] {
    font-size: 1.8rem;
    text-align: center;
    margin-top: 30px;
    color: #fff;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes glow {
    0%, 100% { text-shadow: 0 0 10px rgba(46, 138, 230, 0.5); }
    50% { text-shadow: 0 0 20px rgba(46, 138, 230, 1); }
}
`;

// Injeta estilos de fullscreen
const styleSheet = document.createElement('style');
styleSheet.textContent = fullscreenStyles;
document.head.appendChild(styleSheet);

// ============= INICIALIZADORES GLOBAIS =============
let appUI;
let advancedTimer;

document.addEventListener('DOMContentLoaded', () => {
    appUI = new ApplicationUI();
    advancedTimer = new AdvancedTimer('timer');
    
    console.log('✅ Application UI Carregada com sucesso!');
});

// Função de logout global
function logout() {
    if (appUI) {
        appUI.logout();
    }
}

// Função de fullscreen global  
function toggleFullscreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        appUI?.exitFullscreenMode();
    } else {
        appUI?.enterFullscreenMode();
    }
}
