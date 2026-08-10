let questions = [];
let filteredQuestions = [];
let currentIndex = 0;
let userAnswers = {};
let markedReview = {};
let timerInterval;
let timeLeft = 30;
let quizStartTime;
let quizActive = false;

window.addEventListener('load', () => {
    const dateInput = document.getElementById('quizDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    // ডার্ক মোড
    document.getElementById('darkModeToggle')?.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const icon = document.getElementById('darkModeToggle').querySelector('i');
        if (icon) icon.className = document.body.classList.contains('dark-mode') ? 'fas fa-sun' : 'fas fa-moon';
    });

    // ব্যাক টু হোম (কুইজ স্ক্রিন থেকে)
    document.getElementById('backToHomeBtn')?.addEventListener('click', goHome);

    // প্যালেট কন্ট্রোল
    const openPalette = document.getElementById('openPaletteBtn');
    const overlay = document.getElementById('paletteOverlay');
    const sheet = document.getElementById('paletteSheet');
    if (openPalette) {
        openPalette.addEventListener('click', () => {
            overlay.classList.remove('hidden');
            sheet.classList.add('show');
        });
    }
    overlay?.addEventListener('click', () => {
        overlay.classList.add('hidden');
        sheet.classList.remove('show');
    });

    loadQuestions();
    bindQuizControls();
});

function bindQuizControls() {
    document.getElementById('prevBtn')?.addEventListener('click', goToPrevious);
    document.getElementById('nextBtn')?.addEventListener('click', goToNext);
    document.getElementById('skipBtn')?.addEventListener('click', skipQuestion);
    document.getElementById('clearResponseBtn')?.addEventListener('click', clearResponse);
    document.getElementById('markReviewBtn')?.addEventListener('click', markForReview);
    document.getElementById('submitBtn')?.addEventListener('click', submitQuiz);
}

async function loadQuestions() {
    try {
        const res = await fetch('questions.json');
        if (!res.ok) throw new Error('JSON লোড হয়নি');
        questions = await res.json();
    } catch (err) {
        console.error(err);
        questions = [];
    }
}

function startQuiz(subject) {
    if (!questions.length) { alert('প্রশ্ন লোড হয়নি।'); return; }
    const date = document.getElementById('quizDate').value;
    if (!date) { alert('তারিখ বাছাই করো।'); return; }
    filteredQuestions = questions.filter(q => q.subject === subject && q.date === date);
    if (filteredQuestions.length === 0) { alert('এই বিষয় ও তারিখে কোনো প্রশ্ন নেই।'); return; }

    currentIndex = 0;
    userAnswers = {};
    markedReview = {};
    filteredQuestions.forEach((_, i) => { userAnswers[i] = null; markedReview[i] = false; });
    quizActive = true;
    quizStartTime = Date.now();

    document.getElementById('homeScreen').classList.add('hidden');
    document.getElementById('quizScreen').classList.remove('hidden');
    document.getElementById('resultScreen').classList.add('hidden');
    renderPalette();
    loadQuestion();
}

function loadQuestion() {
    if (!quizActive || currentIndex >= filteredQuestions.length) return;
    resetTimer();
    const q = filteredQuestions[currentIndex];
    document.getElementById('questionCounter').innerText = `প্রশ্ন ${currentIndex + 1} / ${filteredQuestions.length}`;
    document.getElementById('questionText').innerText = q.question;
    const optDiv = document.getElementById('optionsContainer');
    optDiv.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => selectOption(idx);
        if (userAnswers[currentIndex] === idx) btn.classList.add('selected');
        optDiv.appendChild(btn);
    });
    updateReviewButton();
    startTimer();
}

function selectOption(index) {
    if (!quizActive) return;
    userAnswers[currentIndex] = index;
    markedReview[currentIndex] = false;
    loadQuestion();
    renderPalette();
}

function skipQuestion() {
    if (!quizActive) return;
    if (userAnswers[currentIndex] === null) userAnswers[currentIndex] = "skipped";
    renderPalette();
    currentIndex < filteredQuestions.length - 1 ? (currentIndex++, loadQuestion()) : submitQuiz();
}

function clearResponse() {
    if (!quizActive) return;
    userAnswers[currentIndex] = null;
    loadQuestion();
    renderPalette();
}

function markForReview() {
    if (!quizActive) return;
    markedReview[currentIndex] = !markedReview[currentIndex];
    updateReviewButton();
    renderPalette();
}

function updateReviewButton() {
    const btn = document.getElementById('markReviewBtn');
    if (!btn) return;
    if (markedReview[currentIndex]) {
        btn.innerHTML = '<i class="fas fa-bookmark"></i> রিভিউ';
        btn.classList.add('active-review');
    } else {
        btn.innerHTML = '<i class="fas fa-bookmark"></i> রিভিউ';
        btn.classList.remove('active-review');
    }
}

function renderPalette() {
    const grid = document.getElementById('paletteGrid');
    if (!grid) return;
    grid.innerHTML = '';
    filteredQuestions.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.className = 'palette-btn';
        btn.innerText = i + 1;
        if (userAnswers[i] !== null && userAnswers[i] !== "skipped") btn.classList.add('answered');
        else if (markedReview[i]) btn.classList.add('review');
        else if (userAnswers[i] === null) btn.classList.add('not-answered');
        if (i === currentIndex) btn.classList.add('current');
        btn.onclick = () => {
            currentIndex = i;
            loadQuestion();
            renderPalette();
            document.getElementById('paletteSheet').classList.remove('show');
            document.getElementById('paletteOverlay').classList.add('hidden');
        };
        grid.appendChild(btn);
    });
}

function startTimer() {
    timeLeft = 30;
    updateTimerUI();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (quizActive) {
                if (userAnswers[currentIndex] === null) userAnswers[currentIndex] = "skipped";
                if (currentIndex < filteredQuestions.length - 1) {
                    currentIndex++;
                    loadQuestion();
                    renderPalette();
                } else submitQuiz();
            }
        }
    }, 1000);
}

function updateTimerUI() {
    const text = document.getElementById('timerText');
    const path = document.getElementById('timerPath');
    if (text) text.innerText = timeLeft;
    if (path) {
        const offset = 100 - (timeLeft / 30) * 100;
        path.style.strokeDasharray = '100';
        path.style.strokeDashoffset = offset;
    }
}

function resetTimer() { clearInterval(timerInterval); }

function goToPrevious() {
    if (!quizActive || currentIndex <= 0) return;
    currentIndex--; loadQuestion(); renderPalette();
}

function goToNext() {
    if (!quizActive || currentIndex >= filteredQuestions.length - 1) return;
    currentIndex++; loadQuestion(); renderPalette();
}

function submitQuiz() {
    if (!quizActive) return;
    quizActive = false;
    clearInterval(timerInterval);
    let correct = 0, wrong = 0, skipped = 0;
    filteredQuestions.forEach((q, i) => {
        const ans = userAnswers[i];
        if (ans === null || ans === "skipped") skipped++;
        else if (ans === q.answer) correct++;
        else wrong++;
    });
    const total = filteredQuestions.length;
    const percent = Math.round((correct / total) * 100);
    const timeTaken = Math.round((Date.now() - quizStartTime) / 1000);

    document.getElementById('quizScreen').classList.add('hidden');
    document.getElementById('resultScreen').classList.remove('hidden');

    document.getElementById('scorePercent').innerText = percent + '%';
    document.getElementById('correctCount').innerText = correct;
    document.getElementById('wrongCount').innerText = wrong;
    document.getElementById('skippedCount').innerText = skipped;
    document.getElementById('timeTaken').innerText = timeTaken;

    // অ্যানিমেটেড স্কোর রিং
    const scorePath = document.getElementById('scorePath');
    scorePath.style.strokeDasharray = '100';
    scorePath.style.strokeDashoffset = 100 - percent;

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
    quizActive = false;
    clearInterval(timerInterval);
    document.getElementById('quizScreen').classList.add('hidden');
    document.getElementById('resultScreen').classList.add('hidden');
    document.getElementById('homeScreen').classList.remove('hidden');
}