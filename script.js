let questions = [];
let filteredQuestions = [];
let currentIndex = 0;
let userAnswers = {}; // { index: optionIndex or "skipped" }
let markedReview = {}; // { index: true/false }
let timerInterval;
let timeLeft = 30;
let quizStartTime;

window.onload = () => {
    document.getElementById('quizDate').value = new Date().toISOString().split('T')[0];
    // dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const icon = document.querySelector('#darkModeToggle i');
        if (document.body.classList.contains('dark-mode')) {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    });
    // palette toggle
    document.getElementById('openPaletteBtn').addEventListener('click', () => {
        document.getElementById('palette').classList.add('show');
    });
    document.getElementById('closePalette').addEventListener('click', () => {
        document.getElementById('palette').classList.remove('show');
    });
};

async function loadQuestions() {
    const res = await fetch('questions.json');
    questions = await res.json();
}

function startQuiz(subject) {
    const selectedDate = document.getElementById('quizDate').value;
    if (!selectedDate) { alert("তারিখ বেছে নাও।"); return; }
    filteredQuestions = questions.filter(q => q.subject === subject && q.date === selectedDate);
    if (filteredQuestions.length === 0) { alert("প্রশ্ন নেই।"); return; }
    currentIndex = 0;
    userAnswers = {};
    markedReview = {};
    filteredQuestions.forEach((_, i) => { userAnswers[i] = null; markedReview[i] = false; });
    quizStartTime = Date.now();
    document.getElementById('homeScreen').classList.add('hidden');
    document.getElementById('quizScreen').classList.remove('hidden');
    document.getElementById('resultScreen').classList.add('hidden');
    renderPalette();
    loadQuestion();
}

function loadQuestion() {
    resetTimer();
    const q = filteredQuestions[currentIndex];
    document.getElementById('questionCounter').innerText = `প্রশ্ন ${currentIndex + 1} / ${filteredQuestions.length}`;
    document.getElementById('questionText').innerText = q.question;
    const optionsDiv = document.getElementById('optionsContainer');
    optionsDiv.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => selectOption(idx);
        if (userAnswers[currentIndex] === idx) btn.classList.add('selected');
        optionsDiv.appendChild(btn);
    });
    updateActionButtons();
    startTimer();
}

function selectOption(index) {
    userAnswers[currentIndex] = index;
    markedReview[currentIndex] = false;
    loadQuestion();
    renderPalette();
}

function skipQuestion() {
    if (userAnswers[currentIndex] === null) {
        userAnswers[currentIndex] = "skipped";
    }
    renderPalette();
    if (currentIndex < filteredQuestions.length - 1) {
        currentIndex++;
        loadQuestion();
    }
}

function clearResponse() {
    userAnswers[currentIndex] = null;
    loadQuestion();
    renderPalette();
}

function markForReview() {
    markedReview[currentIndex] = !markedReview[currentIndex];
    if (markedReview[currentIndex] && userAnswers[currentIndex] !== null) {
        // keep answer but mark review
    }
    updateActionButtons();
    renderPalette();
}

function updateActionButtons() {
    const reviewBtn = document.getElementById('markReviewBtn');
    if (markedReview[currentIndex]) {
        reviewBtn.innerHTML = '<i class="fas fa-check-circle"></i> মার্ক করা আছে';
        reviewBtn.style.background = 'rgba(245,158,11,0.2)';
    } else {
        reviewBtn.innerHTML = '<i class="fas fa-bookmark"></i> মার্ক ফর রিভিউ';
        reviewBtn.style.background = '';
    }
}

function renderPalette() {
    const grid = document.getElementById('paletteGrid');
    grid.innerHTML = '';
    filteredQuestions.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.className = 'palette-btn';
        btn.innerText = i + 1;
        if (userAnswers[i] !== null && userAnswers[i] !== "skipped") btn.classList.add('answered');
        else if (markedReview[i]) btn.classList.add('review');
        else if (userAnswers[i] === null) btn.classList.add('not-answered');
        if (i === currentIndex) btn.classList.add('current');
        btn.onclick = () => { currentIndex = i; loadQuestion(); renderPalette(); document.getElementById('palette').classList.remove('show'); };
        grid.appendChild(btn);
    });
}

function startTimer() {
    timeLeft = 30;
    document.getElementById('timerText').innerText = `00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;
    document.getElementById('timerFill').style.width = '100%';
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timerText').innerText = `00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;
        document.getElementById('timerFill').style.width = (timeLeft / 30) * 100 + '%';
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (currentIndex < filteredQuestions.length - 1) {
                if (userAnswers[currentIndex] === null) userAnswers[currentIndex] = "skipped";
                currentIndex++;
                loadQuestion();
                renderPalette();
            } else {
                submitQuiz();
            }
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
}

function goToPrevious() {
    if (currentIndex > 0) {
        currentIndex--;
        loadQuestion();
        renderPalette();
    }
}
function goToNext() {
    if (currentIndex < filteredQuestions.length - 1) {
        currentIndex++;
        loadQuestion();
        renderPalette();
    }
}

// Event Listeners for buttons
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('prevBtn').addEventListener('click', goToPrevious);
    document.getElementById('nextBtn').addEventListener('click', goToNext);
    document.getElementById('skipBtn').addEventListener('click', skipQuestion);
    document.getElementById('clearResponseBtn').addEventListener('click', clearResponse);
    document.getElementById('markReviewBtn').addEventListener('click', markForReview);
    document.getElementById('submitBtn').addEventListener('click', submitQuiz);
    loadQuestions();
});

function submitQuiz() {
    clearInterval(timerInterval);
    let correctCount = 0, wrongCount = 0, skippedCount = 0;
    filteredQuestions.forEach((q, i) => {
        const ans = userAnswers[i];
        if (ans === null || ans === "skipped") skippedCount++;
        else if (ans === q.answer) correctCount++;
        else wrongCount++;
    });
    const total = filteredQuestions.length;
    const percent = Math.round((correctCount / total) * 100);
    const timeTaken = Math.round((Date.now() - quizStartTime) / 1000);

    document.getElementById('quizScreen').classList.add('hidden');
    document.getElementById('resultScreen').classList.remove('hidden');
    document.getElementById('scorePercent').innerText = percent + '%';
    document.getElementById('scoreObtained').innerText = correctCount;
    document.getElementById('totalQResult').innerText = total;
    document.getElementById('correctCount').innerText = correctCount;
    document.getElementById('wrongCount').innerText = wrongCount;
    document.getElementById('skippedCount').innerText = skippedCount;
    document.getElementById('timeTaken').innerText = timeTaken;

    const reviewDiv = document.getElementById('reviewSection');
    reviewDiv.innerHTML = '';
    filteredQuestions.forEach((q, i) => {
        const ans = userAnswers[i];
        let status = '';
        if (ans === null || ans === "skipped") status = '⏭ স্কিপ';
        else if (ans === q.answer) status = '✅ ঠিক';
        else status = '❌ ভুল';
        const div = document.createElement('div');
        div.className = 'review-item';
        div.innerHTML = `<strong>${i+1}. ${q.question}</strong><br>${status} | সঠিক: ${q.options[q.answer]}`;
        reviewDiv.appendChild(div);
    });
}

function goHome() {
    document.getElementById('resultScreen').classList.add('hidden');
    document.getElementById('homeScreen').classList.remove('hidden');
}
