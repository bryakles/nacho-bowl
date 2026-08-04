// ============================================================
// CONFIGURATION
// ============================================================
const CARDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQwlCOUR8nLtmiCUgissCCNAnnpn5hbMM1dLjEKHO0OohmbdvbTldfI__y3TGA39DPb-ZYeVPHCD_Fb/pub?output=csv";
const ACCOUNTS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQOW8Q53UWa4lEsH1Sk9P_8KmWatSJCqjoCVpTA_uJ-XHH0HGsNzAaqyeuL-sBCNatAC4uAMhhlB6o3/pub?output=csv";
const BORED_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJaLVNNtFXTgvxl_BVwGz4efup2RNkgyjdOBcW_DNS7Erg9slS40p8u95XN2p5j0M3iIDoPCswGQMv/pub?output=csv";
const HISTORY_STORAGE_KEY = "spanish-practice-history-v1";
const NACHO_STORAGE_KEY   = "nacho-bowl-count-v1";
let maxCardsPerSession = 25;

// ============================================================
// NACHO TIERS
// ============================================================
const NACHO_TIERS = [
  { min: 100, icon: "🌮", title: "Nacho Legend", messages: [
    "Every chip landed perfectly. Legendary work!",
    "The kitchen is speechless. Absolute perfection.",
    "This bowl belongs on the menu.",
    "Not a single topping out of place. Incredible!",
    "You just served a five-star nacho masterpiece.",
  ]},
  { min: 90, icon: "👑", title: "Supreme Chef", messages: [
    "That bowl is almost legendary. One more chip!",
    "Chef's special! That was a fantastic round.",
    "Only the pickiest food critic could find a flaw.",
    "You loaded that plate like a pro.",
    "Supreme status achieved. Nicely done!",
  ]},
  { min: 80, icon: "🧀", title: "Queso Master", messages: [
    "The cheese is flowing! Great work.",
    "That's a bowl worth sharing.",
    "Your nachos are looking delicious. Keep stacking!",
    "Another handful of chips and you'll be Supreme.",
    "You're building something tasty. Keep going!",
  ]},
  { min: 70, icon: "🥑", title: "Guac Guru", messages: [
    "Fresh guacamole added! Nice progress.",
    "Your bowl is coming together nicely.",
    "Every round adds another layer.",
    "A few more toppings and this feast gets serious.",
    "Solid work—keep the chips coming!",
  ]},
  { min: 60, icon: "🌽", title: "Chip Stacker", messages: [
    "Every legendary bowl starts with a single chip.",
    "You've got the foundation. Time to add toppings!",
    "Keep stacking—you'll be surprised how fast it grows.",
    "Good start! The next round is calling.",
    "One more game could change this whole plate.",
  ]},
  { min: 0, icon: "🍽️", title: "Prep Cook", messages: [
    "Every chef starts in the kitchen. Let's cook another batch!",
    "Don't worry—the chips are warm and ready for another try.",
    "Practice is today's secret ingredient.",
    "The recipe isn't finished yet. Give it another shot!",
    "Every legendary nacho bowl begins with the first chip.",
  ]},
];

function getTier(pct) {
  return NACHO_TIERS.find(t => pct >= t.min);
}

function randomMessage(tier) {
  return tier.messages[Math.floor(Math.random() * tier.messages.length)];
}

// ============================================================
// STATE
// ============================================================
let allCards = [];       // All cards loaded from Google Sheet
let allAccounts = [];    // All accounts loaded from Google Sheet
let boredCards = [];     // Bored button emoji cards
let currentUser = null;  // Logged-in student { name, username, password }

let selectedLevels = new Set();
let selectedUnits = new Set();
let selectedSets = new Set();

let practiceCards = [];         // Cards for current session (up to 25)
let currentCardIndex = -1;
let attemptedIndices = new Set();
let correctCount = 0;
let incorrectCount = 0;
let hintedCorrectCount = 0;
let currentCardState = "fresh"; // "fresh" | "hint_shown" | "done"
let currentCardFirstWrongAnswer = ""; // student's first wrong answer for tracking
let currentCardPromptWord = "";  // the prompt word shown on the current card
let wrongAnswers = [];          // [{ prompt, studentAnswer }] for history
let practiceMode = "spanish-english";
let sessionModeLabel = "Spanish→English"; // Locked at start of session
let practiceActive = false;
let lastFilterSettings = null;  // For "practice again" button

// ============================================================
// DOM REFERENCES
// ============================================================
const loginScreen      = document.getElementById("loginScreen");
const practiceScreen   = document.getElementById("practiceScreen");
const loginForm        = document.getElementById("loginForm");
const usernameInput    = document.getElementById("usernameInput");
const passwordInput    = document.getElementById("passwordInput");
const loginError       = document.getElementById("loginError");
const loadingMsg       = document.getElementById("loadingMsg");
const welcomeName      = document.getElementById("welcomeName");
const signOutBtn       = document.getElementById("signOutBtn");

const filterPanel      = document.getElementById("filterPanel");
const practicePanel    = document.getElementById("practicePanel");
const resultsPanel     = document.getElementById("resultsPanel");

const levelOptions     = document.getElementById("levelOptions");
const unitOptions      = document.getElementById("unitOptions");
const setOptions       = document.getElementById("setOptions");
const cardCountPreview = document.getElementById("cardCountPreview");
const startPracticeBtn = document.getElementById("startPracticeBtn");

const practiceSetLabel = document.getElementById("practiceSetLabel");
const practiceProgress = document.getElementById("practiceProgress");
const endPracticeBtn   = document.getElementById("endPracticeBtn");
const promptText       = document.getElementById("promptText");
const responseDisplay  = document.getElementById("responseDisplay");
const responseIcon     = document.getElementById("responseIcon");
const responseText     = document.getElementById("responseText");
const correctAnswerDisplay = document.getElementById("correctAnswerDisplay");
const directionLabel   = document.getElementById("directionLabel");
const answerInput      = document.getElementById("answerInput");
const checkBtn         = document.getElementById("checkBtn");
const feedbackText     = document.getElementById("feedbackText");
const hintText         = document.getElementById("hintText");
const nextBtn          = document.getElementById("nextBtn");
const modeSelect       = document.getElementById("modeSelect");
const cardCountSelect  = document.getElementById("cardCountSelect");

const statCorrect      = document.getElementById("statCorrect");
const statHinted       = document.getElementById("statHinted");
const statIncorrect    = document.getElementById("statIncorrect");
const statTotal        = document.getElementById("statTotal");

const resultsSummary   = document.getElementById("resultsSummary");
const celebrationIcon  = document.getElementById("celebrationIcon");
const celebrationTitle = document.getElementById("celebrationTitle");
const celebrationMsg   = document.getElementById("celebrationMessage");
const nachoCountDisplay = document.getElementById("nachoCountDisplay");
const footerNachoName  = document.getElementById("footerNachoName");
const footerNachoCount = document.getElementById("footerNachoCount");

const boredBtn = document.getElementById("boredBtn");
const boredDisplay = document.getElementById("boredDisplay");

const practiceAgainBtn = document.getElementById("practiceAgainBtn");
const newPracticeBtn   = document.getElementById("newPracticeBtn");

const confirmDialog    = document.getElementById("confirmDialog");
const confirmMsg       = document.getElementById("confirmMsg");
const confirmEndBtn    = document.getElementById("confirmEndBtn");
const cancelEndBtn     = document.getElementById("cancelEndBtn");

const attemptHistoryList = document.getElementById("attemptHistoryList");
const historyToggle = document.getElementById("historyToggle");
const historyContent = document.getElementById("historyContent");

// ============================================================
// CSV PARSING
// ============================================================
function parseCSV(text) {
  const lines = text.trim().split("\n").map(l => l.trim()).filter(l => l);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    // Handle commas inside quoted fields
    const cols = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { cols.push(current.trim()); current = ""; }
      else { current += ch; }
    }
    cols.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cols[i] || ""; });
    return obj;
  });
}

function parseCards(csvText) {
  const rows = parseCSV(csvText);
  return rows
    .filter(r => r.spanish && r.english)
    .map(r => ({
      spanish:  r.spanish,
      english:  r.english,
      setName:  r["card set"] || "",
      level:    r.level || "",
      unit:     r.unit || "",
    }));
}

function parseAccounts(csvText) {
  const rows = parseCSV(csvText);
  return rows
    .filter(r => r.username && r.password)
    .map(r => ({
      name:     r["student name"] || r.name || r.username,
      username: r.username.trim().toLowerCase(),
      password: r.password.trim(),
    }));
}

function parseBoredCards(csvText) {
  const rows = parseCSV(csvText);

  return rows
    .filter(r => r.emoji && r.content)
    .map(r => ({
      emoji: r.emoji,
      content: r.content,
      category: r.category || "",
      weight: Number(r.weight) || 1,
    }));
}

// ============================================================
// DATA LOADING
// ============================================================
const CARDS_CACHE_KEY    = "spanish-cards-cache-v1";
const ACCOUNTS_CACHE_KEY = "spanish-accounts-cache-v1";
const BORED_CACHE_KEY = "spanish-bored-cache-v1";

async function loadData() {
  loadingMsg.classList.remove("hidden");

  // Try loading from network first, fall back to cache
  let cardsText    = null;
  let accountsText = null;
  let boredText    = null;

  try {
    const [cardsRes, accountsRes, boredRes] = await Promise.all([
      fetch(CARDS_CSV_URL),
      fetch(ACCOUNTS_CSV_URL),
      fetch(BORED_CSV_URL),
    ]);

    [cardsText, accountsText, boredText] = await Promise.all([
      cardsRes.text(),
      accountsRes.text(),
      boredRes.text(),
    ]);
    
    // Save fresh data to cache
    localStorage.setItem(CARDS_CACHE_KEY, cardsText);
    localStorage.setItem(ACCOUNTS_CACHE_KEY, accountsText);
    localStorage.setItem(BORED_CACHE_KEY, boredText);
  } catch (err) {
    // Network failed — try cache
    cardsText    = localStorage.getItem(CARDS_CACHE_KEY);
    accountsText = localStorage.getItem(ACCOUNTS_CACHE_KEY);
    boredText    = localStorage.getItem(BORED_CACHE_KEY);
    
    if (cardsText && accountsText) {
      loadingMsg.textContent = "⚠️ Offline — using last saved data.";
    } else {
      loadingMsg.textContent = "Could not load data. Check your internet connection.";
      return;
    }
  }

  allCards    = parseCards(cardsText);
  allAccounts = parseAccounts(accountsText);
  boredCards  = parseBoredCards(boredText);
  if (!loadingMsg.textContent.startsWith("⚠️")) {
    loadingMsg.textContent = "";
  }
}

function getRandomBoredCard() {
  if (!boredCards.length) return null;

  const totalWeight = boredCards.reduce((sum, card) => {
    return sum + card.weight;
  }, 0);

  let random = Math.random() * totalWeight;

  for (const card of boredCards) {
    random -= card.weight;

    if (random <= 0) {
      return card;
    }
  }

  return boredCards[0];
}

// ============================================================
// AUTH
// ============================================================
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim().toLowerCase();
  const password = passwordInput.value.trim();
  const user = allAccounts.find(a => a.username === username && a.password === password);
  if (!user) {
    loginError.textContent = "Username or password not found.";
    loginError.classList.remove("hidden");
    return;
  }
  loginError.classList.add("hidden");
  currentUser = user;
  showPracticeScreen();
});

signOutBtn.addEventListener("click", () => {
  currentUser = null;
  usernameInput.value = "";
  passwordInput.value = "";
  practiceScreen.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  resetPracticeState();
});

boredBtn.addEventListener("click", () => {
  const card = getRandomBoredCard();

  if (!card) return;

  boredDisplay.textContent = `${card.emoji} ${card.content}`;
});

// ============================================================
// SCREEN TRANSITIONS
// ============================================================
function showPracticeScreen() {
  loginScreen.classList.add("hidden");
  practiceScreen.classList.remove("hidden");
  welcomeName.textContent = currentUser.name;
  showFilterPanel();
  renderAttemptHistory();
  updateFooterNachos();
}

function showFilterPanel() {
  filterPanel.classList.remove("hidden");
  practicePanel.classList.add("hidden");
  resultsPanel.classList.add("hidden");
  renderLevelChips();
  updateCardCountPreview();
}

// ============================================================
// FILTER CHIPS
// ============================================================
function renderLevelChips() {
  const levels = [...new Set(allCards.map(c => c.level).filter(Boolean))].sort();
  levelOptions.innerHTML = "";
  levels.forEach(level => {
    const chip = makeChip(level, selectedLevels, () => {
      toggleSelection(selectedLevels, level);
      // Reset lower selections when levels change
      selectedUnits.clear();
      selectedSets.clear();
      renderUnitChips();
      renderSetChips();
      updateCardCountPreview();
    });
    levelOptions.appendChild(chip);
  });
}

function renderUnitChips() {
  unitOptions.innerHTML = "";
  const filtered = selectedLevels.size
    ? allCards.filter(c => selectedLevels.has(c.level))
    : allCards;
  const units = [...new Set(filtered.map(c => c.unit).filter(Boolean))].sort();

  if (!units.length) {
    unitOptions.innerHTML = '<span class="filter-hint">Select a level first</span>';
    return;
  }

  units.forEach(unit => {
    const chip = makeChip(unit, selectedUnits, () => {
      toggleSelection(selectedUnits, unit);
      // Reset set selections when units change
      selectedSets.clear();
      renderSetChips();
      updateCardCountPreview();
    });
    unitOptions.appendChild(chip);
  });
}

function renderSetChips() {
  setOptions.innerHTML = "";
  let filtered = allCards;
  if (selectedLevels.size) filtered = filtered.filter(c => selectedLevels.has(c.level));
  if (selectedUnits.size) filtered = filtered.filter(c => selectedUnits.has(c.unit));
  const sets = [...new Set(filtered.map(c => c.setName).filter(Boolean))].sort();

  if (!sets.length) {
    setOptions.innerHTML = '<span class="filter-hint">Select a unit first</span>';
    return;
  }

  sets.forEach(set => {
    const chip = makeChip(set, selectedSets, () => {
      toggleSelection(selectedSets, set);
      updateCardCountPreview();
    });
    setOptions.appendChild(chip);
  });
}

function makeChip(label, selectionSet, onClick) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "chip" + (selectionSet.has(label) ? " active" : "");
  chip.textContent = label;
  chip.addEventListener("click", () => {
    onClick();
    chip.classList.toggle("active", selectionSet.has(label));
  });
  return chip;
}

function toggleSelection(set, value) {
  if (set.has(value)) set.delete(value);
  else set.add(value);
}

function getFilteredCards() {
  let cards = allCards;
  if (selectedLevels.size) cards = cards.filter(c => selectedLevels.has(c.level));
  if (selectedUnits.size) cards = cards.filter(c => selectedUnits.has(c.unit));
  if (selectedSets.size) cards = cards.filter(c => selectedSets.has(c.setName));
  return cards;
}

function updateCardCountPreview() {
  const count = getFilteredCards().length;
  if (count === 0) {
    cardCountPreview.textContent = "No cards match your selection";
    cardCountPreview.className = "card-count-preview";
    startPracticeBtn.disabled = true;
  } else {
    const shown = Math.min(count, maxCardsPerSession);
    cardCountPreview.textContent = `${count} card${count !== 1 ? "s" : ""} available — ${shown} will be selected randomly`;
    cardCountPreview.className = "card-count-preview has-cards";
    startPracticeBtn.disabled = false;
  }
}

startPracticeBtn.addEventListener("click", () => {
  const filtered = getFilteredCards();
  if (!filtered.length) return;
  lastFilterSettings = {
    levels: new Set(selectedLevels),
    units: new Set(selectedUnits),
    sets: new Set(selectedSets),
  };
  beginPractice(filtered);
});

// ============================================================
// PRACTICE SESSION
// ============================================================
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function beginPractice(filtered) {
  maxCardsPerSession = Number(cardCountSelect.value);
  
  practiceCards = shuffleArray(filtered).slice(0, maxCardsPerSession);
  resetPracticeState();
  practiceActive = true;

  // Lock mode for this session
  practiceMode = modeSelect.value;
  const modeLabels = {
    "spanish-english": "Spanish→English",
    "english-spanish": "English→Spanish",
    "mixed": "Mixed",
  };
  sessionModeLabel = modeLabels[practiceMode] || practiceMode;

  filterPanel.classList.add("hidden");
  practicePanel.classList.remove("hidden");
  resultsPanel.classList.add("hidden");

  const setNames = [...new Set(practiceCards.map(c => c.setName))].join(", ");
  practiceSetLabel.textContent = setNames;
  practiceMode = modeSelect.value;

  updateStats();
  showNextCard();
}

function resetPracticeState() {
  currentCardIndex = -1;
  attemptedIndices = new Set();
  correctCount = 0;
  incorrectCount = 0;
  hintedCorrectCount = 0;
  currentCardState = "fresh";
  currentCardFirstWrongAnswer = "";
  wrongAnswers = [];
  practiceActive = false;
}

function showNextCard() {
  if (attemptedIndices.size >= practiceCards.length) {
    endPractice(false);
    return;
  }

  // Find an unattempted card index
  let next;
  const remaining = practiceCards.map((_, i) => i).filter(i => !attemptedIndices.has(i));
  next = remaining[Math.floor(Math.random() * remaining.length)];
  currentCardIndex = next;
  currentCardState = "fresh";
  currentCardFirstWrongAnswer = "";
  currentCardPromptWord = "";

  const card = practiceCards[currentCardIndex];
  const mode = practiceMode === "mixed"
    ? (Math.random() < 0.5 ? "spanish-english" : "english-spanish")
    : practiceMode;

  if (mode === "spanish-english") {
    currentCardPromptWord = card.spanish;
    promptText.textContent = card.spanish;
    directionLabel.textContent = "Spanish → English";
    answerInput.placeholder = "Type the English meaning...";
  } else {
    currentCardPromptWord = card.english;
    promptText.textContent = card.english;
    directionLabel.textContent = "English → Spanish";
    answerInput.placeholder = "Type the Spanish word...";
  }

  // Store the expected answer on the card temporarily
  card._mode = mode;

  answerInput.value = "";
  feedbackText.textContent = "";
  feedbackText.className = "feedback-text";
  hintText.textContent = "";
  directionLabel.style.color = "";
  responseDisplay.className = "response-display hidden";
  responseIcon.textContent = "";
  responseText.textContent = "";
  correctAnswerDisplay.textContent = "";
  correctAnswerDisplay.className = "correct-answer-display hidden";
  answerInput.disabled = false;
  checkBtn.disabled = false;
  answerInput.focus();

  const remaining2 = practiceCards.length - attemptedIndices.size;
  practiceProgress.textContent = `${attemptedIndices.size} done · ${remaining2} remaining`;
  updateStats();
}

function getExpectedAnswer(card) {
  const mode = card._mode || "spanish-english";
  return mode === "spanish-english" ? card.english : card.spanish;
}

function normalizeAnswer(str) {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFC")              // consistent accent representation
    .replace(/[.,!?;:¡¿]/g, "")  // strip punctuation only
    .replace(/\s+/g, " ");
}

function stripAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getAcceptedAnswers(answerString) {
  // Remove teacher notes in parentheses
  const withoutNotes = answerString.replace(/\([^)]*\)/g, "");

  // Split alternatives inside brackets
  return withoutNotes
    .replace("[", "|")
    .replace("]", "")
    .split("|")
    .map(a => normalizeAnswer(a))
    .filter(Boolean);
}

function checkAnswer() {
  if (currentCardIndex < 0 || currentCardState === "done") return;

  const card = practiceCards[currentCardIndex];
  const expectedAnswers = getAcceptedAnswers(getExpectedAnswer(card));
  const student = answerInput.value;

  if (!student.trim()) return;

  const isCorrect = expectedAnswers.includes(normalizeAnswer(student));

  if (currentCardState === "fresh") {
    if (isCorrect) {
      // First attempt correct
      correctCount++;
      currentCardState = "done";
      attemptedIndices.add(currentCardIndex);
      answerInput.disabled = true;
      checkBtn.disabled = true;
      responseIcon.textContent = "✓";
      responseText.textContent = student;
      responseDisplay.className = "response-display correct";
      directionLabel.textContent = "Press Enter for the next card.";
      feedbackText.textContent = "";
      hintText.textContent = "";
    } else {
      // First attempt wrong — give hint, allow retry
      currentCardState = "hint_shown";
      currentCardFirstWrongAnswer = student;
      feedbackText.textContent = "✗ Not quite — try again!";
      feedbackText.className = "feedback-text incorrect";
      hintText.textContent = getHint(student, expectedAnswers[0]);
      answerInput.value = "";
      answerInput.focus();
    }
  } else if (currentCardState === "hint_shown") {
    // Second attempt
    if (isCorrect) {
      hintedCorrectCount++;
      currentCardState = "done";
      attemptedIndices.add(currentCardIndex);
      answerInput.disabled = true;
      checkBtn.disabled = true;
      responseIcon.textContent = "✓";
      responseText.textContent = student;
      responseDisplay.className = "response-display hinted";
      directionLabel.textContent = "Press Enter for the next card.";
      feedbackText.textContent = "";
      hintText.textContent = "";
    } else {
      // Second attempt wrong — mark incorrect, record wrong answer
      incorrectCount++;
      currentCardState = "done";
      attemptedIndices.add(currentCardIndex);
      answerInput.disabled = true;
      checkBtn.disabled = true;
      wrongAnswers.push({ prompt: currentCardPromptWord, studentAnswer: currentCardFirstWrongAnswer });
      responseIcon.textContent = "✗";
      responseText.textContent = currentCardFirstWrongAnswer;
      responseDisplay.className = "response-display incorrect";
      correctAnswerDisplay.textContent = expectedAnswers.join(" / ");
      correctAnswerDisplay.className = "correct-answer-display";
      directionLabel.textContent = "Press Enter for the next card.";
      feedbackText.textContent = "";
      hintText.textContent = "";
    }
  }

  updateStats();
}

function showAnswer() {
  // Show Answer removed — students must answer themselves
}

function getHint(student, correct) {
  const sNorm = normalizeAnswer(student);  // accents preserved
  const cNorm = normalizeAnswer(correct);
  const sBase = stripAccents(sNorm);       // accents removed
  const cBase = stripAccents(cNorm);

  // If base forms match but accented forms don't — purely an accent issue
  if (sBase === cBase && sNorm !== cNorm) {
    const sHasAccent = /[áéíóúüñ]/i.test(sNorm);
    const cHasAccent = /[áéíóúüñ]/i.test(cNorm);
    if (cHasAccent && !sHasAccent) return "Hint: add accent";
    if (!cHasAccent && sHasAccent) return "Hint: remove accent";
    return "Hint: fix accent";
  }

  // Space check (use base forms to avoid accent interference)
  if (sBase.includes(" ") && !cBase.includes(" ")) return "Hint: remove space";
  if (!sBase.includes(" ") && cBase.includes(" ")) return "Hint: add space";

  // Length check
  if (sBase.length > cBase.length) return "Hint: remove a letter";
  if (sBase.length < cBase.length) return "Hint: add a letter";

  // Same length — count differing characters
  let diffs = 0;
  for (let i = 0; i < sBase.length; i++) {
    if (sBase[i] !== cBase[i]) diffs++;
  }
  if (diffs <= 2) return "Hint: fix minor spelling";

  return "Hint: try again";
}

function updateStats() {
  statCorrect.textContent = correctCount;
  statHinted.textContent = hintedCorrectCount;
  statIncorrect.textContent = incorrectCount;
  statTotal.textContent = practiceCards.length;
  const remaining = practiceCards.length - attemptedIndices.size;
  practiceProgress.textContent = `${attemptedIndices.size} done · ${remaining} remaining`;
}

// Auto-convert capital letters to accented characters
const ACCENT_MAP = { 'A': 'á', 'E': 'é', 'I': 'í', 'O': 'ó', 'U': 'ú', 'N': 'ñ', 'Y': 'ü' };
answerInput.addEventListener("input", () => {
  const pos = answerInput.selectionStart;
  const original = answerInput.value;
  const converted = original.replace(/[AEIOUNY]/g, ch => ACCENT_MAP[ch]);
  if (converted !== original) {
    answerInput.value = converted;
    answerInput.setSelectionRange(pos, pos);
  }
});

modeSelect.addEventListener("change", () => { practiceMode = modeSelect.value; });
checkBtn.addEventListener("click", checkAnswer);
nextBtn.addEventListener("click", advanceCard);
answerInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    e.stopPropagation(); // Prevent the document listener from also firing on this same keypress
    if (currentCardState === "done") advanceCard();
    else checkAnswer();
  }
});
// Also listen on document so Enter works even when input is disabled
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && currentCardState === "done" && practiceActive) {
    e.preventDefault();
    advanceCard();
  }
});

function advanceCard() {
  if (currentCardIndex >= 0 && currentCardState !== "done") {
    // Card skipped via Next button — mark as attempted (unanswered)
    attemptedIndices.add(currentCardIndex);
  }
  showNextCard();
}

// ============================================================
// END PRACTICE
// ============================================================
endPracticeBtn.addEventListener("click", () => {
  const unanswered = practiceCards.length - attemptedIndices.size;
  confirmMsg.textContent = unanswered > 0
    ? `You have ${unanswered} unanswered card${unanswered !== 1 ? "s" : ""}. Your progress so far will be recorded.`
    : "You've answered all cards. Your results will be recorded.";
  confirmDialog.classList.remove("hidden");
});

confirmEndBtn.addEventListener("click", () => {
  confirmDialog.classList.add("hidden");
  endPractice(true);
});

cancelEndBtn.addEventListener("click", () => {
  confirmDialog.classList.add("hidden");
});

function updateFooterNachos() {
  const count = getNachoCount();
  if (footerNachoName) footerNachoName.textContent = currentUser?.name || "";
  if (footerNachoCount) footerNachoCount.textContent = `${count.toLocaleString()} nacho${count !== 1 ? "s" : ""}`;
}

function getNachoCount() {
  const key = `${NACHO_STORAGE_KEY}-${currentUser?.username || "guest"}`;
  return parseInt(localStorage.getItem(key) || "0", 10);
}

function addNachos(n) {
  const key = `${NACHO_STORAGE_KEY}-${currentUser?.username || "guest"}`;
  const total = getNachoCount() + n;
  localStorage.setItem(key, total);
  return total;
}

function endPractice(early) {
  practiceActive = false;
  const unanswered = practiceCards.length - attemptedIndices.size;
  const total = practiceCards.length;
  const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // Build set name label
  const setNames = [...new Set(practiceCards.map(c => c.setName))].join(", ");

  // Format timestamp
  const now = new Date().toLocaleString("en-US", {
    month: "numeric", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true
  });

  // Build wrong answers suffix e.g. [❌hola - ola][❌adiós - adios]
  const wrongSuffix = wrongAnswers.length
    ? " " + wrongAnswers.map(w => `[❌${w.prompt} - ${w.studentAnswer}]`).join("")
    : "";

  const entry = `${setNames} — ${sessionModeLabel} — ${pct}% — ${correctCount} correct, ${incorrectCount} incorrect, ${hintedCorrectCount} hinted correct, ${unanswered} unanswered — ${currentUser.name} (${currentUser.username}) — ${now}${wrongSuffix}`;

  saveAttemptHistory(entry);

  // Add correct answers to nacho count
  const totalNachos = addNachos(correctCount);
  updateFooterNachos();

  // Pick celebration tier
  const tier = getTier(pct);
  celebrationIcon.textContent = tier.icon;
  celebrationTitle.textContent = tier.title;
  celebrationMsg.textContent = randomMessage(tier);
  nachoCountDisplay.textContent = `${totalNachos.toLocaleString()} nachos collected`;

  practicePanel.classList.add("hidden");
  resultsPanel.classList.remove("hidden");

  resultsSummary.textContent = entry;
  renderAttemptHistory();
}

// ============================================================
// PRACTICE AGAIN
// ============================================================
practiceAgainBtn.addEventListener("click", () => {
  if (!lastFilterSettings) return;
  selectedLevels = new Set(lastFilterSettings.levels);
  selectedUnits = new Set(lastFilterSettings.units);
  selectedSets = new Set(lastFilterSettings.sets);
  const filtered = getFilteredCards();
  if (!filtered.length) return;
  beginPractice(filtered);
});

newPracticeBtn.addEventListener("click", () => {
  selectedLevels.clear();
  selectedUnits.clear();
  selectedSets.clear();
  showFilterPanel();
});

// ============================================================
// ATTEMPT HISTORY (localStorage)
// ============================================================
function loadAttemptHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || "[]");
  } catch { return []; }
}

function saveAttemptHistory(entry) {
  const history = loadAttemptHistory();
  history.unshift(entry);
  const trimmed = history.slice(0, 20); // keep last 20
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
}

function renderAttemptHistory() {
  const history = loadAttemptHistory().filter(e => {
    // Only show entries for the current user
    return currentUser && e.includes(`(${currentUser.username})`);
  });

  if (!history.length) {
    attemptHistoryList.innerHTML = '<li class="no-history">No attempts yet.</li>';
    return;
  }
  attemptHistoryList.innerHTML = history
    .map(e => `<li>${e}</li>`)
    .join("");
}

// ============================================================
// HISTORY TOGGLE
// ============================================================
historyToggle.addEventListener("click", () => {
  historyContent.classList.toggle("hidden");

  historyToggle.textContent = historyContent.classList.contains("hidden")
    ? "Attempt History ▸"
    : "Attempt History ▾";
});

// ============================================================
// INIT
// ============================================================
loadData();
