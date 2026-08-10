```javascript
// ============================================================
// NACHO BOWL — CONVERSATION ENGINE
// ============================================================
//
// NEW SPREADSHEET FORMAT
//
// Each spreadsheet row = one concept.
//
// Columns:
// Title | Concept | Statement | Q1 | Q2 | Q3 ... Q20
//
// Each question cell:
//
// TYPE | PROMPT | ANSWER(S)
//
// "|" separates fields.
// "OR" separates genuinely different acceptable answers.
//
// Examples:
//
// YES_NO | ¿Había un chico? | SÍ
//
// EITHER_OR | ¿Había un chico o una chica? | un chico
//
// MULTIPLE_CHOICE | ¿Qué había? | A. un chico | B. una chica | C. un mono | D. unos chicos | A
//
// SHORT_WRITE | ¿Qué había? | un chico OR el chico OR George
//
// PHRASE | ¿Qué había? | Había un chico
//
// LONG_WRITE | Describe la situación. ¿Quiénes habían? ¿Dónde estaban?
//
// ============================================================


// ------------------------------------------------------------
// GOOGLE SHEET
// ------------------------------------------------------------

const CONVERSATION_INDEX_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTXkS0P0pDGSxXKQqtbPpv5lQb03OkgJW4p8o9fHpTdmiSJBHN8klf8cOrWxd-3iv_5J2stOk0m-Z_t/pub?output=csv";


// ------------------------------------------------------------
// STATE
// ------------------------------------------------------------

let conversationIndex = [];

let conversationData = null;

let conversationRows = [];

let currentConversationRow = 0;

let currentConversationQuestion = 0;

let conversationAttempts = 0;

let conversationScaffoldShown = false;


// Teacher-report data

let conversationReport = [];

let conversationLongWrites = [];


// Audio

let conversationAudioURL = null;

let conversationAudioBlob = null;


// ------------------------------------------------------------
// DOM REFERENCES
// ------------------------------------------------------------

const conversationBtn =
  document.getElementById("conversationBtn");

const conversationSelectionPanel =
  document.getElementById("conversationSelectionPanel");

const conversationPanel =
  document.getElementById("conversationPanel");

const conversationList =
  document.getElementById("conversationList");

const conversationSelectionBackBtn =
  document.getElementById("conversationSelectionBackBtn");

const conversationEndBtn =
  document.getElementById("conversationEndBtn");


// ------------------------------------------------------------
// OPEN CONVERSATIONS
// ------------------------------------------------------------

conversationBtn.addEventListener("click", () => {

  openConversationSelection();

});


// ------------------------------------------------------------
// OPEN CONVERSATION SELECTION
// ------------------------------------------------------------

async function openConversationSelection() {

  if (typeof filterPanel !== "undefined") {
    filterPanel.classList.add("hidden");
  }

  if (typeof practicePanel !== "undefined") {
    practicePanel.classList.add("hidden");
  }

  if (typeof resultsPanel !== "undefined") {
    resultsPanel.classList.add("hidden");
  }

  if (typeof studySetPanel !== "undefined") {
    studySetPanel.classList.add("hidden");
  }

  if (typeof nachoBuilderPanel !== "undefined") {
    nachoBuilderPanel.classList.add("hidden");
  }

  conversationSelectionPanel.classList.remove("hidden");

  await loadConversationIndex();

}


// ------------------------------------------------------------
// LOAD CONVERSATION INDEX
// ------------------------------------------------------------

async function loadConversationIndex() {

  conversationList.innerHTML =
    '<p class="filter-hint">Loading conversations...</p>';

  try {

    const response =
      await fetch(CONVERSATION_INDEX_URL);

    if (!response.ok) {

      throw new Error(
        `Could not load conversation list (${response.status})`
      );

    }

    const csv =
      await response.text();

    conversationIndex =
      parseConversationIndexCSV(csv);

    conversationIndex =
      conversationIndex
        .filter(conversation =>
          conversation.active === true
        )
        .sort((a, b) =>
          a.order - b.order
        );

    renderConversationList();

  } catch (error) {

    console.error(
      "Conversation index loading error:",
      error
    );

    conversationList.innerHTML =
      `<p class="error-msg">
        ⚠️ Could not load conversations.
      </p>`;

  }

}


// ------------------------------------------------------------
// PARSE CONVERSATION INDEX CSV
// ------------------------------------------------------------

function parseConversationIndexCSV(csv) {

  const lines =
    csv
      .replace(/\r/g, "")
      .split("\n")
      .filter(line =>
        line.trim() !== ""
      );

  if (lines.length < 2) {
    return [];
  }

  const headers =
    parseCSVLine(lines[0]);

  return lines
    .slice(1)
    .map(line => {

      const values =
        parseCSVLine(line);

      const row = {};

      headers.forEach((header, index) => {

        row[header.trim()] =
          values[index]
            ? values[index].trim()
            : "";

      });

      return {

        title:
          row["Title"] || "",

        level:
          row["Level"] || "",

        topic:
          row["Topic"] || "",

        description:
          row["Description"] || "",

        docURL:
          row["Doc URL"] || "",

        active:
          String(row["Active"])
            .toLowerCase() === "true",

        order:
          Number(row["Order"]) || 9999,

        imageURL:
          row["Image URL"] || ""

      };

    });

}


// ------------------------------------------------------------
// CSV LINE PARSER
// ------------------------------------------------------------

function parseCSVLine(line) {

  const values = [];

  let current = "";

  let insideQuotes = false;

  for (
    let i = 0;
    i < line.length;
    i++
  ) {

    const character =
      line[i];

    if (character === '"') {

      if (
        insideQuotes &&
        line[i + 1] === '"'
      ) {

        current += '"';

        i++;

      } else {

        insideQuotes =
          !insideQuotes;

      }

    } else if (
      character === "," &&
      !insideQuotes
    ) {

      values.push(current);

      current = "";

    } else {

      current += character;

    }

  }

  values.push(current);

  return values;

}


// ------------------------------------------------------------
// RENDER CONVERSATION LIST
// ------------------------------------------------------------

function renderConversationList() {

  conversationList.innerHTML = "";

  if (!conversationIndex.length) {

    conversationList.innerHTML =
      '<p class="filter-hint">No conversations are currently available.</p>';

    return;

  }

  conversationIndex.forEach(conversation => {

    const card =
      document.createElement("button");

    card.type = "button";

    card.className =
      "conversation-list-card";

    if (conversation.imageURL) {

      const image =
        document.createElement("img");

      image.src =
        conversation.imageURL;

      image.alt =
        conversation.title;

      image.className =
        "conversation-list-image";

      card.appendChild(image);

    }

    const content =
      document.createElement("div");

    content.className =
      "conversation-list-content";

    const title =
      document.createElement("h3");

    title.textContent =
      conversation.title;

    const meta =
      document.createElement("div");

    meta.className =
      "conversation-list-meta";

    meta.textContent =
      `Level ${conversation.level} • ${conversation.topic}`;

    const description =
      document.createElement("p");

    description.textContent =
      conversation.description;

    content.appendChild(title);

    content.appendChild(meta);

    content.appendChild(description);

    card.appendChild(content);

    card.addEventListener(
      "click",
      () => {

        selectConversation(
          conversation
        );

      }
    );

    conversationList.appendChild(card);

  });

}


// ------------------------------------------------------------
// SELECT CONVERSATION
// ------------------------------------------------------------

function selectConversation(
  conversation
) {

  if (!conversation.docURL) {

    conversationList.innerHTML =
      `<p class="error-msg">
        ⚠️ This conversation does not have a spreadsheet URL.
      </p>`;

    return;

  }

  let csvURL;

  try {

    csvURL =
      convertGoogleSpreadsheetURL(
        conversation.docURL
      );

  } catch (error) {

    conversationList.innerHTML =
      `<p class="error-msg">
        ⚠️ Invalid conversation spreadsheet URL.
      </p>`;

    return;

  }

  conversationSelectionPanel.classList.add(
    "hidden"
  );

  conversationPanel.classList.remove(
    "hidden"
  );

  loadConversationSpreadsheet(
    conversation,
    csvURL
  );

}


// ------------------------------------------------------------
// CONVERT GOOGLE SPREADSHEET URL
// ------------------------------------------------------------

function convertGoogleSpreadsheetURL(
  url
) {

  // Already a published CSV URL.

  if (
    url.includes(
      "output=csv"
    )
  ) {

    return url;

  }

  // Published Google Sheet URL.

  if (
    url.includes(
      "docs.google.com/spreadsheets"
    )
  ) {

    if (
      url.includes(
        "/pub"
      )
    ) {

      return url.includes("?")
        ? `${url}&output=csv`
        : `${url}?output=csv`;

    }

    const match =
      url.match(
        /spreadsheets\/d\/([^/]+)/
      );

    if (!match) {

      throw new Error(
        "Invalid Google Sheets URL."
      );

    }

    const spreadsheetId =
      match[1];

    return (
      `https://docs.google.com/spreadsheets/d/` +
      `${spreadsheetId}/export?format=csv`
    );

  }

  throw new Error(
    "Invalid Google Sheets URL."
  );

}


// ============================================================
// LOAD CONVERSATION SPREADSHEET
// ============================================================

async function loadConversationSpreadsheet(
  conversation,
  csvURL
) {

  try {

    const response =
      await fetch(csvURL);

    if (!response.ok) {

      throw new Error(
        `Could not load conversation (${response.status})`
      );

    }

    const csv =
      await response.text();

    conversationData =
      parseConversationSpreadsheet(
        csv
      );

    if (
      !conversationData.rows.length
    ) {

      throw new Error(
        "No conversation rows found."
      );

    }

    conversationRows =
      conversationData.rows;

    currentConversationRow = 0;

    currentConversationQuestion = 0;

    conversationAttempts = 0;

    conversationScaffoldShown = false;

    conversationReport = [];

    conversationLongWrites = [];

    if (
      !conversationData.title
    ) {

      conversationData.title =
        conversation.title;

    }

    if (
      !conversationData.level
    ) {

      conversationData.level =
        conversation.level;

    }

    renderConversationHeader();

    renderConversationScene();

    showConversationQuestion();

  } catch (error) {

    console.error(
      "Conversation spreadsheet loading error:",
      error
    );

    conversationPanel.classList.remove(
      "hidden"
    );

    conversationPrompt.textContent =
      "⚠️ Could not load this conversation.";

    conversationFeedback.textContent =
      error.message;

    conversationFeedback.className =
      "conversation-feedback error";

  }

}


// ============================================================
// PARSE CONVERSATION SPREADSHEET
// ============================================================

function parseConversationSpreadsheet(
  csv
) {

  const lines =
    csv
      .replace(/\r/g, "")
      .split("\n")
      .filter(line =>
        line.trim() !== ""
      );

  if (lines.length < 2) {

    return {

      title: "",

      rows: []

    };

  }

  const headers =
    parseCSVLine(
      lines[0]
    );

  const normalizedHeaders =
    headers.map(header =>
      header.trim()
    );

  const rows = [];

  lines
    .slice(1)
    .forEach(line => {

      const values =
        parseCSVLine(line);

      const row = {};

      normalizedHeaders.forEach(
        (header, index) => {

          row[header] =
            values[index]
              ? values[index].trim()
              : "";

        }
      );

      const concept =
        row["Concept"] || "";

      const statement =
        row["Statement"] || "";

      const questions = [];

      // Look for Q1–Q20.

      for (
        let q = 1;
        q <= 20;
        q++
      ) {

        const cell =
          row[`Q${q}`] || "";

        if (!cell.trim()) {
          continue;
        }

        const question =
          parseConversationQuestionCell(
            cell,
            q
          );

        if (question) {

          questions.push(
            question
          );

        }

      }

      // Ignore completely empty rows.

      if (
        !concept &&
        !statement &&
        !questions.length
      ) {

        return;

      }

      rows.push({

        title:
          row["Title"] || "",

        concept,

        statement,

        questions

      });

    });

  return {

    title:
      rows[0]?.title || "",

    level: "",

    topic: "",

    scene: {

      imageURL: "",

      text: ""

    },

    rows

  };

}


// ============================================================
// PARSE ONE QUESTION CELL
// ============================================================
//
// Format:
//
// TYPE | PROMPT | ANSWER
//
// Multiple choice:
//
// MULTIPLE_CHOICE |
// ¿Qué había? |
// A. un chico |
// B. una chica |
// C. un mono |
// D. unos chicos |
// A
//
// ============================================================

function parseConversationQuestionCell(
  cell,
  questionNumber
) {

  const fields =
    cell
      .split("|")
      .map(field =>
        field.trim()
      );

  if (!fields.length) {
    return null;
  }

  const type =
    fields[0]
      .toUpperCase()
      .trim();

  const validTypes = [

    "YES_NO",

    "EITHER_OR",

    "MULTIPLE_CHOICE",

    "SHORT_WRITE",

    "PHRASE",

    "LONG_WRITE"

  ];

  if (
    !validTypes.includes(type)
  ) {

    console.warn(
      `Unknown conversation question type: ${type}`
    );

    return null;

  }

  // ----------------------------------------------------------
  // LONG WRITE
  // ----------------------------------------------------------

  if (
    type === "LONG_WRITE"
  ) {

    return {

      number:
        questionNumber,

      type,

      prompt:
        fields.slice(1).join(" | ").trim(),

      answers: [],

      options: []

    };

  }

  // ----------------------------------------------------------
  // MULTIPLE CHOICE
  // ----------------------------------------------------------

  if (
    type === "MULTIPLE_CHOICE"
  ) {

    if (
      fields.length < 3
    ) {

      return null;

    }

    const prompt =
      fields[1];

    const answer =
      fields[fields.length - 1]
        .trim()
        .toUpperCase();

    const options =
      fields
        .slice(
          2,
          fields.length - 1
        )
        .filter(Boolean);

    return {

      number:
        questionNumber,

      type,

      prompt,

      options,

      answers: [
        answer
      ]

    };

  }

  // ----------------------------------------------------------
  // ALL OTHER TYPES
  // ----------------------------------------------------------

  const prompt =
    fields[1] || "";

  const answerField =
    fields
      .slice(2)
      .join("|")
      .trim();

  const answers =
    splitORAnswers(
      answerField
    );

  return {

    number:
      questionNumber,

    type,

    prompt,

    answers,

    options: []

  };

}


// ------------------------------------------------------------
// SPLIT OR ANSWERS
// ------------------------------------------------------------

function splitORAnswers(
  answerString
) {

  if (!answerString) {
    return [];
  }

  return answerString
    .split(/\s+OR\s+/i)
    .map(answer =>
      answer.trim()
    )
    .filter(Boolean);

}


// ============================================================
// HEADER
// ============================================================

function renderConversationHeader() {

  conversationTitle.textContent =
    conversationData.title ||
    "Conversation";

  conversationLevel.textContent =
    conversationData.level
      ? `Level ${conversationData.level}`
      : "";

}


// ============================================================
// SCENE
// ============================================================

function renderConversationScene() {

  const scene =
    conversationData.scene;

  conversationSceneText.textContent =
    scene.text || "";

  if (scene.imageURL) {

    conversationSceneImage.src =
      scene.imageURL;

    conversationSceneImage.alt =
      conversationData.title ||
      "Conversation scene";

    conversationSceneImage.classList.remove(
      "hidden"
    );

  } else {

    conversationSceneImage.classList.add(
      "hidden"
    );

  }

}


// ============================================================
// CURRENT QUESTION
// ============================================================

function getCurrentConversationQuestion() {

  const row =
    conversationRows[
      currentConversationRow
    ];

  if (!row) {
    return null;
  }

  return row.questions[
    currentConversationQuestion
  ] || null;

}


// ============================================================
// SHOW QUESTION
// ============================================================

function showConversationQuestion() {

  const row =
    conversationRows[
      currentConversationRow
    ];

  if (!row) {

    finishConversation();

    return;

  }

  const question =
    getCurrentConversationQuestion();

  // If this row has no more questions,
  // advance to the next concept.

  if (!question) {

    currentConversationRow++;

    currentConversationQuestion = 0;

    conversationAttempts = 0;

    conversationScaffoldShown = false;

    showConversationQuestion();

    return;

  }

  conversationAttempts = 0;

  conversationScaffoldShown = false;

  conversationFeedback.textContent =
    "";

  conversationFeedback.className =
    "conversation-feedback";

  conversationScaffold.classList.add(
    "hidden"
  );

  conversationNextBtn.classList.add(
    "hidden"
  );

  conversationEndBtn.classList.remove(
    "hidden"
  );

  clearConversationResponseAreas();

  updateConversationProgress();

  // The statement/concept is available
  // internally and can be displayed if desired.

  conversationPrompt.textContent =
    question.prompt || "";

  renderConversationScene();

  playSpanishText(
    question.prompt
  );

  switch (
    question.type
  ) {

    case "YES_NO":

      showYesNo();

      break;

    case "EITHER_OR":

      showEitherOr(
        question
      );

      break;

    case "MULTIPLE_CHOICE":

      showMultipleChoice(
        question
      );

      break;

    case "SHORT_WRITE":

    case "PHRASE":

    case "LONG_WRITE":

      showWriting();

      break;

    default:

      conversationFeedback.textContent =
        `⚠️ Unknown question type: ${
          question.type
        }`;

  }

}


// ============================================================
// PROGRESS
// ============================================================

function updateConversationProgress() {

  const totalQuestions =
    conversationRows.reduce(
      (
        total,
        row
      ) =>
        total +
        row.questions.length,
      0
    );

  let completedQuestions = 0;

  for (
    let i = 0;
    i < currentConversationRow;
    i++
  ) {

    completedQuestions +=
      conversationRows[i]
        .questions.length;

  }

  completedQuestions +=
    currentConversationQuestion;

  conversationProgress.textContent =
    `Concept ${
      currentConversationRow + 1
    } of ${
      conversationRows.length
    } • Question ${
      currentConversationQuestion + 1
    } • ${
      completedQuestions
    } of ${
      totalQuestions
    }`;

}


// ============================================================
// CLEAR RESPONSE AREAS
// ============================================================

function clearConversationResponseAreas() {

  conversationYesNo.classList.add(
    "hidden"
  );

  conversationChoices.classList.add(
    "hidden"
  );

  conversationWriting.classList.add(
    "hidden"
  );

  conversationSpeaking.classList.add(
    "hidden"
  );

  conversationWritingInput.value =
    "";

  conversationWritingInput.disabled =
    false;

  conversationSubmitWriting.disabled =
    false;

  conversationAudioPlayback.classList.add(
    "hidden"
  );

  conversationRecordingActions.classList.add(
    "hidden"
  );

  conversationAudioPlayback.removeAttribute(
    "src"
  );

  if (
    conversationAudioURL
  ) {

    URL.revokeObjectURL(
      conversationAudioURL
    );

    conversationAudioURL =
      null;

  }

  conversationAudioBlob =
    null;

}


// ============================================================
// YES / NO
// ============================================================

function showYesNo() {

  conversationYesNo.classList.remove(
    "hidden"
  );

  conversationYesNo
    .querySelectorAll(
      ".conversation-answer-btn"
    )
    .forEach(button => {

      button.disabled =
        false;

      button.onclick =
        () => {

          checkConversationAnswer(
            button.dataset.answer
          );

        };

    });

}


// ============================================================
// EITHER / OR
// ============================================================
//
// The spreadsheet supplies the question,
// e.g.:
//
// ¿Era George o Robert el chico?
//
// The engine displays two answer buttons
// based on the first two answers/options.
//
// ============================================================

function showEitherOr(
  question
) {

  conversationChoices.innerHTML =
    "";

  const answers =
    extractEitherOrChoices(
      question.prompt
    );

  if (
    answers.length < 2
  ) {

    // Fallback: allow written response.

    showWriting();

    return;

  }

  answers.forEach(
    answer => {

      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.className =
        "btn btn-primary conversation-choice-btn";

      button.textContent =
        answer;

      button.addEventListener(
        "click",
        () => {

          checkConversationAnswer(
            answer
          );

        }
      );

      conversationChoices.appendChild(
        button
      );

    }
  );

  conversationChoices.classList.remove(
    "hidden"
  );

}


// ------------------------------------------------------------
// EXTRACT EITHER/OR CHOICES
// ------------------------------------------------------------

function extractEitherOrChoices(
  prompt
) {

  const match =
    prompt.match(
      /(.+?)\s+o\s+(.+?)\??$/i
    );

  if (!match) {
    return [];
  }

  return [

    match[1]
      .trim(),

    match[2]
      .replace(/[¿?]/g, "")
      .trim()

  ];

}


// ============================================================
// MULTIPLE CHOICE
// ============================================================

function showMultipleChoice(
  question
) {

  conversationChoices.innerHTML =
    "";

  question.options.forEach(
    option => {

      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.className =
        "btn btn-primary conversation-choice-btn";

      button.textContent =
        option;

      button.addEventListener(
        "click",
        () => {

          const match =
            option
              .trim()
              .match(
                /^([A-Z])\./i
              );

          const selectedLetter =
            match
              ? match[1].toUpperCase()
              : "";

          checkConversationAnswer(
            selectedLetter
          );

        }
      );

      conversationChoices.appendChild(
        button
      );

    }
  );

  conversationChoices.classList.remove(
    "hidden"
  );

}


// ============================================================
// WRITING
// ============================================================

function showWriting() {

  conversationWriting.classList.remove(
    "hidden"
  );

  conversationWritingInput.focus();

}


// ============================================================
// CHECK ANSWER
// ============================================================

function checkConversationAnswer(
  studentAnswer
) {

  const question =
    getCurrentConversationQuestion();

  if (!question) {
    return;
  }

  console.log(
    "QUESTION:",
    question
  );

  console.log(
    "STUDENT ANSWER:",
    studentAnswer
  );

  // ----------------------------------------------------------
  // LONG WRITE
  // ----------------------------------------------------------
  //
  // LONG_WRITE NEVER BLOCKS PROGRESS.
  // ----------------------------------------------------------

  if (
    question.type ===
    "LONG_WRITE"
  ) {

    recordLongWrite(
      question,
      studentAnswer
    );

    conversationFeedback.textContent =
      "Respuesta guardada. ✓";

    conversationFeedback.className =
      "conversation-feedback correct";

    disableCurrentConversationResponse();

    conversationNextBtn.classList.remove(
      "hidden"
    );

    return;

  }


  // ----------------------------------------------------------
  // MULTIPLE CHOICE
  // ----------------------------------------------------------

  let correct =
    false;

  if (
    question.type ===
    "MULTIPLE_CHOICE"
  ) {

    const selectedLetter =
      String(studentAnswer)
        .trim()
        .toUpperCase();

    const correctLetter =
      String(
        question.answers[0] || ""
      )
        .trim()
        .toUpperCase();

    correct =
      selectedLetter ===
      correctLetter;

  }

  // ----------------------------------------------------------
  // EVERYTHING ELSE
  // ----------------------------------------------------------

  else {

    correct =
      evaluateConversationTextAnswer(
        studentAnswer,
        question
      );

  }


  // ----------------------------------------------------------
  // CORRECT
  // ----------------------------------------------------------

  if (correct) {

    recordSuccessfulAttempt(
      question
    );

    conversationFeedback.textContent =
      "¡Muy bien! ✓";

    conversationFeedback.className =
      "conversation-feedback correct";

    disableCurrentConversationResponse();

    conversationNextBtn.classList.remove(
      "hidden"
    );

    return;

  }


  // ----------------------------------------------------------
  // INCORRECT
  // ----------------------------------------------------------

  recordFailedAttempt(
    question,
    studentAnswer
  );

  handleConversationWrongAnswer(
    question
  );

}


// ============================================================
// TEXT ANSWER EVALUATION
// ============================================================
//
// SHORT_WRITE is intentionally flexible.
//
// The spreadsheet gives us the important answer concepts.
// We do NOT require an exact grammatical sentence.
//
// Example:
//
// SHORT_WRITE | ¿Quién era el chico? |
// George OR George era el chico
//
// Accepted:
//
// George
// George era el chico
// El chico era George
// Era George el chico
//
// Rejected:
//
// George is dumb
// Beth
//
// ============================================================

function evaluateConversationTextAnswer(
  studentAnswer,
  question
) {

  const normalizedStudent =
    normalizeConversationAnswer(
      studentAnswer
    );

  if (!normalizedStudent) {
    return false;
  }

  // ----------------------------------------------------------
  // YES / NO
  // ----------------------------------------------------------

  if (
    question.type ===
    "YES_NO"
  ) {

    return question.answers.some(
      answer =>
        normalizedStudent ===
        normalizeConversationAnswer(
          answer
        )
    );

  }


  // ----------------------------------------------------------
  // PHRASE
  // ----------------------------------------------------------

  if (
    question.type ===
    "PHRASE"
  ) {

    return question.answers.some(
      answer =>
        normalizedStudent ===
        normalizeConversationAnswer(
          answer
        )
    );

  }


  // ----------------------------------------------------------
  // EITHER / OR
  // ----------------------------------------------------------

  if (
    question.type ===
    "EITHER_OR"
  ) {

    return question.answers.some(
      answer =>
        answerMatchesConcept(
          normalizedStudent,
          normalizeConversationAnswer(
            answer
          )
        )
    );

  }


  // ----------------------------------------------------------
  // SHORT WRITE
  // ----------------------------------------------------------

  if (
    question.type ===
    "SHORT_WRITE"
  ) {

    return question.answers.some(
      answer =>
        answerMatchesConcept(
          normalizedStudent,
          normalizeConversationAnswer(
            answer
          )
        )
    );

  }


  return false;

}


// ============================================================
// CONCEPT MATCHING
// ============================================================
//
// This is deliberately conservative enough to prevent:
//
// "George is dumb"
//
// from passing simply because it contains "George".
//
// If the student's response is exactly the target,
// it passes.
//
// If the response contains the target as part of a
// reasonable answer structure, it can pass.
//
// ============================================================

function answerMatchesConcept(
  student,
  target
) {

  if (!student || !target) {
    return false;
  }

  // Exact answer.

  if (
    student === target
  ) {

    return true;

  }

  // If target is a short phrase,
  // look for the target as a complete
  // word/phrase rather than a substring.

  const escapedTarget =
    target.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

  const targetRegex =
    new RegExp(
      `(^|\\s)${escapedTarget}(\\s|$)`,
      "i"
    );

  if (
    !targetRegex.test(student)
  ) {

    return false;

  }

  // ----------------------------------------------------------
  // QUESTION-ANSWER SAFETY
  // ----------------------------------------------------------
  //
  // Reject obvious unrelated English responses.
  //
  // This is intentionally simple. The goal is not
  // full natural-language understanding.
  //
  // ----------------------------------------------------------

  const obviousEnglish =
    [
      " is ",
      " are ",
      " was ",
      " were ",
      " dumb",
      " stupid",
      " idiot",
      " sucks",
      " likes",
      " hates"
    ];

  const containsObviousEnglish =
    obviousEnglish.some(
      fragment =>
        ` ${student} `.includes(
          fragment
        )
    );

  if (
    containsObviousEnglish
  ) {

    return false;

  }

  return true;

}


// ============================================================
// NORMALIZE
// ============================================================

function normalizeConversationAnswer(
  value
) {

  return String(value)

    .trim()

    .toLowerCase()

    .normalize("NFD")

    .replace(
      /[\u0300-\u036f]/g,
      ""
    )

    .replace(
      /[¿?¡!.,;:"]/g,
      ""
    )

    .replace(
      /\s+/g,
      " "
    );

}


// ============================================================
// WRONG ANSWER
// ============================================================

function handleConversationWrongAnswer(
  question
) {

  conversationAttempts++;

  conversationFeedback.textContent =
    "No exactamente. Inténtalo otra vez.";

  conversationFeedback.className =
    "conversation-feedback incorrect";

  // Scaffold support can be added to the
  // spreadsheet later if desired.
  //
  // For now, the engine simply requires
  // another attempt.

}


// ============================================================
// RECORD FAILED ATTEMPT
// ============================================================

function recordFailedAttempt(
  question,
  studentAnswer
) {

  let report =
    getCurrentReportEntry(
      question
    );

  report.attempts++;

}


// ============================================================
// RECORD SUCCESSFUL ATTEMPT
// ============================================================

function recordSuccessfulAttempt(
  question
) {

  let report =
    getCurrentReportEntry(
      question
    );

  report.attempts++;

  report.completed =
    true;

}


// ============================================================
// GET REPORT ENTRY
// ============================================================

function getCurrentReportEntry(
  question
) {

  let entry =
    conversationReport.find(
      item =>
        item.rowIndex ===
          currentConversationRow &&
        item.questionIndex ===
          currentConversationQuestion
    );

  if (!entry) {

    const row =
      conversationRows[
        currentConversationRow
      ];

    entry = {

      rowIndex:
        currentConversationRow,

      questionIndex:
        currentConversationQuestion,

      questionNumber:
        question.number,

      concept:
        row.concept,

      type:
        question.type,

      prompt:
        question.prompt,

      attempts:
        0,

      completed:
        false

    };

    conversationReport.push(
      entry
    );

  }

  return entry;

}


// ============================================================
// RECORD LONG WRITE
// ============================================================

function recordLongWrite(
  question,
  studentAnswer
) {

  conversationLongWrites.push({

    rowIndex:
      currentConversationRow,

    questionIndex:
      currentConversationQuestion,

    questionNumber:
      question.number,

    concept:
      conversationRows[
        currentConversationRow
      ].concept,

    prompt:
      question.prompt,

    response:
      String(studentAnswer)
        .trim()

  });

}


// ============================================================
// DISABLE RESPONSE
// ============================================================

function disableCurrentConversationResponse() {

  conversationYesNo
    .querySelectorAll(
      "button"
    )
    .forEach(button => {

      button.disabled =
        true;

    });

  conversationChoices
    .querySelectorAll(
      "button"
    )
    .forEach(button => {

      button.disabled =
        true;

    });

  conversationWritingInput.disabled =
    true;

  conversationSubmitWriting.disabled =
    true;

}


// ============================================================
// NEXT QUESTION
// ============================================================

conversationNextBtn.addEventListener(
  "click",
  () => {

    advanceConversation();

  }
);


// ============================================================
// ADVANCE
// ============================================================

function advanceConversation() {

  const question =
    getCurrentConversationQuestion();

  if (!question) {
    return;
  }

  currentConversationQuestion++;

  // Move to next concept when the current
  // concept has no more questions.

  const currentRow =
    conversationRows[
      currentConversationRow
    ];

  if (
    currentConversationQuestion >=
    currentRow.questions.length
  ) {

    currentConversationRow++;

    currentConversationQuestion = 0;

  }

  conversationAttempts = 0;

  conversationScaffoldShown = false;

  showConversationQuestion();

}


// ============================================================
// WRITING SUBMIT
// ============================================================

conversationSubmitWriting.addEventListener(
  "click",
  () => {

    const answer =
      conversationWritingInput.value.trim();

    if (!answer) {
      return;
    }

    checkConversationAnswer(
      answer
    );

  }
);


conversationWritingInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      conversationSubmitWriting.click();

    }

  }
);


// ============================================================
// TEXT TO SPEECH
// ============================================================

function playSpanishText(
  text
) {

  if (
    !text ||
    !("speechSynthesis" in window)
  ) {

    return;

  }

  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(
      text
    );

  utterance.lang =
    "es-ES";

  utterance.rate =
    0.9;

  window.speechSynthesis.speak(
    utterance
  );

}


// ============================================================
// REPLAY
// ============================================================

conversationReplayBtn.addEventListener(
  "click",
  () => {

    const question =
      getCurrentConversationQuestion();

    if (question) {

      playSpanishText(
        question.prompt
      );

    }

  }
);


// ============================================================
// FINISH
// ============================================================

function finishConversation() {

  clearConversationResponseAreas();

  conversationPrompt.textContent =
    conversationData.endTeacher ||
    "¡Muy bien! Has terminado la conversación.";

  conversationFeedback.textContent =
    "🎉 ¡Conversación completada!";

  conversationFeedback.className =
    "conversation-feedback correct";

  conversationNextBtn.classList.add(
    "hidden"
  );

  conversationEndBtn.classList.remove(
    "hidden"
  );

  generateConversationTeacherReport();

}


// ============================================================
// TEACHER REPORT
// ============================================================
//
// Current intended structure:
//
// QUESTION | TYPE | ATTEMPTS | SHORT WRITE STATUS
//
// LONG_WRITE responses appear underneath in
// large text for teacher review.
//
// ============================================================

function generateConversationTeacherReport() {

  console.log(
    "CONVERSATION TEACHER REPORT"
  );

  console.table(
    conversationReport.map(
      entry => ({

        Question:
          entry.questionNumber,

        Type:
          entry.type,

        Attempts:
          entry.attempts

      })
    )
  );

  console.log(
    "LONG WRITE RESPONSES"
  );

  console.table(
    conversationLongWrites
  );

}


// ============================================================
// BACK
// ============================================================

conversationSelectionBackBtn.addEventListener(
  "click",
  () => {

    conversationSelectionPanel.classList.add(
      "hidden"
    );

    if (
      typeof filterPanel !==
      "undefined"
    ) {

      filterPanel.classList.remove(
        "hidden"
      );

    }

  }
);


// ============================================================
// END CONVERSATION
// ============================================================

conversationEndBtn.addEventListener(
  "click",
  () => {

    conversationPanel.classList.add(
      "hidden"
    );

    conversationSelectionPanel.classList.remove(
      "hidden"
    );

    loadConversationIndex();

  }
);
```
