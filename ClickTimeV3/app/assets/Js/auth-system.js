/**
 * ClickTime V3.1 - Sistema de Autenticação Completo
 * Gerencia login, perfis, customização de cores e mais
 */

// ============= CONFIGURAÇÕES INICIAIS =============
const AUTH_CONFIG = {
    SESSION_DEFAULT_MINUTES: 120,
    ADMIN_CREDENTIALS: {
        email: 'admin@clicktime.com',
        password: '123456',
        role: 'admin'
    },
    USER_CREDENTIALS: {
        email: 'usuario@clicktime.com',
        password: '123456',
        role: 'user'
    },
    THEME_PRESETS: {
        professional: { name: 'Foco Profundo', color: '#2e8ae6' },
        energy: { name: 'Energia', color: '#ff8c42' },
        relax: { name: 'Relax', color: '#2ecc71' }
    },
    MOTIVATIONAL_PHRASES: [
        "Você está no caminho certo, continue focado! 🚀",
        "Cada segundo conta, aproveite seu tempo! ⏱️",
        "Foco total = Resultados extraordinários! 💪",
        "Você é capaz de tudo que se propuser! ✨",
        "Concentração é a chave do sucesso! 🔑",
        "Sua dedicação vai dar frutos! 🌱",
        "Você está fazendo um ótimo trabalho! 👏",
        "Mantenha a persistência, o sucesso vem! 🎯",
        "Seu esforço vale a pena! 💎",
        "Você merece este momento de foco! 🌟"
    ]
};

// ============= CLASSE DE USUÁRIO =============
class User {
    constructor(email, role = 'user', isGuest = false, displayName = null) {
        this.email = email;
        this.role = role;
        this.isGuest = isGuest;
        this.displayName = isGuest ? 'Visitante' : (displayName || email.split('@')[0]);
        this.loginTime = new Date();
        this.themeColor = AUTH_CONFIG.THEME_PRESETS.professional.color;
    }

    isAdmin() {
        return this.role === 'admin';
    }

    getDisplayName() {
        return this.displayName;
    }

    toJSON() {
        return {
            email: this.email,
            role: this.role,
            displayName: this.displayName,
            isGuest: this.isGuest,
            themeColor: this.themeColor,
            loginTime: this.loginTime
        };
    }

    static fromJSON(data) {
        const user = new User(data.email, data.role, data.isGuest);
        user.displayName = data.displayName;
        user.themeColor = data.themeColor;
        user.loginTime = data.loginTime;
        return user;
    }
}

// ============= GERENCIADOR DE AUTENTICAÇÃO =============
class AuthManager {
    constructor() {
        this.REGISTERED_USERS_KEY = 'clicktime_registered_users';
        this.REGISTERED_USERS_TTL_MS = 24 * 60 * 60 * 1000;
        this.currentUser = null;
        this.purgeExpiredRegisteredUsers();
        this.loadUser();
    }

    normalizeEmail(email) {
        return String(email || '').trim().toLowerCase();
    }

    normalizeIdentifier(value) {
        return String(value || '').trim().toLowerCase();
    }

    extractUsernameFromEmail(email) {
        const normalizedEmail = this.normalizeEmail(email);
        const atIndex = normalizedEmail.indexOf('@');
        if (atIndex <= 0) return normalizedEmail;
        return normalizedEmail.slice(0, atIndex);
    }

    getDefaultUsers() {
        return [
            {
                email: this.normalizeEmail(AUTH_CONFIG.ADMIN_CREDENTIALS.email),
                username: this.extractUsernameFromEmail(AUTH_CONFIG.ADMIN_CREDENTIALS.email),
                password: AUTH_CONFIG.ADMIN_CREDENTIALS.password,
                role: AUTH_CONFIG.ADMIN_CREDENTIALS.role,
                displayName: 'Administrador',
                source: 'default'
            },
            {
                email: this.normalizeEmail(AUTH_CONFIG.USER_CREDENTIALS.email),
                username: this.extractUsernameFromEmail(AUTH_CONFIG.USER_CREDENTIALS.email),
                password: AUTH_CONFIG.USER_CREDENTIALS.password,
                role: AUTH_CONFIG.USER_CREDENTIALS.role,
                displayName: 'Usuário',
                source: 'default'
            }
        ];
    }

    getRegisteredUsers() {
        const raw = localStorage.getItem(this.REGISTERED_USERS_KEY);
        if (!raw) return [];

        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];

            return parsed.filter((item) =>
                item &&
                typeof item.fullName === 'string' &&
                typeof item.email === 'string' &&
                typeof item.password === 'string' &&
                (item.role === 'admin' || item.role === 'user') &&
                Number.isFinite(Number(item.createdAt))
            );
        } catch (_) {
            return [];
        }
    }

    saveRegisteredUsers(users) {
        localStorage.setItem(this.REGISTERED_USERS_KEY, JSON.stringify(users));
    }

    purgeExpiredRegisteredUsers() {
        const now = Date.now();
        const users = this.getRegisteredUsers();
        const filtered = users
            .filter((item) => now - Number(item.createdAt) <= this.REGISTERED_USERS_TTL_MS)
            .map((item) => ({
                ...item,
                email: this.normalizeEmail(item.email),
                username: this.normalizeIdentifier(item.username || this.extractUsernameFromEmail(item.email))
            }));

        if (filtered.length !== users.length) {
            this.saveRegisteredUsers(filtered);
        }

        return filtered;
    }

    listRecentRegisteredUsers() {
        return this.purgeExpiredRegisteredUsers();
    }

    findUserByIdentifier(identifier) {
        const normalized = this.normalizeIdentifier(identifier);
        if (!normalized) return null;

        const registeredUsers = this.purgeExpiredRegisteredUsers();

        const localUser = registeredUsers.find((item) => {
            const userEmail = this.normalizeEmail(item.email);
            const userName = this.normalizeIdentifier(item.username || this.extractUsernameFromEmail(item.email));
            return normalized === userEmail || normalized === userName;
        });

        if (localUser) {
            return {
                id: localUser.id,
                email: this.normalizeEmail(localUser.email),
                username: this.normalizeIdentifier(localUser.username || this.extractUsernameFromEmail(localUser.email)),
                password: localUser.password,
                role: localUser.role,
                displayName: localUser.fullName,
                source: 'local'
            };
        }

        return this.getDefaultUsers().find(
            (item) => normalized === item.email || normalized === item.username,
        ) || null;
    }

    findUserByEmail(email) {
        return this.findUserByIdentifier(email);
    }

    registerUser({ fullName, username, email, password, role }) {
        const normalizedUsername = this.normalizeIdentifier(username || this.extractUsernameFromEmail(email));
        const normalizedEmail = this.normalizeEmail(email || `${normalizedUsername}@clicktime.local`);
        const normalizedRole = role === 'admin' ? 'admin' : 'user';
        const normalizedFullName = String(fullName || '').trim();
        const normalizedPassword = String(password || '').trim();

        if (!normalizedFullName || normalizedFullName.length < 3) {
            return { success: false, message: 'Informe nome e sobrenome válidos.' };
        }

        if (!normalizedUsername || normalizedUsername.length < 3) {
            return { success: false, message: 'Informe um usuário válido (mínimo 3 caracteres).' };
        }

        if (!normalizedPassword || normalizedPassword.length < 4) {
            return { success: false, message: 'A senha deve ter pelo menos 4 caracteres.' };
        }

        if (this.findUserByIdentifier(normalizedUsername)) {
            return { success: false, message: 'Este usuário já está em uso.' };
        }

        if (this.findUserByIdentifier(normalizedEmail)) {
            return { success: false, message: 'Conflito interno de cadastro. Tente outro usuário.' };
        }

        const registeredUsers = this.purgeExpiredRegisteredUsers();
        registeredUsers.push({
            id: `u_${Date.now()}`,
            fullName: normalizedFullName,
            email: normalizedEmail,
            username: normalizedUsername,
            password: normalizedPassword,
            role: normalizedRole,
            createdAt: Date.now()
        });

        this.saveRegisteredUsers(registeredUsers);
        return { success: true };
    }

    resetPasswordByEmail(email, newPassword) {
        const normalizedEmail = this.normalizeEmail(email);
        const normalizedPassword = String(newPassword || '').trim();

        if (!normalizedPassword || normalizedPassword.length < 4) {
            return { success: false, message: 'A nova senha deve ter pelo menos 4 caracteres.' };
        }

        const users = this.purgeExpiredRegisteredUsers();
        const targetIndex = users.findIndex((item) => this.normalizeEmail(item.email) === normalizedEmail);

        if (targetIndex < 0) {
            return { success: false, message: 'Usuário não encontrado para recuperação.' };
        }

        users[targetIndex].password = normalizedPassword;
        this.saveRegisteredUsers(users);
        return { success: true };
    }

    updateRegisteredUserPasswordById(userId, newPassword) {
        const normalizedUserId = String(userId || '').trim();
        const normalizedPassword = String(newPassword || '').trim();

        if (!normalizedUserId) {
            return { success: false, message: 'Usuário inválido.' };
        }

        if (!normalizedPassword || normalizedPassword.length < 4) {
            return { success: false, message: 'A senha deve ter pelo menos 4 caracteres.' };
        }

        const users = this.purgeExpiredRegisteredUsers();
        const targetIndex = users.findIndex((item) => String(item.id) === normalizedUserId);

        if (targetIndex < 0) {
            return { success: false, message: 'Usuário não encontrado.' };
        }

        users[targetIndex].password = normalizedPassword;
        this.saveRegisteredUsers(users);
        return { success: true };
    }

    deleteRegisteredUserById(userId) {
        const normalizedUserId = String(userId || '').trim();
        if (!normalizedUserId) {
            return { success: false, message: 'Usuário inválido.' };
        }

        const users = this.purgeExpiredRegisteredUsers();
        const targetIndex = users.findIndex((item) => String(item.id) === normalizedUserId);

        if (targetIndex < 0) {
            return { success: false, message: 'Usuário não encontrado.' };
        }

        users.splice(targetIndex, 1);
        this.saveRegisteredUsers(users);
        return { success: true };
    }

    /**
     * Realiza login com email e senha
     */
    login(identifier, password) {
        const normalizedIdentifier = this.normalizeIdentifier(identifier);
        const userRecord = this.findUserByIdentifier(normalizedIdentifier);

        if (userRecord && userRecord.password === password) {
            this.currentUser = new User(
                userRecord.email,
                userRecord.role,
                false,
                userRecord.displayName
            );

            sessionStorage.removeItem('clicktime_guest_mode');
            this.setSessionExpiry(Date.now() + AUTH_CONFIG.SESSION_DEFAULT_MINUTES * 60 * 1000);
            this.saveUser();
            return { success: true, user: this.currentUser };
        }

        return { success: false, message: 'Credenciais inválidas.' };
    }

    /**
     * Realiza login como convidado (Guest Mode)
     */
    loginAsGuest() {
        this.currentUser = new User('guest@clicktime.local', 'user', true);
        localStorage.removeItem('clicktime_user');
        localStorage.removeItem('clicktime_session_expires_at');
        sessionStorage.removeItem('clicktime_guest_session_end');
        sessionStorage.setItem('clicktime_guest_mode', '1');
        return { success: true, user: this.currentUser };
    }

    /**
     * Faz logout e limpa dados
     */
    logout() {
        this.currentUser = null;
        localStorage.removeItem('clicktime_user');
        localStorage.removeItem('clicktime_session_expires_at');
        localStorage.removeItem('clicktime_theme');
        sessionStorage.removeItem('clicktime_guest_mode');
        sessionStorage.removeItem('clicktime_guest_session_end');
        // Limpa classes CSS do body
        document.body.classList.remove('is-admin', 'is-guest', 'in-fullscreen');
        const pathname = window.location.pathname;
        const needsParent = pathname.includes('tela_contagem') || pathname.includes('sistema');
        const loginPath = needsParent ? '../html/login.html' : './login.html';

        // Redireciona para login após 500ms
        setTimeout(() => {
            window.location.href = loginPath;
        }, 500);
    }

    setSessionExpiry(expiresAt) {
        localStorage.setItem('clicktime_session_expires_at', String(expiresAt));
    }

    getSessionExpiry() {
        const value = localStorage.getItem('clicktime_session_expires_at');
        return value ? Number(value) : null;
    }

    /**
     * Salva usuário no localStorage
     */
    saveUser() {
        if (this.currentUser && !this.currentUser.isGuest) {
            localStorage.setItem('clicktime_user', JSON.stringify(this.currentUser.toJSON()));
        }
    }

    /**
     * Carrega usuário do localStorage
     */
    loadUser() {
        const userData = localStorage.getItem('clicktime_user');
        if (userData) {
            try {
                const data = JSON.parse(userData);
                const loadedUser = User.fromJSON(data);
                const sessionExpiry = this.getSessionExpiry();

                if (loadedUser.isGuest) {
                    localStorage.removeItem('clicktime_user');
                    localStorage.removeItem('clicktime_session_expires_at');
                    this.currentUser = null;
                    return;
                }

                if (!sessionExpiry || Number.isNaN(sessionExpiry) || Date.now() > sessionExpiry) {
                    localStorage.removeItem('clicktime_user');
                    localStorage.removeItem('clicktime_session_expires_at');
                    this.currentUser = null;
                    return;
                }

                this.currentUser = loadedUser;
            } catch (e) {
                console.error('Erro ao carregar usuário:', e);
                this.currentUser = null;
            }
        }
    }

    /**
     * Verifica se usuário está autenticado
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Obtém usuário atual
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Verifica se é admin
     */
    isAdmin() {
        return this.currentUser && this.currentUser.isAdmin();
    }
}

// ============= GERENCIADOR DE TEMA =============
class ThemeManager {
    constructor() {
        this.primaryColor = this.loadTheme() || AUTH_CONFIG.THEME_PRESETS.professional.color;
        this.applyTheme(this.primaryColor);
    }

    /**
     * Define a cor primária do tema
     */
    setTheme(colorHex) {
        if (!this.isValidHex(colorHex)) return false;
        
        this.primaryColor = colorHex;
        this.applyTheme(colorHex);
        this.saveTheme(colorHex);
        return true;
    }

    /**
     * Aplica o tema ao documento
     */
    applyTheme(colorHex) {
        document.documentElement.style.setProperty('--primary-custom', colorHex);
        
        // Aplicar em elementos críticos
        const elements = {
            '.btn-primary': { backgroundColor: colorHex },
            'input:focus': { borderColor: colorHex, outlineColor: `${colorHex}40` }
        };

        // Se não temos suporte a CSS vars, aplicar direto
        const primaryButtons = document.querySelectorAll('.btn-primary');
        primaryButtons.forEach(btn => btn.style.background = `linear-gradient(90deg, ${colorHex} 0%, ${this.adjustBrightness(colorHex, -15)} 100%)`);
    }

    /**
     * Salva tema no localStorage
     */
    saveTheme(colorHex) {
        localStorage.setItem('clicktime_theme', colorHex);
    }

    /**
     * Carrega tema do localStorage
     */
    loadTheme() {
        return localStorage.getItem('clicktime_theme');
    }

    /**
     * Aplica preset de tema
     */
    applyPreset(presetName) {
        const preset = AUTH_CONFIG.THEME_PRESETS[presetName];
        if (preset) {
            this.setTheme(preset.color);
            return true;
        }
        return false;
    }

    /**
     * Valida cor HEX
     */
    isValidHex(hex) {
        return /^#[0-9A-F]{6}$/i.test(hex);
    }

    /**
     * Ajusta brilho de uma cor
     */
    adjustBrightness(hex, percent) {
        const num = parseInt(hex.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, Math.min(255, (num >> 16) + amt));
        const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
        const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);;
    }

    /**
     * Obtém cor primária atual
     */
    getPrimaryColor() {
        return this.primaryColor;
    }
}

// ============= GERENCIADOR DE CAPTCHA =============
class CaptchaManager {
    constructor() {
        this.generateChallenge();
    }

    /**
     * Gera um desafio de captcha (soma simples)
     */
    generateChallenge() {
        const num1 = Math.floor(Math.random() * 50) + 1;
        const num2 = Math.floor(Math.random() * 50) + 1;
        this.correctAnswer = num1 + num2;
        this.challenge = `${num1} + ${num2} = ?`;
        return this.challenge;
    }

    /**
     * Verifica resposta do captcha
     */
    verify(answer) {
        return parseInt(answer) === this.correctAnswer;
    }

    /**
     * Obtém o desafio atual
     */
    getChallenge() {
        return this.challenge;
    }

    /**
     * Reseta para novo desafio
     */
    reset() {
        this.generateChallenge();
    }
}

// ============= GERENCIADOR DE FRASES =============
class MotivationalManager {
    /**
     * Obtém frase motivacional aleatória
     */
    static getRandomPhrase() {
        const phrases = AUTH_CONFIG.MOTIVATIONAL_PHRASES;
        return phrases[Math.floor(Math.random() * phrases.length)];
    }

    /**
     * Obtém todas as frases
     */
    static getAllPhrases() {
        return AUTH_CONFIG.MOTIVATIONAL_PHRASES;
    }
}

// ============= INICIALIZAR GLOBALMENTE =============
const authManager = new AuthManager();
const themeManager = new ThemeManager();
const captchaManager = new CaptchaManager();

window.authManager = authManager;
window.themeManager = themeManager;
window.captchaManager = captchaManager;

console.log('✅ Auth System V3.1 Carregado com sucesso!');
