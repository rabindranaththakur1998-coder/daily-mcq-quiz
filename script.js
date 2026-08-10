let questions = [];
let filtered = [];
let currentIdx = 0;
let userAns = {};
let marked = {};
let timer = null;
let timeLeft = 30;
let quizStart = 0;
let active = false;

window.addEventListener('load', () => {
    document.getElementById('quizDate').value = new Date().toISOString().split('T')[0];

    // প্যালেট কন্ট্রোল
    document.getElementById('paletteBtn').addEventListener('click', () => {
        document.getElementById('paletteModal').classList.remove('hidden');
    });
    document.getElementById('closePalette').addEventListener('click', () => {
        document.getElementById('paletteModal').classList.add('hidden');
    });

    loadQuestions();
    bindButtons();
});

function bindButtons() {
    document.getElementById('prevBtn').addEventListener('click', prevQ);
    document.getElementById('nextBtn').addEventListener('click', nextQ);
    document.getElementById('skipBtn').addEventListener('click', skipQ);
    document.getElementById('clearBtn').addEventListener('click', clearAns);
    document.getElementById('markReviewBtn').addEventListener('click', toggleReview);
    document.getElementById('submitBtn').addEventListener('click', submitQuiz);
}

async function loadQuestions() {
    try {
        const res = await fetch('questions.json');
        questions = await res.json();
    } catch(e) {
        alert('questions.json লোড হয়নি!');
    }
}

function startQuiz(subj) {
    if (!questions.length) { alert('প্রশ্ন নেই'); return; }
    const date = document.getElementById('quizDate').value;
    if (!date) { alert('তারিখ বাছাই করো'); return; }
    filtered = questions.filter(q => q.subject === subj && q.date === date);
    if (!filtered.length) { alert('এই বিষয়/তারিখে কোনো প্রশ্ন নেই'); return; }

    currentIdx = 0;
    userAns = {};
    marked = {};
    filtered.forEach((_, i) => { userAns[i] = null; marked[i] = false; });
    active = true;
    quizStart = Date.now();

    document.getElementById('homeScreen').classList.add('hidden');
    document.getElementById('quizScreen').classList.remove('hidden');
    document.getElementById('resultScreen').classList.add('hidden');
    renderPalette();
    showQuestion();
}

function showQuestion() {
    if (!active) return;
    resetTimer();
    const q = filtered[currentIdx];
    document.getElementById('questionCounter').innerText = `প্রশ্ন ${currentIdx+1}/${filtered.length}`;
    document.getElementById('questionText').innerText = q.question;
    const optsDiv = document.getElementById('optionsContainer');
    optsDiv.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => selectOption(idx);
        if (userAns[currentIdx] === idx) btn.classList.add('selected');
        optsDiv.appendChild(btn);
    });
    updateReviewBtn();
    startTimer();
}

function selectOption(idx) {
    if (!active) return;
    userAns[currentIdx] = idx;
    marked[currentIdx] = false;
    showQuestion();
    renderPalette();
}

function skipQ() {
    if (!active) return;
    if (userAns[currentIdx] === null) userAns[currentIdx] = "skipped";
    renderPalette();
    if (currentIdx < filtered.length-1) { currentIdx++; showQuestion(); }
    else submitQuiz();
}

function clearAns() {
    if (!active) return;
    userAns[currentIdx] = null;
    showQuestion();
    renderPalette();
}

function toggleReview() {
    if (!active) return;
    marked[currentIdx] = !marked[currentIdx];
    updateReviewBtn();
    renderPalette();
}

function updateReviewBtn() {
    const btn = document.getElementById('markReviewBtn');
    if (marked[currentIdx]) {
        btn.style.background = '#FFC107';
        btn.style.color = 'white';
    } else {
        btn.style.background = 'white';
        btn.style.color = '#2D6A4F';
    }
}

function renderPalette() {
    const grid = document.getElementById('paletteGrid');
    grid.innerHTML = '';
    filtered.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.className = 'palette-btn';
        btn.innerText = i+1;
        if (userAns[i] !== null && userAns[i] !== "skipped") btn.classList.add('answered');
        else if (marked[i]) btn.classList.add('review');
        else if (userAns[i] === null) btn.classList.add('not-answered');
        if (i === currentIdx) btn.classList.add('current');
        btn.onclick = () => {
            currentIdx = i;
            showQuestion();
            renderPalette();
            document.getElementById('paletteModal').classList.add('hidden');
        };
        grid.appendChild(btn);
    });
}

function startTimer() {
    timeLeft = 30;
    updateTimerUI();
    clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        if (timeLeft <= 0) {
            clearInterval(timer);
            if (active) {
                if (userAns[currentIdx] === null) userAns[currentIdx] = "skipped";
                if (currentIdx < filtered.length-1) { currentIdx++; showQuestion(); renderPalette(); }
                else submitQuiz();
            }
        }
    }, 1000);
}

function updateTimerUI() {
    document.getElementById('timerText').innerText = `00:${timeLeft < 10 ? '0'+timeLeft : timeLeft}`;
    document.getElementById('timerFill').style.width = (timeLeft/30)*100 + '%';
}

function resetTimer() { clearInterval(timer); }

function prevQ() {
    if (!active || currentIdx <= 0) return;
    currentIdx--;
    showQuestion();
    renderPalette();
}
function nextQ() {
    if (!active || currentIdx >= filtered.length-1) return;
    currentIdx++;
    showQuestion();
    renderPalette();
}

function submitQuiz() {
    if (!active) return;
    active = false;
    clearInterval(timer);
    let correct = 0, wrong = 0, skipped = 0;
    filtered.forEach((q, i) => {
        const ans = userAns[i];
        if (ans === null || ans === "skipped") skipped++;
        else if (ans === q.answer) correct++;
        else wrong++;
    });
    const total = filtered.length;
    const percent = Math.round((correct/total)*100);
    const time = Math.round((Date.now()-quizStart)/1000);

    document.getElementById('quizScreen').classList.add('hidden');
    document.getElementById('resultScreen').classList.remove('hidden');
    document.getElementById('scorePercent').innerText = percent + '%';
    document.getElementById('scoreObtained').innerText = correct;
    document.getElementById('totalQ').innerText = total;
    document.getElementById('correctCount').innerText = correct;
    document.getElementById('wrongCount').innerText = wrong;
    document.getElementById('skippedCount').innerText = skipped;
    document.getElementById('timeTaken').innerText = time;

    const reviewDiv = document.getElementById('reviewSection');
    reviewDiv.innerHTML = '';
    filtered.forEach((q, i) => {
        const ans = userAns[i];
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
    active = false;
    clearInterval(timer);
    document.getElementById('quizScreen').classList.add('hidden');
    document.getElementById('resultScreen').classList.add('hidden');
    document.getElementById('homeScreen').classList.remove('hidden');
}