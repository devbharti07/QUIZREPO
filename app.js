const STORAGE_KEY = "pulsequiz-arena-state-advanced";
const QUESTIONS_PER_ROUND = 6;
const DAILY_REWARD_BASE = 25;
const FEEDBACK_DELAY_MS = 900;
const STREAK_BONUSES = { 3: 35, 7: 80, 15: 180 };

const DIFFICULTY_CONFIG = {
  easy: { label: "Easy", timeLimit: 20, points: 10 },
  medium: { label: "Medium", timeLimit: 15, points: 15 },
  hard: { label: "Hard", timeLimit: 12, points: 20 },
};

const SPIN_REWARDS = [
  { text: "100 Coins", coins: 100, xp: 0, p50: 0, pSkip: 0, pTime: 0, icon: "🪙" },
  { text: "50 XP", coins: 0, xp: 50, p50: 0, pSkip: 0, pTime: 0, icon: "⭐" },
  { text: "1x Skip", coins: 0, xp: 0, p50: 0, pSkip: 1, pTime: 0, icon: "⏭️" },
  { text: "50 Coins", coins: 50, xp: 0, p50: 0, pSkip: 0, pTime: 0, icon: "🪙" },
  { text: "20 XP", coins: 0, xp: 20, p50: 0, pSkip: 0, pTime: 0, icon: "⭐" },
  { text: "2x 50/50", coins: 0, xp: 0, p50: 2, pSkip: 0, pTime: 0, icon: "🌗" },
];
let currentSpinReward = null;

const DEFAULT_STATE = {
  playerName: "",
  profilePic: null, // base64 string
  preferredDifficulty: "medium",
  currentStreak: 0,
  longestStreak: 0,
  lostStreak: 0,
  lastActiveDate: null,
  lastClaimDate: null,
  coins: 100,
  gamesPlayed: 0,
  bestScore: 0,
  totalScore: 0,
  totalCorrectAnswers: 0,
  totalQuestionsAnswered: 0,
  rewardHistory: [],
  recentRewards: [],
  activeQuiz: null,
  lastResult: null,
  seenQuestions: { easy: [], medium: [], hard: [] },
  xp: 0,
  level: 1,
  powerUps: { "5050": 0, "skip": 0, "time": 0 },
  activeTheme: "dark",
  achievements: {},
  lastSpinDate: null,
  categoryStats: {}
};

const elements = {};
let state = null;
let currentScreenId = "home-screen";
let timerIntervalId = null;
let advanceTimeoutId = null;
let toastTimeoutId = null;
let audioContext = null;

document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
  cacheElements();
  state = loadState();
  applyTheme(state.activeTheme);
  const streakMessage = syncDailyActivity();
  
  bindEvents();
  renderHeader();
  renderHome();

  if (state.activeQuiz) {
    showToast("An unfinished quiz is saved and ready to resume.", "accent");
  } else if (streakMessage) {
    showToast(streakMessage, "accent");
  }
}

function cacheElements() {
  elements.screens = Array.from(document.querySelectorAll(".screen"));
  elements.playerName = document.getElementById("player-name");
  elements.difficultyButtons = Array.from(document.querySelectorAll(".difficulty-btn"));
  elements.startQuizBtn = document.getElementById("start-quiz-btn");
  elements.resumeQuizBtn = document.getElementById("resume-quiz-btn");
  elements.homeNote = document.getElementById("home-note");
  
  elements.headerLevelChip = document.getElementById("header-level-chip");
  elements.headerStreakChip = document.getElementById("header-streak-chip");
  elements.headerCoinsChip = document.getElementById("header-coins-chip");

  elements.navTriggers = Array.from(document.querySelectorAll(".nav-trigger"));
  elements.rewardAmount = document.getElementById("reward-amount");
  elements.claimRewardBtn = document.getElementById("claim-reward-btn");
  elements.recentRewardsList = document.getElementById("recent-rewards-list");

  elements.questionCategory = document.getElementById("question-category");
  elements.questionText = document.getElementById("question-text");
  elements.timerShell = document.getElementById("timer-shell");
  elements.timerValue = document.getElementById("timer-value");
  elements.timerBar = document.getElementById("timer-bar");
  elements.quizScoreChip = document.getElementById("quiz-score-chip");
  elements.quizProgressChip = document.getElementById("quiz-progress-chip");
  elements.quizProgressBar = document.getElementById("quiz-progress-bar");
  elements.optionsContainer = document.getElementById("options-container");
  elements.feedbackText = document.getElementById("feedback-text");
  elements.pauseQuizBtn = document.getElementById("pause-quiz-btn");

  elements.resultHeading = document.getElementById("result-heading");
  elements.resultSummary = document.getElementById("result-summary");
  elements.resultScore = document.getElementById("result-score");
  elements.resultXp = document.getElementById("result-xp");
  elements.xpProgressBar = document.getElementById("xp-progress-bar");
  elements.levelDisplayStart = document.getElementById("result-level-start");
  elements.levelDisplayEnd = document.getElementById("result-level-end");
  elements.answerReview = document.getElementById("answer-review");
  elements.playAgainBtn = document.getElementById("play-again-btn");

  // Level Modal
  elements.levelXpModal = document.getElementById("level-xp-modal");
  elements.modalLevelDisplay = document.getElementById("modal-level-display");
  elements.modalXpCurrent = document.getElementById("modal-xp-current");
  elements.modalXpReq = document.getElementById("modal-xp-req");
  elements.modalXpBar = document.getElementById("modal-xp-bar");
  elements.modalXpVisualRatio = document.getElementById("modal-xp-visual-ratio");
  elements.modalXpRemaining = document.getElementById("modal-xp-remaining");
  elements.closeLevelModalBtn = document.getElementById("close-level-modal-btn");
  
  elements.toast = document.getElementById("toast");
  elements.powerBtns = Array.from(document.querySelectorAll(".power-btn"));
  
  // Spin Wheel Modals
  elements.spinModal = document.getElementById("spin-modal");
  elements.spinWheel = document.getElementById("spin-wheel");
  elements.spinBtn = document.getElementById("spin-btn");
  elements.closeSpinBtn = document.getElementById("close-spin-btn");
  elements.spinWheelOpenBtn = document.getElementById("spin-wheel-open-btn");
  elements.wheelView = document.getElementById("wheel-view");
  elements.rewardView = document.getElementById("reward-view");
  elements.rewardIcon = document.getElementById("reward-icon");
  elements.rewardText = document.getElementById("reward-text");
  elements.collectRewardBtn = document.getElementById("collect-reward-btn");
}

function bindEvents() {
  elements.playerName.addEventListener("input", handlePlayerNameChange);
  
  elements.difficultyButtons.forEach((btn) => {
    btn.addEventListener("click", () => setPreferredDifficulty(btn.dataset.difficulty));
  });

  elements.navTriggers.forEach(btn => {
    btn.addEventListener("click", () => showScreen(btn.dataset.target));
  });

  elements.startQuizBtn.addEventListener("click", () => startNewQuiz());
  elements.resumeQuizBtn.addEventListener("click", resumeQuiz);
  
  elements.claimRewardBtn.addEventListener("click", claimDailyReward);
  elements.optionsContainer.addEventListener("click", handleOptionSelection);
  elements.pauseQuizBtn.addEventListener("click", pauseQuiz);
  elements.playAgainBtn.addEventListener("click", playAgain);

  elements.powerBtns.forEach(btn => btn.addEventListener("click", () => handlePowerUpUse(btn.dataset.type)));
  elements.headerLevelChip.addEventListener("click", openLevelModal);
  if(elements.closeLevelModalBtn) elements.closeLevelModalBtn.addEventListener("click", () => elements.levelXpModal.classList.add("hidden"));

  // Spin Wheel setup
  elements.spinWheelOpenBtn.addEventListener("click", openSpinWheel);
  elements.closeSpinBtn.addEventListener("click", () => elements.spinModal.classList.add("hidden"));
  elements.spinBtn.addEventListener("click", spinWheelAction);
  elements.collectRewardBtn.addEventListener("click", collectSpinReward);

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("beforeunload", saveState);
}

function applyTheme(themeName) { document.body.className = `theme-${themeName}`; }

function addRecentReward(text) {
  state.recentRewards.unshift({ text, date: Date.now() });
  state.recentRewards = state.recentRewards.slice(0, 3);
  saveState(); renderRecentRewards();
}

function renderRecentRewards() {
  if (!elements.recentRewardsList) return;
  if (!state.recentRewards || state.recentRewards.length === 0) {
    elements.recentRewardsList.innerHTML = `<li class="empty-state" style="padding:0.5rem; text-align:center;">No recent rewards.</li>`; return;
  }
  elements.recentRewardsList.innerHTML = "";
  state.recentRewards.forEach(r => {
    const d = new Date(r.date);
    const timeStr = `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
    elements.recentRewardsList.innerHTML += `<li class="challenge-item"><div class="challenge-info"><span class="challenge-reward">${r.text}</span><span class="micro-copy" style="font-size:0.75rem">${timeStr}</span></div></li>`;
  });
}

function handlePowerUpUse(type) {
  const quiz = state.activeQuiz;
  if (!quiz || quiz.questionResolved) return;
  
  if (type === "hint") {
    if (state.coins >= 15) {
      state.coins -= 15; saveState(); renderHeader();
      const currentQ = quiz.questions[quiz.currentIndex];
      const btns = Array.from(elements.optionsContainer.querySelectorAll(".option-btn"));
      const correctBtn = btns.find(b => b.dataset.option === currentQ.answer);
      if (correctBtn) {
        correctBtn.style.boxShadow = "0 0 10px var(--brand)";
        setTimeout(()=> correctBtn.style.boxShadow = "", 1500);
      }
    } else {
      showToast("Not enough coins for Hint. Need 15🪙.", "warning");
    }
    return;
  }

  if (state.powerUps[type] <= 0) return;

  state.powerUps[type] -= 1; saveState();

  if (type === "5050") {
    const currentQ = quiz.questions[quiz.currentIndex];
    const btns = Array.from(elements.optionsContainer.querySelectorAll(".option-btn"));
    const incorrectBtns = btns.filter(b => b.dataset.option !== currentQ.answer);
    const toRemove = shuffleArray(incorrectBtns).slice(0, 2);
    toRemove.forEach(b => { b.style.opacity = "0.2"; b.disabled = true; });
  } else if (type === "time") {
    quiz.questionStartedAt += 10000; saveState();
  } else if (type === "skip") {
    resolveQuestion(null, "skip");
  }
  updatePowerUpBadges();
}

function updatePowerUpBadges() {
  const c50 = document.getElementById("count-5050"); if (c50) c50.textContent = state.powerUps["5050"] || 0;
  const cs = document.getElementById("count-skip"); if (cs) cs.textContent = state.powerUps["skip"] || 0;
  const ct = document.getElementById("count-time"); if (ct) ct.textContent = state.powerUps["time"] || 0;
  
  const p50 = document.getElementById("pu-5050"); if(p50) p50.disabled = state.powerUps["5050"] === 0;
  const ps = document.getElementById("pu-skip"); if(ps) ps.disabled = state.powerUps["skip"] === 0;
  const pt = document.getElementById("pu-time"); if(pt) pt.disabled = state.powerUps["time"] === 0;
}

function handlePlayerNameChange(event) { state.playerName = sanitizeName(event.target.value); saveState(); }
function handleVisibilityChange() {
  if (document.hidden) { clearTimers(); saveState(); return; }
  if (currentScreenId === "quiz-screen" && state.activeQuiz) renderQuiz();
}

function setPreferredDifficulty(difficulty) {
  if (!DIFFICULTY_CONFIG[difficulty]) return;
  state.preferredDifficulty = difficulty;
  saveState(); renderHome();
}

function startNewQuiz() {
  const difficulty = state.preferredDifficulty || "medium";
  
  if (!window.QUIZ_QUESTIONS || window.QUIZ_QUESTIONS.length === 0) {
      showToast("Error: No question data available.", "warning");
      return;
  }
  
  if (!state.seenQuestions) state.seenQuestions = { easy: [], medium: [], hard: [] };
  if (!state.seenQuestions[difficulty]) state.seenQuestions[difficulty] = [];
  
  const fullPool = window.QUIZ_QUESTIONS.filter((question) => question.difficulty === difficulty);
  
  if (fullPool.length === 0) {
      showToast(`No questions found for ${difficulty} difficulty.`, "warning");
      return;
  }

  let questionPool = fullPool.filter((q) => !state.seenQuestions[difficulty].includes(q.id));
  
  let roundCount = QUESTIONS_PER_ROUND;
  if (questionPool.length < roundCount) { 
      state.seenQuestions[difficulty] = []; 
      questionPool = fullPool; 
  }

  const selectedQuestions = shuffleArray(questionPool).slice(0, roundCount);
  selectedQuestions.forEach(q => state.seenQuestions[difficulty].push(q.id));

  const questions = selectedQuestions.map((q) => ({
      id: q.id, prompt: q.prompt, category: q.category, difficulty: q.difficulty,
      answer: q.answer, options: shuffleArray(q.options ? q.options.slice() : [])
  }));

  state.activeQuiz = {
    difficulty, questions, currentIndex: 0, score: 0, correctCount: 0, wrongCount: 0,
    answers: [], startedAt: Date.now(), questionStartedAt: Date.now(),
    questionResolved: false, selectedOption: null, resolutionType: null, advanceAfterAt: null
  };

  saveState(); ensureAudioContext(); showScreen("quiz-screen"); renderQuiz();
}

function resumeQuiz() {
  if (!state.activeQuiz) return;
  ensureAudioContext(); showScreen("quiz-screen"); renderQuiz();
}

function pauseQuiz() {
  if (!state.activeQuiz) return;
  clearTimers(); saveState(); showScreen("home-screen"); renderHome();
  showToast("Quiz paused. You can resume later.", "accent");
}
function playAgain() { showScreen("home-screen"); }
function goHome() { clearTimers(); showScreen("home-screen"); renderHome(); }

function handleOptionSelection(event) {
  const button = event.target.closest(".option-btn");
  if (!button || !state.activeQuiz || state.activeQuiz.questionResolved) return;
  resolveQuestion(button.dataset.option, "answered");
}

function resolveQuestion(selectedOption, resolutionType) {
  const quiz = state.activeQuiz;
  if (!quiz || quiz.questionResolved) return;
  clearTimers();

  const currentQuestion = quiz.questions[quiz.currentIndex];
  const isCorrect = (resolutionType !== "skip") && (selectedOption === currentQuestion.answer);

  if (isCorrect) {
    const pts = DIFFICULTY_CONFIG[quiz.difficulty].points;
    quiz.score += pts; quiz.correctCount += 1;
    const cat = currentQuestion.category;
    if (!state.categoryStats[cat]) state.categoryStats[cat] = { correct:0, total:0 };
    state.categoryStats[cat].correct += 1;
  } else if (resolutionType !== "skip") {
    quiz.wrongCount += 1;
  }
  
  if(resolutionType !== "skip"){
    const cat = currentQuestion.category;
    if (!state.categoryStats[cat]) state.categoryStats[cat] = { correct:0, total:0 };
    state.categoryStats[cat].total += 1;
  }

  quiz.answers.push({
    prompt: currentQuestion.prompt, category: currentQuestion.category,
    selectedOption, correctAnswer: currentQuestion.answer, isCorrect, resolutionType,
  });

  quiz.questionResolved = true; quiz.selectedOption = selectedOption;
  quiz.resolutionType = resolutionType;
  quiz.advanceAfterAt = Date.now() + (resolutionType === "skip" ? 200 : FEEDBACK_DELAY_MS);

  saveState();
  if(resolutionType !== "skip") playOutcomeSound(isCorrect, resolutionType);
  renderQuiz();
}

function renderHome() {
  const rewardDetails = getDailyRewardDetails();
  const hasSavedQuiz = Boolean(state.activeQuiz);

  elements.playerName.value = state.playerName || "";
  elements.difficultyButtons.forEach((btn) => { btn.classList.toggle("is-selected", btn.dataset.difficulty === state.preferredDifficulty); });

  elements.rewardAmount.textContent = `${rewardDetails.amount} coins`;
  elements.claimRewardBtn.disabled = rewardDetails.claimed;
  elements.claimRewardBtn.textContent = rewardDetails.claimed ? "Claimed" : "Claim";

  elements.resumeQuizBtn.classList.toggle("hidden", !hasSavedQuiz); renderRecentRewards();
}

function renderQuiz() {
  const quiz = state.activeQuiz;
  if (!quiz || !quiz.questions || quiz.questions.length === 0) { goHome(); return; }
  clearTimers();
  
  const currentQuestion = quiz.questions[quiz.currentIndex];
  if (!currentQuestion) { finishQuiz(); return; }

  const completedCount = quiz.currentIndex + (quiz.questionResolved ? 1 : 0);

  elements.questionCategory.textContent = `${currentQuestion.category} • ${quiz.currentIndex + 1} / ${quiz.questions.length}`;
  elements.questionText.textContent = currentQuestion.prompt;
  elements.quizScoreChip.textContent = `Score ${quiz.score}`;
  elements.quizProgressChip.textContent = `${quiz.currentIndex + 1} / ${quiz.questions.length}`;
  elements.quizProgressBar.style.width = `${(completedCount / quiz.questions.length) * 100}%`;
  elements.feedbackText.textContent = "Choose an answer."; elements.feedbackText.className = "feedback-text";
  
  updatePowerUpBadges(); renderOptions(currentQuestion, quiz.questionResolved);

  if (quiz.questionResolved) { applyResolvedStyles(currentQuestion, quiz); scheduleAdvance(); } 
  else { updateTimerDisplay(); startTimer(); }
}

function renderOptions(question, isResolved) {
  elements.optionsContainer.innerHTML = "";
  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button"; button.className = "option-btn";
    button.dataset.option = option; button.disabled = isResolved;
    button.innerHTML = `<span class="option-badge">${String.fromCharCode(65 + index)}</span><span class="option-copy">${option}</span>`;
    elements.optionsContainer.appendChild(button);
  });
}

function applyResolvedStyles(question, quiz) {
  const lastAnswer = quiz.answers[quiz.answers.length - 1];
  const btns = Array.from(elements.optionsContainer.querySelectorAll(".option-btn"));

  btns.forEach((btn) => {
    const opt = btn.dataset.option; btn.disabled = true;
    if (opt === question.answer) btn.classList.add("is-correct");
    else if (quiz.selectedOption && opt === quiz.selectedOption) btn.classList.add("is-wrong");
    else btn.classList.add("is-muted");
  });

  if (!lastAnswer) return;
  if(lastAnswer.resolutionType === "skip") {
    elements.feedbackText.textContent = "Skipped!"; elements.feedbackText.classList.add("is-timeout"); return;
  }
  if (lastAnswer.isCorrect) {
    elements.feedbackText.textContent = `Correct! +${DIFFICULTY_CONFIG[quiz.difficulty].points} pts.`; elements.feedbackText.classList.add("is-correct");
  } else if (lastAnswer.resolutionType === "timeout") {
    elements.feedbackText.textContent = `Time's up! Correct was ${lastAnswer.correctAnswer}.`; elements.feedbackText.classList.add("is-timeout");
  } else {
    elements.feedbackText.textContent = `Wrong. Correct was ${lastAnswer.correctAnswer}.`; elements.feedbackText.classList.add("is-wrong");
  }
}

function startTimer() { timerIntervalId = window.setInterval(() => { if (updateTimerDisplay()) resolveQuestion(null, "timeout"); }, 200); }

function updateTimerDisplay() {
  if (!state.activeQuiz) return false;
  const timeLimitMs = DIFFICULTY_CONFIG[state.activeQuiz.difficulty].timeLimit * 1000;
  const elapsed = Date.now() - state.activeQuiz.questionStartedAt;
  const remainingMs = Math.max(0, timeLimitMs - elapsed);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const fillPercent = Math.max(0, (remainingMs / timeLimitMs) * 100);

  elements.timerValue.textContent = `${remainingSeconds}s`;
  elements.timerBar.style.width = `${fillPercent}%`;
  elements.timerBar.style.background = remainingMs <= timeLimitMs / 3 ? "linear-gradient(90deg, #ff7b73, #ffd977)" : "linear-gradient(90deg, #58d5bf, #ffd06b)";
  elements.timerShell.classList.toggle("is-urgent", remainingMs <= timeLimitMs / 3);

  return remainingMs <= 0;
}

function scheduleAdvance() {
  const quiz = state.activeQuiz; if (!quiz || !quiz.questionResolved) return;
  const waitTime = Math.max(0, quiz.advanceAfterAt - Date.now());
  advanceTimeoutId = window.setTimeout(advanceQuiz, waitTime);
}

function advanceQuiz() {
  const quiz = state.activeQuiz; if (!quiz) return;
  clearTimers(); quiz.currentIndex += 1;
  if (quiz.currentIndex >= quiz.questions.length) { finishQuiz(); return; }
  
  quiz.questionStartedAt = Date.now(); quiz.questionResolved = false;
  quiz.selectedOption = null; quiz.resolutionType = null; quiz.advanceAfterAt = null;
  saveState(); renderQuiz();
}

function finishQuiz() {
  const quiz = state.activeQuiz; if (!quiz) return;
  const accuracy = quiz.questions.length ? Math.round((quiz.correctCount / quiz.questions.length) * 100) : 0;
  
  state.gamesPlayed += 1; state.bestScore = Math.max(state.bestScore, quiz.score);
  state.totalScore += quiz.score; state.totalCorrectAnswers += quiz.correctCount; state.totalQuestionsAnswered += quiz.questions.length;
  
  const xpEarned = (quiz.correctCount * 15) + (accuracy === 100 ? 50 : 0);
  state.xp += xpEarned;
  
  let xpForNextLevel = state.level * 100; let levelUpEarned = false;
  if (state.xp >= xpForNextLevel) {
     state.xp -= xpForNextLevel; state.level += 1; state.coins += 50;
     levelUpEarned = true; addRecentReward(`Level ${state.level} Reached! (+50🪙)`);
  }

  let bonusCoins = Math.floor(xpEarned / 2); state.coins += bonusCoins;
  if (levelUpEarned) showToast(`🎉 Level Up! You are now Level ${state.level}!`, "success");

  let heading = "Round complete.";
  if(accuracy >= 80) heading = "Great Job!"; else if(accuracy <= 30) heading = "Needs Practice!";

  state.lastResult = {
    difficulty: quiz.difficulty, score: quiz.score, totalQuestions: quiz.questions.length,
    correctCount: quiz.correctCount, wrongCount: quiz.wrongCount, accuracy,
    xpEarned, bonusCoins, heading, answers: quiz.answers, completedAt: Date.now(),
  };

  state.activeQuiz = null; saveState(); renderHeader(); renderResult();
  showScreen("result-screen");
}

function renderResult() {
  const result = state.lastResult; if (!result) return;
  elements.resultHeading.textContent = result.heading;
  elements.resultSummary.textContent = `Answered ${result.correctCount}/${result.totalQuestions} correctly. Got ${result.bonusCoins} coins.`;
  elements.resultScore.textContent = String(result.score); elements.resultXp.textContent = `+${result.xpEarned} XP`;
  
  elements.levelDisplayStart.textContent = `Lvl ${state.level}`;
  if(elements.levelDisplayEnd) elements.levelDisplayEnd.textContent = `Lvl ${state.level + 1}`;
  elements.xpProgressBar.style.width = `${Math.min(100, (state.xp / (state.level*100))*100)}%`;

  elements.answerReview.innerHTML = "";
  (result.answers || []).forEach((ans, idx) => {
      const cls = ans.isCorrect ? "correct" : (ans.resolutionType==="skip"?"timeout":"wrong");
      const label = ans.isCorrect ? "Correct" : (ans.resolutionType==="skip"?"Skipped":"Wrong");
      elements.answerReview.innerHTML += `
        <div class="review-card">
           <div class="review-card-header">
             <p class="review-title">${idx+1}. ${ans.prompt}</p><span class="review-pill ${cls}">${label}</span>
           </div>
           <p class="review-answer">Your answer: ${ans.selectedOption || "None"}</p><p class="review-answer">Correct: ${ans.correctAnswer}</p>
        </div>`;
  });
}

function renderHeader() {
  elements.headerLevelChip.textContent = `⭐ Lvl ${state.level || 1}`;
  elements.headerStreakChip.textContent = `🔥 ${state.currentStreak || 0}`;
  elements.headerCoinsChip.textContent = `🪙 ${state.coins || 0}`;
}

// -- LEVEL MODAL PROCESS --
function openLevelModal() {
  if (!elements.levelXpModal) return;
  const currentLvl = state.level || 1;
  const currentXp = state.xp || 0;
  const reqXp = currentLvl * 100;
  
  elements.modalLevelDisplay.textContent = `Lvl ${currentLvl}`;
  elements.modalXpCurrent.textContent = `${currentXp} XP`;
  elements.modalXpReq.textContent = `${reqXp} XP`;
  elements.modalXpVisualRatio.textContent = `${currentXp} / ${reqXp} XP`;
  elements.modalXpRemaining.textContent = `${reqXp - currentXp} XP needed to reach next level`;
  
  const pct = Math.min(100, Math.max(0, Math.round((currentXp / reqXp) * 100)));
  elements.modalXpBar.style.width = `${pct}%`;
  
  elements.levelXpModal.classList.remove("hidden");
}

// -- SPIN WHEEL DOM GENERATOR --
function initSpinWheelSlices() {
   elements.spinWheel.innerHTML = "";
   SPIN_REWARDS.forEach((rew, i) => {
      const angle = i * 60; // 6 segments exactly
      const label = document.createElement("div");
      label.className = "wheel-label";
      // To correctly face out visually relative to center
      label.style.transform = `rotate(${angle + 30 - 90}deg)`; 
      label.innerHTML = `<span style="display:inline-flex; align-items:center; gap:0.25rem;">${rew.icon} ${rew.text}</span>`;
      elements.spinWheel.appendChild(label);
   });
}

// -- SPIN WHEEL PROCESS --
function openSpinWheel() {
  initSpinWheelSlices();
  const today = getDateKey();
  
  document.getElementById("spin-title").textContent = "Daily Spin Wheel";
  
  if (state.lastSpinDate === today) {
    elements.wheelView.classList.add("hidden"); elements.rewardView.classList.remove("hidden");
    elements.rewardIcon.textContent = "⏳";
    document.getElementById("spin-title").textContent = "Come back tomorrow!";
    elements.rewardText.textContent = "You have already spun the wheel today."; 
    elements.collectRewardBtn.style.display = "none";
    return;
  }
  
  elements.wheelView.classList.remove("hidden"); 
  elements.rewardView.classList.add("hidden");
  elements.collectRewardBtn.style.display = "block";
  document.getElementById("spin-status").textContent = "Test your luck for extra rewards!";
  elements.spinBtn.disabled = false;
  elements.spinWheel.style.transition = 'none'; elements.spinWheel.style.transform = `rotate(0deg)`;
  
  elements.spinModal.classList.remove("hidden");
}

function spinWheelAction() {
  elements.spinBtn.disabled = true; document.getElementById("spin-status").textContent = "Spinning...";
  
  const winIdx = Math.floor(Math.random() * SPIN_REWARDS.length);
  currentSpinReward = SPIN_REWARDS[winIdx];
  
  // Angle logic to stop the wheel predictably on the correct slice
  // Slice i spans from i*60 to (i+1)*60. Center is i*60 + 30.
  // Wheel spins clockwise, pointer is at -90deg (or 0deg visual top depending on CSS layout, it's strictly at top).
  // Pure math: to bring slice center `winIdx * 60 + 30` to 0deg top, we rotate by `-(winIdx*60+30)`.
  const targetRotation = 360 * 5 - (winIdx * 60 + 30);
  
  elements.spinWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  elements.spinWheel.style.transform = `rotate(${targetRotation}deg)`;
  
  setTimeout(() => {
     elements.wheelView.classList.add("hidden"); 
     document.getElementById("spin-title").textContent = "Reward Unlocked!";
     elements.rewardIcon.textContent = currentSpinReward.icon; 
     elements.rewardText.textContent = `🎉 Congratulations! You won ${currentSpinReward.text}!`;
     elements.rewardView.classList.remove("hidden");
  }, 4100);
}

function collectSpinReward() {
   if (!currentSpinReward) return;
   
   if (currentSpinReward.coins) state.coins += currentSpinReward.coins;
   if (currentSpinReward.xp) {
      state.xp += currentSpinReward.xp;
      const req = state.level * 100;
      if(state.xp >= req) {
         state.xp -= req; state.level++; state.coins += 50;
      }
   }
   if (currentSpinReward.p50) state.powerUps["5050"] += currentSpinReward.p50;
   if (currentSpinReward.pSkip) state.powerUps["skip"] += currentSpinReward.pSkip;
   
   state.lastSpinDate = getDateKey();
   addRecentReward(`Wheel: ${currentSpinReward.text}`);
   saveState(); renderHeader();
   
   elements.spinModal.classList.add("hidden");
   currentSpinReward = null;
}

// Utility and Helpers
function claimDailyReward() {
  const today = getDateKey();
  if (state.lastClaimDate === today) { showToast("Already claimed today.", "warning"); return; }
  const rd = getDailyRewardDetails();
  state.lastClaimDate = today; state.coins += rd.amount;
  addRecentReward(`Daily Hub: ${rd.amount} coins`);
  saveState(); renderHeader(); renderHome();
  showToast(`Claimed ${rd.amount} coins!`, "success");
}

function syncDailyActivity() {
  const today = getDateKey();
  if (!state.lastActiveDate) { state.currentStreak = 1; state.longestStreak = 1; state.lastActiveDate = today; return "First streak started."; }
  if (state.lastActiveDate === today) return "";
  const from = createSafeDate(state.lastActiveDate); const to = createSafeDate(today);
  const diff = Math.round((to - from)/86400000);
  if (diff === 1) {
    state.currentStreak += 1; state.longestStreak = Math.max(state.longestStreak, state.currentStreak); state.lostStreak = 0;
  } else if (diff > 1) { state.lostStreak = state.currentStreak; state.currentStreak = 1; }
  state.lastActiveDate = today; saveState();
  return diff===1 ? "Streak extended!" : (diff>1 ? "Streak lost!" : "");
}

function getDailyRewardDetails() {
  const today = getDateKey(); const bonus = STREAK_BONUSES[state.currentStreak] || 0;
  return { amount: DAILY_REWARD_BASE + bonus, bonus, claimed: state.lastClaimDate === today };
}

function showScreen(screenId) {
  currentScreenId = screenId;
  elements.screens.forEach(s => {
      s.classList.remove("is-visible");
      s.classList.add("hidden");
      s.hidden = true;
  });
  const act = document.getElementById(screenId);
  if(act) { 
      act.classList.remove("hidden"); 
      act.classList.add("is-visible"); 
      act.hidden = false;
  }
  
  if (elements.navTriggers) {
      elements.navTriggers.forEach(n => n.classList.toggle("is-active", n.dataset.target === screenId));
  }
}

function showToast(message, tone="accent") {
  clearTimeout(toastTimeoutId); elements.toast.textContent = message; elements.toast.className = `toast ${tone} is-visible`;
  toastTimeoutId = setTimeout(() => elements.toast.className = "toast", 2800);
}

function loadState() {
  let s; try { s = JSON.parse(window.localStorage.getItem(STORAGE_KEY)); } catch(e){}
  const merged = { ...DEFAULT_STATE, ...(s||{}) };
  merged.powerUps = { ...DEFAULT_STATE.powerUps, ...(merged.powerUps||{}) };
  merged.categoryStats = merged.categoryStats || {};
  merged.recentRewards = merged.recentRewards || [];
  merged.seenQuestions = merged.seenQuestions || { easy: [], medium: [], hard: [] };
  if (!merged.seenQuestions.easy) merged.seenQuestions.easy = [];
  if (!merged.seenQuestions.medium) merged.seenQuestions.medium = [];
  if (!merged.seenQuestions.hard) merged.seenQuestions.hard = [];
  return merged;
}

function saveState() { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e){} }
function ensureAudioContext() { if (audioContext && audioContext.state === "suspended") audioContext.resume().catch(()=>{}); if (!audioContext) { const C = window.AudioContext || window.webkitAudioContext; if(C) audioContext = new C(); } }
function playOutcomeSound(isCorrect, resolutionType) {
  ensureAudioContext(); if(!audioContext) return; const now = audioContext.currentTime;
  if(isCorrect) { playTone(620,now,0.12,"sine",0.08); playTone(830,now+0.1,0.16,"triangle",0.06); } 
  else if(resolutionType==="timeout"){ playTone(250,now,0.14,"triangle",0.08); playTone(180,now+0.1,0.18,"triangle",0.06); } 
  else { playTone(210,now,0.16,"sawtooth",0.08); playTone(150,now+0.12,0.18,"sawtooth",0.06); }
}
function playTone(f, s, d, t, v) {
  const o = audioContext.createOscillator(); const g = audioContext.createGain();
  o.type = t; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(v, s+0.02); g.gain.exponentialRampToValueAtTime(0.0001, s+d);
  o.connect(g); g.connect(audioContext.destination); o.start(s); o.stop(s+d);
}
function getDateKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function createSafeDate(dateKey) { const [y, m, d] = dateKey.split("-").map(Number); return new Date(y, m-1, d, 12, 0,0,0); }
function sanitizeName(v) { return v.replace(/\s+/g," ").slice(0,24); }
function shuffleArray(items) { const cp = items.slice(); for(let i=cp.length-1; i>0; i--){ const j = Math.floor(Math.random()*(i+1)); [cp[i], cp[j]] = [cp[j], cp[i]]; } return cp; }
function clearTimers() { clearInterval(timerIntervalId); clearTimeout(advanceTimeoutId); timerIntervalId=null; advanceTimeoutId=null; }
