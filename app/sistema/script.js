const targetDateElement = document.getElementById("targetDate");
const targetTimeElement = document.getElementById("targetTime");
const startCountdownButton = document.getElementById("startCountdown");
const stopCountdownButton = document.getElementById("stopCountdown");
const resetCountdownButton = document.getElementById("resetCountdown");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const body = document.body;
const messageDiv = document.getElementById("message");
const focusHistoryList = document.getElementById("focusHistoryList");
const clearFocusHistoryBtn = document.getElementById("clearFocusHistoryBtn");
const timerPolicyInfo = document.getElementById("timerPolicyInfo");
const sessionIdleGraceSelect = document.getElementById("sessionIdleGraceSelect");
const sessionGraceInfo = document.getElementById("sessionGraceInfo");
const openAdminViewerBtn = document.getElementById("openAdminViewerBtn");
const clearAllFocusHistoriesBtn = document.getElementById("clearAllFocusHistoriesBtn");
const TIMER_ACTIVE_STORAGE_KEY = "clicktime_timer_active";
const TIMER_IDLE_SINCE_STORAGE_KEY = "clicktime_timer_idle_since";
const SESSION_IDLE_GRACE_MINUTES_KEY = "clicktime_session_idle_grace_minutes";

let targetTimestamp = null;
let countdownInterval = null;
let plannedDurationSeconds = 0;
let startTimestamp = null;
let totalDurationSeconds = 0;
let currentTimerLabel = "";
const DEFAULT_SESSION_TIMEOUT_MS = 60 * 60 * 1000;
const FOCUS_HISTORY_LIMIT = 20;
const USER_TIMER_LIMIT_SECONDS = 2 * 60 * 60;
const GUEST_TIMER_LIMIT_SECONDS = 45 * 60;

function setTimerActiveState(isActive) {
    localStorage.setItem(TIMER_ACTIVE_STORAGE_KEY, isActive ? "1" : "0");

    if (isActive) {
        localStorage.removeItem(TIMER_IDLE_SINCE_STORAGE_KEY);
    } else {
        localStorage.setItem(TIMER_IDLE_SINCE_STORAGE_KEY, String(Date.now()));
    }

    window.dispatchEvent(
        new CustomEvent("clicktime:timer-state", {
            detail: { active: isActive }
        })
    );
}

function getSessionIdleGraceMinutes() {
    const raw = localStorage.getItem(SESSION_IDLE_GRACE_MINUTES_KEY);
    const parsed = Number(raw);

    if (parsed === 3 || parsed === 4) {
        return parsed;
    }

    return 4;
}

function applySessionGraceUI(minutes) {
    if (sessionIdleGraceSelect) {
        sessionIdleGraceSelect.value = String(minutes);
    }

    if (sessionGraceInfo) {
        sessionGraceInfo.textContent = `Sem timer ativo, a sessão começa a contar após ${minutes} minutos.`;
    }
}

function getCurrentProfile() {
    try {
        const rawUser = localStorage.getItem("clicktime_user");
        if (rawUser) {
            const user = JSON.parse(rawUser);
            if (user?.role === "admin") return "admin";
            return "user";
        }
    } catch (_) {
    }

    if (sessionStorage.getItem("clicktime_guest_mode") === "1") {
        return "guest";
    }

    return "user";
}

function getTimerLimitByProfile(profile) {
    if (profile === "admin") return null;
    if (profile === "guest") return GUEST_TIMER_LIMIT_SECONDS;
    return USER_TIMER_LIMIT_SECONDS;
}

function formatLimitLabel(profile, seconds) {
    if (profile === "admin") {
        return "Admin: sem limite de duração por sessão.";
    }

    const minutes = Math.floor(seconds / 60);
    if (profile === "guest") {
        return `Convidado: limite de ${minutes} minutos por sessão.`;
    }

    const hours = Math.floor(minutes / 60);
    return `Usuário: limite de ${hours}h por sessão.`;
}

function validateTimerLimit(durationSeconds) {
    const profile = getCurrentProfile();
    const profileLimit = getTimerLimitByProfile(profile);

    if (!profileLimit) {
        return true;
    }

    if (durationSeconds <= profileLimit) {
        return true;
    }

    const limitText = profile === "guest" ? "45 minutos" : "2 horas";
    Swal.fire({
        title: "Limite de timer atingido ⏱️",
        text: `Seu perfil permite no máximo ${limitText} por sessão.`,
        icon: "warning",
    });
    return false;
}

function applyProfilePolicyUI() {
    const profile = getCurrentProfile();
    const profileLimit = getTimerLimitByProfile(profile);
    const label = formatLimitLabel(profile, profileLimit || 0);

    if (timerPolicyInfo) {
        timerPolicyInfo.textContent = label;
    }
}

function applyDefaultSessionTimeout() {
    if (window.authManager && authManager.isAuthenticated()) {
        authManager.setSessionExpiry(Date.now() + DEFAULT_SESSION_TIMEOUT_MS);
    }
}

function syncSessionWithCountdown(timestamp) {
    if (!window.authManager || !authManager.isAuthenticated()) return;

    if (Number.isFinite(timestamp) && timestamp > Date.now()) {
        authManager.setSessionExpiry(timestamp);
        return;
    }

    applyDefaultSessionTimeout();
}

function getHistoryOwner() {
    try {
        const rawUser = localStorage.getItem("clicktime_user");
        if (rawUser) {
            const user = JSON.parse(rawUser);
            if (user?.email) {
                return user.email;
            }
        }
    } catch (_) {
    }

    if (sessionStorage.getItem("clicktime_guest_mode") === "1") {
        return "guest";
    }

    return "anon";
}

function getHistoryStorageKey() {
    return `clicktime_focus_history_${getHistoryOwner()}`;
}

function loadFocusHistory() {
    const rawHistory = localStorage.getItem(getHistoryStorageKey());
    if (!rawHistory) return [];

    try {
        const parsed = JSON.parse(rawHistory);
        return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
        return [];
    }
}

function saveFocusHistory(entries) {
    localStorage.setItem(getHistoryStorageKey(), JSON.stringify(entries.slice(0, FOCUS_HISTORY_LIMIT)));
}

function formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    return `${minutes}m ${seconds}s`;
}

function formatDateTime(isoDate) {
    return new Date(isoDate).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function renderFocusHistory() {
    if (!focusHistoryList) return;

    const history = loadFocusHistory();

    if (history.length === 0) {
        focusHistoryList.innerHTML = '<div class="focus-history-empty">Sem sessões concluídas ainda.</div>';
        return;
    }

    focusHistoryList.innerHTML = history
        .map(
            (item) =>
                `<div class="focus-history-item">
                        ${item.label ? `<div class="focus-history-label">📌 ${escapeHtml(item.label)}</div>` : ""}
                        <div class="focus-history-time">⏱️ ${formatDuration(item.durationSeconds)}</div>
                        <div class="focus-history-date">${formatDateTime(item.finishedAt)}</div>
                    </div>`,
        )
        .join("");
}

function addFocusHistoryEntry() {
    if (!Number.isFinite(plannedDurationSeconds) || plannedDurationSeconds <= 0) {
        return;
    }

    const history = loadFocusHistory();
    history.unshift({
        durationSeconds: plannedDurationSeconds,
           finishedAt: new Date().toISOString(),
           label: currentTimerLabel || null,
    });

    saveFocusHistory(history);
    plannedDurationSeconds = 0;
    renderFocusHistory();
}

startCountdownButton.addEventListener("click", () => {
    if (!targetDateElement.value || !targetTimeElement.value) {
        Swal.fire({
            title: "Defina data e hora",
            text: "Escolha data e hora antes de iniciar o timer.",
            icon: "info",
        });
        return;
    }

    const selectedDate = new Date(`${targetDateElement.value}T${targetTimeElement.value}`);
    targetTimestamp = selectedDate.getTime();
    plannedDurationSeconds = Math.max(0, Math.floor((targetTimestamp - Date.now()) / 1000));

    if (!Number.isFinite(plannedDurationSeconds) || plannedDurationSeconds <= 0) {
        Swal.fire({
            title: "Horário inválido",
            text: "Escolha um horário futuro para iniciar a contagem.",
            icon: "warning",
        });
        return;
    }

    if (!validateTimerLimit(plannedDurationSeconds)) {
        return;
    }

    syncSessionWithCountdown(targetTimestamp);
        setTimerActiveState(true);
        startTimestamp = Date.now();
        totalDurationSeconds = plannedDurationSeconds;
        currentTimerLabel = (document.getElementById("timerLabel")?.value || "").trim();

        try {
            if (typeof Notification !== 'undefined' && Notification.permission === "default") {
                Notification.requestPermission();
            }
        } catch (_) {}

        const progressWrapEl = document.getElementById("progressWrap");
        if (progressWrapEl) progressWrapEl.style.display = "";
        const fillEl = document.getElementById("progressBarFill");
        if (fillEl) fillEl.style.width = "100%";
        const ptextEl = document.getElementById("progressText");
        if (ptextEl) ptextEl.textContent = "100% restante";

        updateCountdown();

        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        countdownInterval = setInterval(updateCountdown, 1000);
});

stopCountdownButton.addEventListener("click", () => {
    clearInterval(countdownInterval);
    countdownInterval = null;
    setTimerActiveState(false);
    plannedDurationSeconds = 0;
    startTimestamp = null;
    totalDurationSeconds = 0;
    const pw = document.getElementById("progressWrap");
    if (pw) pw.style.display = "none";
});

resetCountdownButton.addEventListener("click", () => {
    clearInterval(countdownInterval);
    countdownInterval = null;
    setTimerActiveState(false);
    targetTimestamp = null;
    startTimestamp = null;
    totalDurationSeconds = 0;
    currentTimerLabel = "";
    targetDateElement.value = "";
    targetTimeElement.value = "";
    const timerLabelEl = document.getElementById("timerLabel");
    if (timerLabelEl) timerLabelEl.value = "";
    plannedDurationSeconds = 0;
    updateCountdown();
    hideMessage();
    applyDefaultSessionTimeout();
    const pw2 = document.getElementById("progressWrap");
    if (pw2) pw2.style.display = "none";
});

if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        body.classList.toggle("light-theme");
        updateCountdown(); // Atualize o contador ao alternar o tema
    });
}

function updateCountdown() {
    if (targetTimestamp === null) {
        document.getElementById("hours").textContent = "00";
        document.getElementById("minutes").textContent = "00";
        document.getElementById("seconds").textContent = "00";
        return;
    }
  
    const currentTime = new Date().getTime();
    const timeRemaining = targetTimestamp - currentTime;

    if (timeRemaining <= 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
           setTimerActiveState(false);
           const fillEl0 = document.getElementById("progressBarFill");
           if (fillEl0) fillEl0.style.width = "0%";
           const ptextEl0 = document.getElementById("progressText");
           if (ptextEl0) ptextEl0.textContent = "0% restante";
           showMessage();
           return;
    }

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    const hoursElement = document.getElementById("hours");
    const minutesElement = document.getElementById("minutes");
    const secondsElement = document.getElementById("seconds");

    hoursElement.textContent = hours < 10 ? `0${hours}` : hours;
    minutesElement.textContent = minutes < 10 ? `0${minutes}` : minutes;
    secondsElement.textContent = seconds < 10 ? `0${seconds}` : seconds;

    // Atualize a cor do texto com base no tema
    if (body.classList.contains("light-theme")) {
        hoursElement.style.color = "black";
        minutesElement.style.color = "black";
        secondsElement.style.color = "black";
    } else {
        hoursElement.style.color = "white";
        minutesElement.style.color = "white";
        secondsElement.style.color = "white";
    }

        if (totalDurationSeconds > 0) {
            const pct = Math.max(0, (timeRemaining / (totalDurationSeconds * 1000)) * 100);
            const fill = document.getElementById("progressBarFill");
            const ptext = document.getElementById("progressText");
            if (fill) fill.style.width = `${pct.toFixed(1)}%`;
            if (ptext) ptext.textContent = `${Math.floor(pct)}% restante`;
        }
    }

function showMessage() {
    messageDiv.style.display = "block";
    addFocusHistoryEntry();
    playSound();

    try {
        if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
            const notifBody = currentTimerLabel
                ? `"${currentTimerLabel}" chegou ao fim!`
                : "O tempo acabou!";
            new Notification("ClickTime V3.1 ⏰", {
                body: notifBody,
                icon: "./images/relogio_transparente.ico",
            });
        }
    } catch (_) {}

    const alertText = currentTimerLabel
        ? `"${currentTimerLabel}" chegou ao fim!`
        : "O tempo acabou!";

    Swal.fire({
        title: "⏰ Tempo esgotado!",
        text: alertText,
        icon: "success",
        confirmButtonText: "OK",
    }).then(() => hideMessage());
}


function hideMessage() {
    messageDiv.style.display = "none";
}

function playSound() {
    const audioElement = document.getElementById("audio");
    audioElement.play();
}

window.addEventListener("load", () => {
    const graceMinutes = getSessionIdleGraceMinutes();
    localStorage.setItem(SESSION_IDLE_GRACE_MINUTES_KEY, String(graceMinutes));
    applySessionGraceUI(graceMinutes);

    sessionIdleGraceSelect?.addEventListener("change", (event) => {
        const selected = Number(event.target.value);
        const minutes = selected === 3 ? 3 : 4;

        localStorage.setItem(SESSION_IDLE_GRACE_MINUTES_KEY, String(minutes));
        localStorage.setItem(TIMER_IDLE_SINCE_STORAGE_KEY, String(Date.now()));
        applySessionGraceUI(minutes);

        window.dispatchEvent(
            new CustomEvent("clicktime:session-grace-changed", {
                detail: { minutes }
            })
        );
    });

    if (localStorage.getItem(TIMER_ACTIVE_STORAGE_KEY) !== "1") {
        setTimerActiveState(false);
    }

    const existingSessionExpiry = localStorage.getItem("clicktime_session_expires_at");

    if (!existingSessionExpiry) {
        applyDefaultSessionTimeout();
    }

    applyProfilePolicyUI();
    renderFocusHistory();

    clearFocusHistoryBtn?.addEventListener("click", () => {
        localStorage.removeItem(getHistoryStorageKey());
        renderFocusHistory();
    });

    openAdminViewerBtn?.addEventListener("click", () => {
        window.location.href = "../html/VISUALIZADOR_ADMIN.html";
    });

    clearAllFocusHistoriesBtn?.addEventListener("click", () => {
        if (getCurrentProfile() !== "admin") {
            return;
        }

        Swal.fire({
            title: "Limpar todos os históricos?",
            text: "Esta ação remove o histórico de foco de todos os perfis.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sim, limpar",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (!result.isConfirmed) {
                return;
            }

            Object.keys(localStorage)
                .filter((key) => key.startsWith("clicktime_focus_history_"))
                .forEach((key) => localStorage.removeItem(key));

            renderFocusHistory();
            Swal.fire({
                title: "Concluído ✅",
                text: "Todos os históricos foram removidos.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false,
            });
        });
    });
});
