let questions = [];
let filteredQuestions = [];
let currentIndex = 0;
let userAnswers = {};
let markedReview = {};
let timerInterval;
let timeLeft = 30;
let quizStartTime;
let quizActive = false;

// পেজ লোড
window.addEventListener('load', () => {
    // আজকের তারিখ
    const dateInput = document.getElementById('quizDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // ডার্ক মোড টগল
    const darkToggle = document.getElementById('darkModeToggle');
    if (darkToggle) {
        darkToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const icon = darkToggle.querySelector('i');
            if (icon) {
                icon.className = document.body.classList.contains('dark-mode') ? 'fas fa-sun' : 'fas fa-moon';
            }
        });
    }
    
    // প্যালেট ওপেন/ক্লোজ (কুইজ স্ক্রিনে থাকলেও ইভেন্ট এখনই বেঁধে দেওয়া যায়)
    const openPalette = document.getElementById('openPaletteBtn');
    const closePalette = document.getElementById('closePalette');
    if (openPalette) {
        openPalette.addEventListener('click', () => {
            document.getElementById('palette').classList.add('show');
        });
    }
    if (closePalette) {
        closePalette.addEventListener('click', () => {
            document.getElementById('palette').classList.remove('show');
        });
    }

    // লোড প্রশ্ন
    loadQuestions();
    
    // কুইজ কন্ট্রোল বাটন (এগুলো hidden থাকলেও ডমে আছে, তাই ইভেন্ট বাইন্ডিং হবে)
    bindQuizControls();
});

function bindQuizControls() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const skipBtn = document.getElementById('skipBtn');
    const clearBtn = document.getElementById('clearResponseBtn');
    const markBtn = document.getElementById('markReviewBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (prevBtn) prevBtn.addEventListener('click', goToPrevious);
    if (nextBtn) nextBtn.addEventListener('click', goToNext);
    if (skipBtn) skipBtn.addEventListener('click', skipQuestion);
    if (clearBtn) clearBtn.addEventListener('click', clearResponse);
    if (markBtn) markBtn.addEventListener('click', markForReview);
    if (submitBtn) submitBtn.addEventListener('click', submitQuiz);
}

async function loadQuestions() {
    try {
        const res = await fetch('questions.json');
        if (!res.ok) throw new Error('JSON লোড হয়নি');
        questions = await res.json();
        console.log('প্রশ্ন লোড হয়েছে:', questions.length);
    } catch (err) {
        console.error('প্রশ্ন লোড করতে সমস্যা:', err);
        questions = [];
    }
}

function startQuiz(subject) {
    if (!questions.length) {
        alert('প্রশ্ন লোড হয়নি, একটু অপেক্ষা করো বা রিফ্রেশ করো।');
        return;
    }
    const selectedDate = document.getElementById('quizDate').value;
    if (!selectedDate) {
        alert('তারিখ বেছে নাও।');
        return;
    }
    filteredQuestions = questions.filter(q => q.subject === subject && q.date === selectedDate);
    if (filteredQuestions.length === 0) {
        alert('এই বিষয় ও তারিখে কোনো প্রশ্ন নেই।');
        return;
    }
    // ইনিশিয়ালাইজ
    currentIndex = 0;
    userAnswers = {};
    markedReview = {};
    filteredQuestions.forEach((_, i) => {
        userAnswers[i] = null;
        markedReview[i] = false;
    });
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
    if (userAnswers[currentIndex] === null) {
        userAnswers[currentIndex] = "skipped";
    }
    renderPalette();
    if (currentIndex < filteredQuestions.length - 1) {
        currentIndex++;
        loadQuestion();
    } else {
        submitQuiz();
    }
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
        btn.innerHTML = '<i class="fas fa-check-circle"></i> মার্ক করা আছে';
        btn.style.background = 'rgba(245,158,11,0.2)';
    } else {
        btn.innerHTML = '<i class="fas fa-bookmark"></i> মার্ক ফর রিভিউ';
        btn.style.background = '';
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
            document.getElementById('palette').classList.remove('show');
        };
        grid.appendChild(btn);
    });
}

function startTimer() {
    timeLeft = 30;
    updateTimerDisplay();
    document.getElementById('timerFill').style.width = '100%';
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        document.getElementById('timerFill').style.width = (timeLeft / 30) * 100 + '%';
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (quizActive) {
                if (userAnswers[currentIndex] === null) userAnswers[currentIndex] = "skipped";
                if (currentIndex < filteredQuestions.length - 1) {
                    currentIndex++;
                    loadQuestion();
                    renderPalette();
                } else {
                    submitQuiz();
                }
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerText = document.getElementById('timerText');
    if (timerText) {
        timerText.innerText = `00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;
    }
}

function resetTimer() {
    clearInterval(timerInterval);
}

function goToPrevious() {
    if (!quizActive || currentIndex <= 0) return;
    currentIndex--;
    loadQuestion();
    renderPalette();
}

function goToNext() {
    if (!quizActive || currentIndex >= filteredQuestions.length - 1) return;
    currentIndex++;
    loadQuestion();
    renderPalette();
}

function submitQuiz() {
    if (!quizActive) return;
    quizActive = false;
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
    quizActive = false;
    clearInterval(timerInterval);
    document.getElementById('resultScreen').classList.add('hidden');
    document.getElementById('quizScreen').classList.add('hidden');
    document.getElementById('homeScreen').classList.remove('hidden');
}