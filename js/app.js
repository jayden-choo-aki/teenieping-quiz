// 오디오 컨텍스트 (효과음용)
let audioContext = null;

// 효과음 초기화
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// 효과음 재생 함수
function playSound(type) {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch(type) {
        case 'correct':
            // 정답: 밝고 상승하는 음
            oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            break;

        case 'wrong':
            // 오답: 부드러운 하강음
            oscillator.frequency.setValueAtTime(330, audioContext.currentTime); // E4
            oscillator.frequency.setValueAtTime(262, audioContext.currentTime + 0.15); // C4
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;

        case 'click':
            // 버튼 클릭: 짧은 틱 소리
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.05);
            break;

        case 'start':
            // 게임 시작: 활기찬 시작음
            oscillator.frequency.setValueAtTime(392, audioContext.currentTime); // G4
            oscillator.frequency.setValueAtTime(523, audioContext.currentTime + 0.1); // C5
            oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.2); // E5
            gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.35);
            break;

        case 'complete':
            // 게임 완료: 축하 팡파레
            playFanfare();
            return;
    }
}

// 축하 팡파레 (여러 음 연속 재생)
function playFanfare() {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
        setTimeout(() => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.setValueAtTime(freq, audioContext.currentTime);
            gain.gain.setValueAtTime(0.2, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.3);
        }, i * 150);
    });
}

// 게임 상태
let gameState = {
    mode: 'easy',
    currentQuestion: 0,
    totalQuestions: 5,
    correctAnswers: 0,
    questions: [],
    timeLimit: 0,
    timer: null
};

// 화면 전환
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// 게임 시작
function startGame(mode) {
    initAudio();
    playSound('start');

    gameState.mode = mode;
    gameState.currentQuestion = 0;
    gameState.correctAnswers = 0;
    gameState.totalQuestions = mode === 'easy' ? 5 : 10;
    gameState.timeLimit = mode === 'easy' ? 0 : 15;

    // 랜덤 문제 생성
    gameState.questions = generateQuestions(gameState.totalQuestions);

    showScreen('game-screen');
    showQuestion();
}

// 문제 생성
function generateQuestions(count) {
    const shuffled = [...teeniepings].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// 문제 표시
function showQuestion() {
    const question = gameState.questions[gameState.currentQuestion];

    // 별 표시 업데이트
    updateStars();

    // 진행 상황 업데이트
    document.getElementById('progress').textContent =
        `${gameState.currentQuestion + 1} / ${gameState.totalQuestions}`;

    // 캐릭터 이미지 표시
    const imgContainer = document.querySelector('#game-screen .character-image');
    imgContainer.style.background = '#FFF0F5';
    imgContainer.innerHTML = `<img src="images/${question.image}" alt="티니핑" style="max-width: 180px; max-height: 180px; object-fit: contain;" onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=\\'font-size: 50px; color: ${question.color};\\'>?</span>';">`;

    // 선택지 생성 (3지선다)
    const choices = generateChoices(question);
    const choicesContainer = document.getElementById('choices');
    choicesContainer.innerHTML = '';

    choices.forEach(choice => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = choice.name;
        button.onclick = () => selectAnswer(choice, question);
        choicesContainer.appendChild(button);
    });

    // 타이머 시작 (도전 모드)
    if (gameState.timeLimit > 0) {
        startTimer();
    } else {
        document.getElementById('timer').textContent = '';
    }
}

// 선택지 생성 (정답 1개 + 오답 2개)
function generateChoices(correctAnswer) {
    const otherChoices = teeniepings
        .filter(t => t.id !== correctAnswer.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);

    const choices = [correctAnswer, ...otherChoices];
    return choices.sort(() => Math.random() - 0.5);
}

// 별 업데이트
function updateStars() {
    const starsContainer = document.getElementById('stars');
    let stars = '';
    for (let i = 0; i < gameState.totalQuestions; i++) {
        if (i < gameState.correctAnswers) {
            stars += '\u2B50';
        } else {
            stars += '\u2606';
        }
    }
    starsContainer.textContent = stars;
}

// 타이머
function startTimer() {
    let timeLeft = gameState.timeLimit;
    const timerElement = document.getElementById('timer');
    timerElement.textContent = `${timeLeft}초`;

    if (gameState.timer) {
        clearInterval(gameState.timer);
    }

    gameState.timer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `${timeLeft}초`;

        if (timeLeft <= 0) {
            clearInterval(gameState.timer);
            timeUp();
        }
    }, 1000);
}

// 시간 초과
function timeUp() {
    playSound('wrong');
    const question = gameState.questions[gameState.currentQuestion];
    showAnswerScreen(false, question);
}

// 답 선택
function selectAnswer(selected, correct) {
    playSound('click');

    if (gameState.timer) {
        clearInterval(gameState.timer);
    }

    const isCorrect = selected.id === correct.id;

    if (isCorrect) {
        gameState.correctAnswers++;
        playSound('correct');
    } else {
        playSound('wrong');
    }

    // 버튼 스타일 변경
    const buttons = document.querySelectorAll('.choice-btn');
    buttons.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correct.name) {
            btn.classList.add('correct');
        } else if (btn.textContent === selected.name && !isCorrect) {
            btn.classList.add('wrong');
        }
    });

    // 잠시 후 정답 화면으로
    setTimeout(() => {
        showAnswerScreen(isCorrect, correct);
    }, 800);
}

// 정답 화면 표시
function showAnswerScreen(isCorrect, character) {
    const resultElement = document.getElementById('answer-result');
    const imgContainer = document.querySelector('#answer-screen .character-image');
    const descElement = document.getElementById('answer-description');

    if (isCorrect) {
        resultElement.textContent = '\uD83C\uDF89 정답이에요! \uD83C\uDF89';
        resultElement.className = 'answer-result correct';
    } else {
        resultElement.textContent = '\uD83D\uDC97 아쉬워요! 다음엔 맞춰봐요!';
        resultElement.className = 'answer-result wrong';
    }

    // 캐릭터 이미지 표시
    imgContainer.style.background = '#FFF0F5';
    imgContainer.innerHTML = `<img src="images/${character.image}" alt="${character.name}" style="max-width: 180px; max-height: 180px; object-fit: contain;" onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=\\'font-size: 30px; color: ${character.color}; font-weight: bold;\\'>${character.name}</span>';">`;

    descElement.textContent = character.description;

    // 마지막 문제인지 확인
    const nextBtn = document.querySelector('.btn-next');
    if (gameState.currentQuestion >= gameState.totalQuestions - 1) {
        nextBtn.textContent = '결과 보기';
        nextBtn.onclick = showResult;
    } else {
        nextBtn.textContent = '다음 문제';
        nextBtn.onclick = nextQuestion;
    }

    showScreen('answer-screen');
}

// 다음 문제
function nextQuestion() {
    gameState.currentQuestion++;
    showScreen('game-screen');
    showQuestion();
}

// 결과 화면
function showResult() {
    playSound('complete');

    const starsContainer = document.getElementById('result-stars');
    const scoreElement = document.getElementById('result-score');

    // 별 표시
    let stars = '';
    for (let i = 0; i < gameState.totalQuestions; i++) {
        if (i < gameState.correctAnswers) {
            stars += '\u2B50';
        } else {
            stars += '\u2606';
        }
    }
    starsContainer.textContent = stars;

    // 점수 표시
    scoreElement.textContent = `${gameState.correctAnswers}개 / ${gameState.totalQuestions}개 정답!`;

    showScreen('result-screen');
}

// 다시하기
function restartGame() {
    startGame(gameState.mode);
}

// 처음으로
function goHome() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    showScreen('main-screen');
}

// 도감 상태
let collectionState = {
    currentIndex: 0
};

// 도감 열기
function openCollection() {
    initAudio();
    playSound('click');

    const grid = document.getElementById('collection-grid');
    grid.innerHTML = '';

    // 캐릭터 카드 생성
    teeniepings.forEach((character, index) => {
        const card = document.createElement('div');
        card.className = 'collection-card';
        card.onclick = () => showCharacterDetail(index);
        card.innerHTML = `
            <div class="collection-card-image">
                <img src="images/${character.image}" alt="${character.name}"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=\\'font-size: 24px; color: ${character.color};\\'>♥</span>';">
            </div>
            <div class="collection-card-name">${character.name}</div>
        `;
        grid.appendChild(card);
    });

    // 캐릭터 수 표시
    document.getElementById('collection-count').textContent = `${teeniepings.length}마리`;

    showScreen('collection-screen');
}

// 캐릭터 상세 보기
function showCharacterDetail(index) {
    playSound('click');
    collectionState.currentIndex = index;

    const character = teeniepings[index];

    // 이미지 표시
    const imgContainer = document.getElementById('detail-image');
    imgContainer.innerHTML = `<img src="images/${character.image}" alt="${character.name}"
        onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=\\'font-size: 50px; color: ${character.color};\\'>♥</span>';">`;

    // 정보 표시
    document.getElementById('detail-name').textContent = character.name;
    document.getElementById('detail-emotion').textContent = `${character.emotion}의 티니핑`;
    document.getElementById('detail-emotion').style.background = `linear-gradient(135deg, ${character.color}88 0%, ${character.color} 100%)`;
    document.getElementById('detail-description').textContent = character.description;

    // 이전/다음 버튼 상태
    document.getElementById('prev-btn').style.visibility = index === 0 ? 'hidden' : 'visible';
    document.getElementById('next-btn').style.visibility = index === teeniepings.length - 1 ? 'hidden' : 'visible';

    showScreen('detail-screen');
}

// 이전 캐릭터
function showPrevCharacter() {
    if (collectionState.currentIndex > 0) {
        showCharacterDetail(collectionState.currentIndex - 1);
    }
}

// 다음 캐릭터
function showNextCharacter() {
    if (collectionState.currentIndex < teeniepings.length - 1) {
        showCharacterDetail(collectionState.currentIndex + 1);
    }
}

// 도감으로 돌아가기
function backToCollection() {
    playSound('click');
    showScreen('collection-screen');
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    showScreen('main-screen');
});
