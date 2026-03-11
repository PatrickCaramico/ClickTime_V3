const targetDateElement = document.getElementById("targetDate");
const targetTimeElement = document.getElementById("targetTime");
const startCountdownButton = document.getElementById("startCountdown");
const stopCountdownButton = document.getElementById("stopCountdown");
const resetCountdownButton = document.getElementById("resetCountdown");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const body = document.body;
const messageDiv = document.getElementById("message");

let targetTimestamp = null;
let countdownInterval = null;

startCountdownButton.addEventListener("click", () => {
    const selectedDate = new Date(`${targetDateElement.value}T${targetTimeElement.value}`);
    targetTimestamp = selectedDate.getTime();
    updateCountdown();
  
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
  
    countdownInterval = setInterval(updateCountdown, 1000);
});

stopCountdownButton.addEventListener("click", () => {
    clearInterval(countdownInterval);
    countdownInterval = null;
});

resetCountdownButton.addEventListener("click", () => {
    clearInterval(countdownInterval);
    countdownInterval = null;
    targetTimestamp = null;
    targetDateElement.value = "";
    targetTimeElement.value = "";
    updateCountdown();
    hideMessage();
});

themeToggleBtn.addEventListener("click", () => {
    body.classList.toggle("light-theme");
    updateCountdown(); // Atualize o contador ao alternar o tema
});

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
        showMessage();
    }

    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
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
}

function showMessage() {
    messageDiv.style.display = "block";
    playSound();
}

function hideMessage() {
    messageDiv.style.display = "none";
}

function playSound() {
    const audioElement = document.getElementById("audio");
    audioElement.play();
}
