let questions = [];
let filteredQuestions = [];
let currentIndex = 0;
let score = 0;
let timerInterval;
let timeLeft = 30; // প্রতি প্রশ্নে সেকেন্ড
let selectedOption = null;
let answered = false;

// পেজ লোডে আজকের তারিখ সেট করা
window.onload = () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('quizDate').value = today;
};

async function loadQuestions() {
    const res = await fetch('questions.json');
    questions = await res.json();
}

function startQuiz(subject) {
    const selectedDate = document.getElementById('quizDate').value;
    if (!selectedDate) {
        alert("দয়া করে একটি তারিখ বেছে নাও।");
        return;
    }
    filteredQuestions = questions.filter(q => q.subject === subject && q.date === selectedDate);
    if (filteredQuestions.length === 0) {
        alert("এই বিষয় ও তারিখে কোনো প্রশ্ন নেই। দয়া করে প্রশ্ন যোগ করো।");
        return;
    }
    // প্রশ্নগুলো এলোমেলো করতে চাইলে নিচের লাইন আনকমেন্ট করো
    // filteredQuestions.sort(() => Math.random() - 0.5);
    currentIndex = 0;
    score = 0;
    document.getElementById('homeScreen').classList.add('hidden');
    document.getElementById('quizScreen').classList.remove('hidden');
    document.getElementById('resultScreen').classList.add('hidden');
    loadQuestion();
}

function loadQuestion() {
    if (currentIndex >= filteredQuestions.length) {
        endQuiz();
        return;
    }
    resetState();
    const q = filteredQuestions[currentIndex];
    document.getElementById('questionCounter').innerText = `প্রশ্ন ${currentIndex + 1} / ${filteredQuestions.length}`;
    document.getElementById('questionText').innerText = q.question;
    const optionsDiv = document.getElementById('optionsContainer');
    optionsDiv.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => selectOption(idx, btn);
        optionsDiv.appendChild(btn);
    });
    startTimer();
}

function resetState() {
    clearInterval(timerInterval);
    timeLeft = 30;
    document.getElementById('timerFill').style.width = '100%';
    document.getElementById('nextBtn').classList.add('hidden');
    selectedOption = null;
    answered = false;
}

function selectOption(index, btnElement) {
    if (answered) return;
    answered = true;
    clearInterval(timerInterval);
    selectedOption = index;
    // সব অপশন disable
    const allOptions = document.querySelectorAll('.option-btn');
    allOptions.forEach(btn => btn.disabled = true);
    // নির্বাচিত অপশনে ক্লাস
    btnElement.classList.add('selected');
    
    const correctAnswer = filteredQuestions[currentIndex].answer;
    // ঠিক/ভুল চেক
    if (index === correctAnswer) {
        score++;
    }
    // সব অপশনের সঠিক/ভুল রং দেখাও
    allOptions.forEach((btn, idx) => {
        if (idx === correctAnswer) {
            btn.classList.add('correct');
        } else if (idx === selectedOption && idx !== correctAnswer) {
            btn.classList.add('wrong');
        }
    });
    document.getElementById('nextBtn').classList.remove('hidden');
}

function startTimer() {
    const fill = document.getElementById('timerFill');
    fill.style.width = '100%';
    timerInterval = setInterval(() => {
        timeLeft--;
        const percent = (timeLeft / 30) * 100;
        fill.style.width = percent + '%';
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (!answered) {
                // সময় শেষ, অটো ভুল
                answered = true;
                const allOptions = document.querySelectorAll('.option-btn');
                allOptions.forEach(btn => btn.disabled = true);
                const correctAnswer = filteredQuestions[currentIndex].answer;
                allOptions.forEach((btn, idx) => {
                    if (idx === correctAnswer) btn.classList.add('correct');
                });
                document.getElementById('nextBtn').classList.remove('hidden');
            }
        }
    }, 1000);
}

function nextQuestion() {
    currentIndex++;
    loadQuestion();
}

function endQuiz() {
    document.getElementById('quizScreen').classList.add('hidden');
    document.getElementById('resultScreen').classList.remove('hidden');
    document.getElementById('score').innerText = score;
    document.getElementById('totalQ').innerText = filteredQuestions.length;
    // রিভিউ
    const reviewDiv = document.getElementById('reviewSection');
    reviewDiv.innerHTML = '';
    filteredQuestions.forEach((q, i) => {
        const item = document.createElement('div');
        item.className = 'review-item';
        item.innerHTML = `<strong>${i+1}. ${q.question}</strong><br>✅ সঠিক উত্তর: ${q.options[q.answer]}`;
        reviewDiv.appendChild(item);
    });
}

function goHome() {
    document.getElementById('homeScreen').classList.remove('hidden');
    document.getElementById('resultScreen').classList.add('hidden');
}

// প্রশ্ন লোড করো
loadQuestions();