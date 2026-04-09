const STORAGE_KEY = "pulsequiz-arena-state-v1";
const QUESTIONS_PER_ROUND = 6;
const DAILY_REWARD_BASE = 25;
const FEEDBACK_DELAY_MS = 900;
const MAX_LEADERBOARD_ENTRIES = 8;
const STREAK_BONUSES = {
  3: 35,
  7: 80,
  15: 180,
};

const DIFFICULTY_CONFIG = {
  easy: { label: "Easy", timeLimit: 20, points: 10 },
  medium: { label: "Medium", timeLimit: 15, points: 15 },
  hard: { label: "Hard", timeLimit: 12, points: 20 },
};

const DEFAULT_STATE = {
  playerName: "",
  preferredDifficulty: "medium",
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  lastClaimDate: null,
  coins: 0,
  gamesPlayed: 0,
  bestScore: 0,
  totalCorrectAnswers: 0,
  totalQuestionsAnswered: 0,
  rewardHistory: [],
  leaderboard: [],
  activeQuiz: null,
  lastResult: null,
  seenQuestions: { easy: [], medium: [], hard: [] },
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

  const streakMessage = syncDailyActivity();

  bindEvents();
  renderHeader();
  renderHome();

  if (state.lastResult) {
    renderResult();
  }

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
  elements.headerStreakChip = document.getElementById("header-streak-chip");
  elements.headerCoinsChip = document.getElementById("header-coins-chip");
  elements.streakValue = document.getElementById("streak-value");
  elements.streakFoot = document.getElementById("streak-foot");
  elements.bestScoreValue = document.getElementById("best-score-value");
  elements.bestScoreFoot = document.getElementById("best-score-foot");
  elements.coinsValue = document.getElementById("coins-value");
  elements.coinsFoot = document.getElementById("coins-foot");
  elements.gamesValue = document.getElementById("games-value");
  elements.gamesFoot = document.getElementById("games-foot");
  elements.rewardBadge = document.getElementById("reward-badge");
  elements.rewardAmount = document.getElementById("reward-amount");
  elements.rewardCopy = document.getElementById("reward-copy");
  elements.rewardMeta = document.getElementById("reward-meta");
  elements.claimRewardBtn = document.getElementById("claim-reward-btn");
  elements.leaderboardList = document.getElementById("leaderboard-list");
  elements.questionCategory = document.getElementById("question-category");
  elements.questionText = document.getElementById("question-text");
  elements.timerShell = document.getElementById("timer-shell");
  elements.timerValue = document.getElementById("timer-value");
  elements.timerBar = document.getElementById("timer-bar");
  elements.quizScoreChip = document.getElementById("quiz-score-chip");
  elements.quizProgressChip = document.getElementById("quiz-progress-chip");
  elements.quizDifficultyChip = document.getElementById("quiz-difficulty-chip");
  elements.quizProgressBar = document.getElementById("quiz-progress-bar");
  elements.optionsContainer = document.getElementById("options-container");
  elements.feedbackText = document.getElementById("feedback-text");
  elements.pauseQuizBtn = document.getElementById("pause-quiz-btn");
  elements.resultHeading = document.getElementById("result-heading");
  elements.resultSummary = document.getElementById("result-summary");
  elements.resultScore = document.getElementById("result-score");
  elements.resultPerformanceTag = document.getElementById("result-performance-tag");
  elements.resultAccuracy = document.getElementById("result-accuracy");
  elements.resultCorrect = document.getElementById("result-correct");
  elements.resultBonus = document.getElementById("result-bonus");
  elements.resultStreak = document.getElementById("result-streak");
  elements.resultBreakdown = document.getElementById("result-breakdown");
  elements.answerReview = document.getElementById("answer-review");
  elements.playAgainBtn = document.getElementById("play-again-btn");
  elements.resultHomeBtn = document.getElementById("result-home-btn");
  elements.toast = document.getElementById("toast");
}

function bindEvents() {
  elements.playerName.addEventListener("input", handlePlayerNameChange);
  elements.difficultyButtons.forEach((button) => {
    button.addEventListener("click", () => setPreferredDifficulty(button.dataset.difficulty));
  });
  elements.startQuizBtn.addEventListener("click", startNewQuiz);
  elements.resumeQuizBtn.addEventListener("click", resumeQuiz);
  elements.claimRewardBtn.addEventListener("click", claimDailyReward);
  elements.optionsContainer.addEventListener("click", handleOptionSelection);
  elements.pauseQuizBtn.addEventListener("click", pauseQuiz);
  elements.playAgainBtn.addEventListener("click", playAgain);
  elements.resultHomeBtn.addEventListener("click", goHome);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("beforeunload", saveState);
}

function handlePlayerNameChange(event) {
  state.playerName = sanitizeName(event.target.value);
  saveState();
  renderHeader();
}

function handleVisibilityChange() {
  if (document.hidden) {
    clearTimers();
    saveState();
    return;
  }

  if (currentScreenId === "quiz-screen" && state.activeQuiz) {
    renderQuiz();
  }
}

function setPreferredDifficulty(difficulty) {
  if (!DIFFICULTY_CONFIG[difficulty]) {
    return;
  }

  state.preferredDifficulty = difficulty;
  saveState();
  renderHome();
}

function startNewQuiz() {
  const difficulty = state.preferredDifficulty;
  const fullPool = window.QUIZ_QUESTIONS.filter((question) => question.difficulty === difficulty);

  let questionPool = fullPool.filter((q) => !state.seenQuestions[difficulty].includes(q.id));

  if (questionPool.length < QUESTIONS_PER_ROUND) {
    if (fullPool.length < QUESTIONS_PER_ROUND) {
      showToast("Not enough questions found for that difficulty.", "warning");
      return;
    }
    state.seenQuestions[difficulty] = [];
    questionPool = fullPool;
  }

  const selectedQuestions = shuffleArray(questionPool).slice(0, QUESTIONS_PER_ROUND);

  selectedQuestions.forEach(q => state.seenQuestions[difficulty].push(q.id));

  const questions = selectedQuestions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      category: question.category,
      difficulty: question.difficulty,
      answer: question.answer,
      options: shuffleArray(question.options.slice()),
    }));

  state.activeQuiz = {
    difficulty,
    questions,
    currentIndex: 0,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    answers: [],
    startedAt: Date.now(),
    questionStartedAt: Date.now(),
    questionResolved: false,
    selectedOption: null,
    resolutionType: null,
    advanceAfterAt: null,
  };

  saveState();
  ensureAudioContext();
  showScreen("quiz-screen");
  renderQuiz();
}

function resumeQuiz() {
  if (!state.activeQuiz) {
    showToast("There is no saved quiz to resume right now.", "warning");
    return;
  }

  ensureAudioContext();
  showScreen("quiz-screen");
  renderQuiz();
}

function pauseQuiz() {
  if (!state.activeQuiz) {
    return;
  }

  clearTimers();
  saveState();
  showScreen("home-screen");
  renderHome();
  showToast("Quiz paused. You can resume it any time.", "accent");
}

function playAgain() {
  if (state.lastResult && state.lastResult.difficulty) {
    state.preferredDifficulty = state.lastResult.difficulty;
    saveState();
  }

  renderHome();
  startNewQuiz();
}

function goHome() {
  clearTimers();
  showScreen("home-screen");
  renderHome();
}

function handleOptionSelection(event) {
  const button = event.target.closest(".option-btn");

  if (!button || !state.activeQuiz || state.activeQuiz.questionResolved) {
    return;
  }

  resolveQuestion(button.dataset.option, "answered");
}

function resolveQuestion(selectedOption, resolutionType) {
  const quiz = state.activeQuiz;

  if (!quiz || quiz.questionResolved) {
    return;
  }

  clearTimers();

  const currentQuestion = quiz.questions[quiz.currentIndex];
  const isCorrect = selectedOption === currentQuestion.answer;

  if (isCorrect) {
    quiz.score += DIFFICULTY_CONFIG[quiz.difficulty].points;
    quiz.correctCount += 1;
  } else {
    quiz.wrongCount += 1;
  }

  quiz.answers.push({
    prompt: currentQuestion.prompt,
    category: currentQuestion.category,
    selectedOption,
    correctAnswer: currentQuestion.answer,
    isCorrect,
    resolutionType,
  });

  quiz.questionResolved = true;
  quiz.selectedOption = selectedOption;
  quiz.resolutionType = resolutionType;
  quiz.advanceAfterAt = Date.now() + FEEDBACK_DELAY_MS;

  saveState();
  playOutcomeSound(isCorrect, resolutionType);
  renderQuiz();
}

function renderHome() {
  const displayName = getPlayerName();
  const difficulty = DIFFICULTY_CONFIG[state.preferredDifficulty];
  const rewardDetails = getDailyRewardDetails();
  const hasSavedQuiz = Boolean(state.activeQuiz);

  elements.playerName.value = state.playerName;
  elements.streakValue.textContent = `${state.currentStreak} day${state.currentStreak === 1 ? "" : "s"}`;
  elements.streakFoot.textContent =
    state.currentStreak > 0
      ? `Longest streak: ${state.longestStreak} day${state.longestStreak === 1 ? "" : "s"}.`
      : "Show up daily to start your streak.";
  elements.bestScoreValue.textContent = String(state.bestScore);
  elements.bestScoreFoot.textContent =
    state.gamesPlayed > 0 ? `Top score across ${state.gamesPlayed} completed games.` : "Play a round to set a record.";
  elements.coinsValue.textContent = String(state.coins);
  elements.coinsFoot.textContent =
    state.rewardHistory.length > 0 ? `Last reward: ${state.rewardHistory[0].amount} coins.` : "Daily rewards and quiz bonuses stack up.";
  elements.gamesValue.textContent = String(state.gamesPlayed);
  elements.gamesFoot.textContent =
    state.totalQuestionsAnswered > 0
      ? `${state.totalCorrectAnswers} correct answers total.`
      : "Every completed round counts.";
  elements.homeNote.textContent = hasSavedQuiz
    ? `Saved quiz ready: question ${state.activeQuiz.currentIndex + 1} of ${state.activeQuiz.questions.length} on ${
        DIFFICULTY_CONFIG[state.activeQuiz.difficulty].label
      }.`
    : `${displayName}, ${difficulty.label} gives you ${difficulty.timeLimit} seconds per question and ${difficulty.points} points for each correct answer.`;
  elements.rewardAmount.textContent = `${rewardDetails.amount} coins`;
  elements.rewardBadge.textContent = rewardDetails.claimed
    ? "Claimed"
    : rewardDetails.bonus > 0
      ? `${state.currentStreak}-day bonus`
      : "Ready";
  elements.rewardCopy.textContent = rewardDetails.claimed
    ? "Today's reward is already claimed. Come back tomorrow to keep the streak hot."
    : rewardDetails.bonus > 0
      ? `Your current streak unlocks a bonus of ${rewardDetails.bonus} extra coins today.`
      : "Milestone bonuses unlock at 3, 7, and 15 days.";
  elements.rewardMeta.textContent = rewardDetails.claimed
    ? buildRewardMetaText()
    : `${buildRewardMetaText()} One claim is allowed per day.`;
  elements.claimRewardBtn.disabled = rewardDetails.claimed;
  elements.claimRewardBtn.textContent = rewardDetails.claimed ? "Claimed Today" : "Claim Reward";
  elements.resumeQuizBtn.classList.toggle("hidden", !hasSavedQuiz);
  elements.resumeQuizBtn.textContent = hasSavedQuiz
    ? `Resume Quiz (${state.activeQuiz.currentIndex + 1}/${state.activeQuiz.questions.length})`
    : "Resume Quiz";
  elements.difficultyButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.difficulty === state.preferredDifficulty);
  });

  renderLeaderboard();
  renderHeader();
}

function renderQuiz() {
  const quiz = state.activeQuiz;

  if (!quiz) {
    goHome();
    return;
  }

  clearTimers();
  showScreen("quiz-screen");

  const difficulty = DIFFICULTY_CONFIG[quiz.difficulty];
  const currentQuestion = quiz.questions[quiz.currentIndex];
  const completedCount = quiz.currentIndex + (quiz.questionResolved ? 1 : 0);

  elements.questionCategory.textContent = `${currentQuestion.category} • Question ${quiz.currentIndex + 1} of ${
    quiz.questions.length
  }`;
  elements.questionText.textContent = currentQuestion.prompt;
  elements.quizScoreChip.textContent = `Score ${quiz.score}`;
  elements.quizProgressChip.textContent = `Question ${quiz.currentIndex + 1} / ${quiz.questions.length}`;
  elements.quizDifficultyChip.textContent = `${difficulty.label} • ${difficulty.points} pts`;
  elements.quizProgressBar.style.width = `${(completedCount / quiz.questions.length) * 100}%`;
  elements.feedbackText.textContent = "Choose the best answer before the timer runs out.";
  elements.feedbackText.className = "feedback-text";

  renderOptions(currentQuestion, quiz.questionResolved);

  if (quiz.questionResolved) {
    applyResolvedStyles(currentQuestion, quiz);
    scheduleAdvance();
  } else {
    updateTimerDisplay();
    startTimer();
  }

  renderHeader();
}

function renderOptions(question, isResolved) {
  elements.optionsContainer.textContent = "";

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    const badge = document.createElement("span");
    const copy = document.createElement("span");

    button.type = "button";
    button.className = "option-btn";
    button.dataset.option = option;
    button.disabled = isResolved;
    badge.className = "option-badge";
    badge.textContent = String.fromCharCode(65 + index);
    copy.className = "option-copy";
    copy.textContent = option;

    button.appendChild(badge);
    button.appendChild(copy);
    elements.optionsContainer.appendChild(button);
  });
}

function applyResolvedStyles(question, quiz) {
  const lastAnswer = quiz.answers[quiz.answers.length - 1];
  const optionButtons = Array.from(elements.optionsContainer.querySelectorAll(".option-btn"));

  optionButtons.forEach((button) => {
    const option = button.dataset.option;
    button.disabled = true;

    if (option === question.answer) {
      button.classList.add("is-correct");
      return;
    }

    if (quiz.selectedOption && option === quiz.selectedOption) {
      button.classList.add("is-wrong");
      return;
    }

    button.classList.add("is-muted");
  });

  if (!lastAnswer) {
    return;
  }

  if (lastAnswer.isCorrect) {
    elements.feedbackText.textContent = `Correct. +${DIFFICULTY_CONFIG[quiz.difficulty].points} points.`;
    elements.feedbackText.classList.add("is-correct");
    return;
  }

  if (lastAnswer.resolutionType === "timeout") {
    elements.feedbackText.textContent = `Time's up. The correct answer was ${lastAnswer.correctAnswer}.`;
    elements.feedbackText.classList.add("is-timeout");
    return;
  }

  elements.feedbackText.textContent = `Not quite. The correct answer was ${lastAnswer.correctAnswer}.`;
  elements.feedbackText.classList.add("is-wrong");
}

function startTimer() {
  timerIntervalId = window.setInterval(() => {
    if (updateTimerDisplay()) {
      resolveQuestion(null, "timeout");
    }
  }, 200);
}

function updateTimerDisplay() {
  if (!state.activeQuiz) {
    return false;
  }

  const difficulty = DIFFICULTY_CONFIG[state.activeQuiz.difficulty];
  const timeLimitMs = difficulty.timeLimit * 1000;
  const elapsed = Date.now() - state.activeQuiz.questionStartedAt;
  const remainingMs = Math.max(0, timeLimitMs - elapsed);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const fillPercent = Math.max(0, (remainingMs / timeLimitMs) * 100);

  elements.timerValue.textContent = `${remainingSeconds}s`;
  elements.timerBar.style.width = `${fillPercent}%`;
  elements.timerBar.style.background =
    remainingMs <= timeLimitMs / 3
      ? "linear-gradient(90deg, #ff7b73, #ffd977)"
      : "linear-gradient(90deg, #58d5bf, #ffd06b)";
  elements.timerShell.classList.toggle("is-urgent", remainingMs <= timeLimitMs / 3);

  return remainingMs <= 0;
}

function scheduleAdvance() {
  if (!state.activeQuiz || !state.activeQuiz.questionResolved) {
    return;
  }

  const waitTime = Math.max(0, state.activeQuiz.advanceAfterAt - Date.now());
  advanceTimeoutId = window.setTimeout(advanceQuiz, waitTime);
}

function advanceQuiz() {
  const quiz = state.activeQuiz;

  if (!quiz) {
    return;
  }

  clearTimers();
  quiz.currentIndex += 1;

  if (quiz.currentIndex >= quiz.questions.length) {
    finishQuiz();
    return;
  }

  quiz.questionStartedAt = Date.now();
  quiz.questionResolved = false;
  quiz.selectedOption = null;
  quiz.resolutionType = null;
  quiz.advanceAfterAt = null;

  saveState();
  renderQuiz();
}

function finishQuiz() {
  const quiz = state.activeQuiz;

  if (!quiz) {
    return;
  }

  const accuracy = Math.round((quiz.correctCount / quiz.questions.length) * 100);
  const bonusCoins = calculateQuizBonus(quiz.correctCount, quiz.difficulty, accuracy);

  state.gamesPlayed += 1;
  state.coins += bonusCoins;
  state.bestScore = Math.max(state.bestScore, quiz.score);
  state.totalCorrectAnswers += quiz.correctCount;
  state.totalQuestionsAnswered += quiz.questions.length;

  state.lastResult = {
    difficulty: quiz.difficulty,
    score: quiz.score,
    totalQuestions: quiz.questions.length,
    correctCount: quiz.correctCount,
    wrongCount: quiz.wrongCount,
    accuracy,
    bonusCoins,
    streak: state.currentStreak,
    answers: quiz.answers,
    completedAt: Date.now(),
  };

  updateLeaderboard(state.lastResult);
  state.activeQuiz = null;

  saveState();
  renderHeader();
  renderHome();
  renderResult();
  showScreen("result-screen");
  showToast(`Round complete. You earned ${bonusCoins} bonus coins.`, "success");
}

function renderResult() {
  if (!state.lastResult) {
    return;
  }

  const result = state.lastResult;
  const performance = getPerformanceProfile(result.accuracy);

  elements.resultHeading.textContent = performance.heading;
  elements.resultSummary.textContent = `${getPlayerName()}, you answered ${result.correctCount} of ${
    result.totalQuestions
  } questions correctly on ${DIFFICULTY_CONFIG[result.difficulty].label}.`;
  elements.resultScore.textContent = String(result.score);
  elements.resultPerformanceTag.textContent = performance.label;
  elements.resultAccuracy.textContent = `${result.accuracy}%`;
  elements.resultCorrect.textContent = `${result.correctCount} / ${result.totalQuestions}`;
  elements.resultBonus.textContent = `+${result.bonusCoins}`;
  elements.resultStreak.textContent = `${result.streak} day${result.streak === 1 ? "" : "s"}`;

  renderResultBreakdown(result);
  renderAnswerReview(result.answers);
}

function renderResultBreakdown(result) {
  const details = [
    { label: "Difficulty", value: DIFFICULTY_CONFIG[result.difficulty].label },
    { label: "Questions Played", value: String(result.totalQuestions) },
    { label: "Best Score", value: String(state.bestScore) },
    { label: "Total Coins", value: String(state.coins) },
  ];

  elements.resultBreakdown.textContent = "";

  details.forEach((detail) => {
    const row = document.createElement("div");
    const label = document.createElement("span");
    const value = document.createElement("strong");

    row.className = "breakdown-row";
    label.className = "breakdown-label";
    label.textContent = detail.label;
    value.textContent = detail.value;

    row.appendChild(label);
    row.appendChild(value);
    elements.resultBreakdown.appendChild(row);
  });
}

function renderAnswerReview(answers) {
  elements.answerReview.textContent = "";

  answers.forEach((answer, index) => {
    const card = document.createElement("article");
    const header = document.createElement("div");
    const title = document.createElement("p");
    const pill = document.createElement("span");
    const selected = document.createElement("p");
    const correct = document.createElement("p");
    const resolutionClass = answer.isCorrect ? "correct" : answer.resolutionType === "timeout" ? "timeout" : "wrong";

    card.className = "review-card";
    header.className = "review-card-header";
    title.className = "review-title";
    selected.className = "review-answer";
    correct.className = "review-answer";
    pill.className = `review-pill ${resolutionClass}`;
    pill.textContent = answer.isCorrect ? "Correct" : answer.resolutionType === "timeout" ? "Timed Out" : "Wrong";
    title.textContent = `${index + 1}. ${answer.prompt}`;
    selected.textContent = `Your answer: ${answer.selectedOption || "No answer submitted"}`;
    correct.textContent = `Correct answer: ${answer.correctAnswer}`;

    header.appendChild(title);
    header.appendChild(pill);
    card.appendChild(header);
    card.appendChild(selected);
    card.appendChild(correct);
    elements.answerReview.appendChild(card);
  });
}

function claimDailyReward() {
  const today = getDateKey();

  if (state.lastClaimDate === today) {
    showToast("You already claimed today's reward.", "warning");
    return;
  }

  const rewardDetails = getDailyRewardDetails();

  state.lastClaimDate = today;
  state.coins += rewardDetails.amount;
  state.rewardHistory.unshift({
    date: today,
    amount: rewardDetails.amount,
    bonus: rewardDetails.bonus,
  });
  state.rewardHistory = state.rewardHistory.slice(0, 12);

  saveState();
  renderHeader();
  renderHome();

  showToast(
    rewardDetails.bonus > 0
      ? `Reward claimed: ${rewardDetails.amount} coins including a streak bonus.`
      : `Reward claimed: ${rewardDetails.amount} coins added to your wallet.`,
    "success"
  );
}

function renderLeaderboard() {
  elements.leaderboardList.textContent = "";

  if (!state.leaderboard.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Finish a quiz to seed the leaderboard.";
    elements.leaderboardList.appendChild(empty);
    return;
  }

  state.leaderboard.forEach((entry, index) => {
    const row = document.createElement("div");
    const rank = document.createElement("span");
    const info = document.createElement("div");
    const name = document.createElement("span");
    const meta = document.createElement("span");
    const score = document.createElement("span");

    row.className = "leaderboard-row";
    rank.className = "leaderboard-rank";
    info.className = "leaderboard-info";
    name.className = "leaderboard-name";
    meta.className = "leaderboard-meta";
    score.className = "leaderboard-score";
    rank.textContent = `#${index + 1}`;
    name.textContent = entry.name;
    meta.textContent = `${entry.difficulty} • ${entry.accuracy}% • ${formatDateLabel(entry.date)}`;
    score.textContent = `${entry.score} pts`;

    info.appendChild(name);
    info.appendChild(meta);
    row.appendChild(rank);
    row.appendChild(info);
    row.appendChild(score);
    elements.leaderboardList.appendChild(row);
  });
}

function renderHeader() {
  elements.headerStreakChip.textContent = `Streak ${state.currentStreak}`;
  elements.headerCoinsChip.textContent = `Coins ${state.coins}`;
}

function showScreen(screenId) {
  currentScreenId = screenId;

  elements.screens.forEach((screen) => {
    const isActive = screen.id === screenId;
    screen.hidden = !isActive;
    screen.classList.toggle("is-visible", isActive);
  });
}

function showToast(message, tone = "accent") {
  clearTimeout(toastTimeoutId);
  elements.toast.textContent = message;
  elements.toast.className = `toast ${tone} is-visible`;

  toastTimeoutId = window.setTimeout(() => {
    elements.toast.className = "toast";
  }, 2800);
}

function syncDailyActivity() {
  const today = getDateKey();

  if (!state.lastActiveDate) {
    state.currentStreak = 1;
    state.longestStreak = 1;
    state.lastActiveDate = today;
    saveState();
    return "Your first daily streak has started.";
  }

  if (state.lastActiveDate === today) {
    return "";
  }

  const daysSinceLastVisit = getDayDifference(state.lastActiveDate, today);

  if (daysSinceLastVisit === 1) {
    state.currentStreak += 1;
    state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
    state.lastActiveDate = today;
    saveState();
    return `Streak extended to ${state.currentStreak} day${state.currentStreak === 1 ? "" : "s"}.`;
  }

  state.currentStreak = 1;
  state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
  state.lastActiveDate = today;
  saveState();
  return "A missed day reset the streak, but a fresh run starts today.";
}

function getDailyRewardDetails() {
  const today = getDateKey();
  const bonus = STREAK_BONUSES[state.currentStreak] || 0;

  return {
    amount: DAILY_REWARD_BASE + bonus,
    bonus,
    claimed: state.lastClaimDate === today,
  };
}

function buildRewardMetaText() {
  const milestones = [3, 7, 15];
  const nextMilestone = milestones.find((milestone) => milestone > state.currentStreak);

  if (!nextMilestone) {
    return "You have unlocked every listed milestone. Keep the streak alive.";
  }

  const daysRemaining = nextMilestone - state.currentStreak;
  return `${daysRemaining} more day${daysRemaining === 1 ? "" : "s"} until the ${nextMilestone}-day bonus.`;
}

function updateLeaderboard(result) {
  const entry = {
    name: getPlayerName(),
    difficulty: DIFFICULTY_CONFIG[result.difficulty].label,
    score: result.score,
    accuracy: result.accuracy,
    date: getDateKey(),
    timestamp: Date.now(),
  };

  state.leaderboard = [entry, ...state.leaderboard]
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.accuracy !== left.accuracy) {
        return right.accuracy - left.accuracy;
      }

      return (right.timestamp || 0) - (left.timestamp || 0);
    })
    .slice(0, MAX_LEADERBOARD_ENTRIES);
}

function calculateQuizBonus(correctCount, difficulty, accuracy) {
  const multiplier = {
    easy: 2,
    medium: 3,
    hard: 4,
  }[difficulty];

  let bonus = correctCount * multiplier;

  if (accuracy === 100) {
    bonus += 20;
  } else if (accuracy >= 80) {
    bonus += 12;
  } else if (accuracy >= 60) {
    bonus += 6;
  }

  return bonus;
}

function getPerformanceProfile(accuracy) {
  if (accuracy === 100) {
    return {
      heading: "Perfect streak.",
      label: "Flawless",
    };
  }

  if (accuracy >= 80) {
    return {
      heading: "Strong finish.",
      label: "Elite",
    };
  }

  if (accuracy >= 60) {
    return {
      heading: "Solid run.",
      label: "Sharp",
    };
  }

  return {
    heading: "Good warm-up.",
    label: "Building",
  };
}

function ensureAudioContext() {
  if (audioContext) {
    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
    return;
  }

  const ContextClass = window.AudioContext || window.webkitAudioContext;

  if (!ContextClass) {
    return;
  }

  audioContext = new ContextClass();
}

function playOutcomeSound(isCorrect, resolutionType) {
  ensureAudioContext();

  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;

  if (isCorrect) {
    playTone(620, now, 0.12, "sine", 0.08);
    playTone(830, now + 0.1, 0.16, "triangle", 0.06);
    return;
  }

  if (resolutionType === "timeout") {
    playTone(250, now, 0.14, "triangle", 0.08);
    playTone(180, now + 0.1, 0.18, "triangle", 0.06);
    return;
  }

  playTone(210, now, 0.16, "sawtooth", 0.08);
  playTone(150, now + 0.12, 0.18, "sawtooth", 0.06);
}

function playTone(frequency, startTime, duration, type, volume) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

function clearTimers() {
  window.clearInterval(timerIntervalId);
  window.clearTimeout(advanceTimeoutId);
  timerIntervalId = null;
  advanceTimeoutId = null;
}

function loadState() {
  let storedState = null;

  try {
    storedState = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    storedState = null;
  }

  const mergedState = {
    ...DEFAULT_STATE,
    ...(storedState || {}),
    rewardHistory: Array.isArray(storedState?.rewardHistory) ? storedState.rewardHistory : [],
    leaderboard: Array.isArray(storedState?.leaderboard) ? storedState.leaderboard : [],
    activeQuiz: sanitizeActiveQuiz(storedState?.activeQuiz),
    lastResult: sanitizeLastResult(storedState?.lastResult),
    seenQuestions: {
      easy: Array.isArray(storedState?.seenQuestions?.easy) ? storedState.seenQuestions.easy : [],
      medium: Array.isArray(storedState?.seenQuestions?.medium) ? storedState.seenQuestions.medium : [],
      hard: Array.isArray(storedState?.seenQuestions?.hard) ? storedState.seenQuestions.hard : [],
    },
  };

  if (!DIFFICULTY_CONFIG[mergedState.preferredDifficulty]) {
    mergedState.preferredDifficulty = DEFAULT_STATE.preferredDifficulty;
  }

  return mergedState;
}

function saveState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    return;
  }
}

function sanitizeActiveQuiz(activeQuiz) {
  if (!activeQuiz || !Array.isArray(activeQuiz.questions) || activeQuiz.questions.length === 0) {
    return null;
  }

  const difficulty = DIFFICULTY_CONFIG[activeQuiz.difficulty] ? activeQuiz.difficulty : "medium";
  const questions = activeQuiz.questions
    .filter((question) => {
      return (
        question &&
        typeof question.prompt === "string" &&
        typeof question.answer === "string" &&
        Array.isArray(question.options) &&
        question.options.length === 4
      );
    })
    .map((question) => ({
      id: question.id || `${difficulty}-stored-question`,
      prompt: question.prompt,
      category: question.category || "Quiz",
      difficulty,
      answer: question.answer,
      options: question.options.slice(0, 4),
    }));

  if (!questions.length) {
    return null;
  }

  const safeIndex = Math.min(Math.max(Number(activeQuiz.currentIndex) || 0, 0), questions.length - 1);

  return {
    difficulty,
    questions,
    currentIndex: safeIndex,
    score: Number(activeQuiz.score) || 0,
    correctCount: Number(activeQuiz.correctCount) || 0,
    wrongCount: Number(activeQuiz.wrongCount) || 0,
    answers: Array.isArray(activeQuiz.answers) ? activeQuiz.answers : [],
    startedAt: Number(activeQuiz.startedAt) || Date.now(),
    questionStartedAt: Number(activeQuiz.questionStartedAt) || Date.now(),
    questionResolved: Boolean(activeQuiz.questionResolved),
    selectedOption: typeof activeQuiz.selectedOption === "string" ? activeQuiz.selectedOption : null,
    resolutionType: typeof activeQuiz.resolutionType === "string" ? activeQuiz.resolutionType : null,
    advanceAfterAt: Number(activeQuiz.advanceAfterAt) || null,
  };
}

function sanitizeLastResult(lastResult) {
  if (!lastResult || typeof lastResult !== "object" || !DIFFICULTY_CONFIG[lastResult.difficulty]) {
    return null;
  }

  return {
    difficulty: lastResult.difficulty,
    score: Number(lastResult.score) || 0,
    totalQuestions: Number(lastResult.totalQuestions) || 0,
    correctCount: Number(lastResult.correctCount) || 0,
    wrongCount: Number(lastResult.wrongCount) || 0,
    accuracy: Number(lastResult.accuracy) || 0,
    bonusCoins: Number(lastResult.bonusCoins) || 0,
    streak: Number(lastResult.streak) || 0,
    answers: Array.isArray(lastResult.answers) ? lastResult.answers : [],
    completedAt: Number(lastResult.completedAt) || Date.now(),
  };
}

function sanitizeName(value) {
  return value.replace(/\s+/g, " ").slice(0, 24);
}

function getPlayerName() {
  return state.playerName.trim() || "Player One";
}

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayDifference(fromDateKey, toDateKey) {
  const from = createSafeDate(fromDateKey);
  const to = createSafeDate(toDateKey);
  return Math.round((to - from) / 86400000);
}

function createSafeDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatDateLabel(dateKey) {
  if (!dateKey) {
    return "Today";
  }

  return createSafeDate(dateKey).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function shuffleArray(items) {
  const copy = items.slice();

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}
