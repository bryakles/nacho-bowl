// ============================================================
// NACHO BOWL — CONVERSATION ENGINE
// Spreadsheet-driven TPRS conversation practice
// ============================================================


// ============================================================
// GOOGLE SHEET
// ============================================================

const CONVERSATION_INDEX_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTXkS0P0pDGSxXKQqtbPpv5lQb03OkgJW4p8o9fHpTdmiSJBHN8klf8cOrWxd-3iv_5J2stOk0m-Z_t/pub?output=csv";


// ============================================================
// STATE
// ============================================================

let conversationIndex = [];
let conversationData = null;

let conversationRows = [];
let currentConceptIndex = 0;
let currentQuestionIndex = 0;

let conversationAttempts = 0;

// Teacher-report data
let conversationReport = [];


// ============================================================
// DOM REFERENCES
// ============================================================

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


// ============================================================
// OPEN CONVERSATIONS
// ============================================================

conversationBtn.addEventListener("click", () => {

  openConversationSelection();

});


// ============================================================
// OPEN CONVERSATION SELECTION
// ============================================================

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

  conversationSelectionPanel.classList.remove(
    "hidden"
  );

  await loadConversationIndex();

}


// ============================================================
// LOAD CONVERSATION INDEX
// ============================================================

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
      parseConversationCSV(csv);

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


// ============================================================
// PARSE INDEX CSV
// ============================================================

function parseConversationCSV(csv) {

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


// ============================================================
// CSV LINE PARSER
// ============================================================

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


// ============================================================
// RENDER CONVERSATION LIST
// ============================================================

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


// ============================================================
// SELECT CONVERSATION
// ============================================================

function selectConversation(conversation) {

  if (!conversation.docURL) {

    conversationList.innerHTML =
      `<p class="error-msg">
        ⚠️ This conversation does not have a Google Doc URL.
      </p>`;

    return;

  }

  const docURL =
    convertGoogleDocURL(
      conversation.docURL
    );

  conversationSelectionPanel.classList.add(
    "hidden"
  );

  conversationPanel.classList.remove(
    "hidden"
  );

  loadConversationDocument(
    conversation,
    docURL
  );

}


// ============================================================
// GOOGLE DOC URL
// ============================================================

function convertGoogleDocURL(url) {

  const match =
    url.match(
      /docs\.google\.com\/document\/d\/([^/]+)/
    );

  if (!match) {

    throw new Error(
      "Invalid Google Docs URL."
    );

  }

  const documentId =
    match[1];

  return (
    `https://docs.google.com/document/d/` +
    `${documentId}/export?format=txt`
  );

}


// ============================================================
// LOAD CONVERSATION DOCUMENT
// ============================================================

async function loadConversationDocument(
  conversation,
  docURL
) {

  try {

    const response =
      await fetch(docURL);

    if (!response.ok) {

      throw new Error(
        `Could not load conversation (${response.status})`
      );

    }

    const text =
      await response.text();

    conversationData =
      parseConversation(text);

    if (
      !conversationData.rows.length
    ) {

      throw new Error(
        "No conversation rows found."
      );

    }

    conversationRows =
      conversationData.rows;

    currentConceptIndex = 0;
    currentQuestionIndex = 0;

    conversationAttempts = 0;

    conversationReport = [];

    if (!conversationData.title) {

      conversationData.title =
        conversation.title;

    }

    if (!conversationData.level) {

      conversationData.level =
        conversation.level;

    }

    renderConversationHeader();

    renderConversationScene();

    showConversationQuestion();

  } catch (error) {

    console.error(
      "Conversation loading error:",
      error
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
// CONVERSATION PARSER
//
// Expected spreadsheet:
//
// Title | Concept | Statement | Q1 | Q2 | Q3 | ...
//
// Each question cell:
//
// YES_NO
// ¿Había un chico?
// SÍ
//
// EITHER_OR
// ¿Había un chico o una chica?
// un chico
//
// MULTIPLE_CHOICE
// ¿Qué había?
// A. un chico
// B. una chica
// C. un mono
// D. unos chicos
// A
//
// SHORT_WRITE
// ¿Qué había?
// un chico | el chico
//
// LONG_WRITE
// Describe la situación.
// 
// ============================================================

function parseConversation(text) {

  const rows =
    parseSpreadsheetTSV(text);

  if (!rows.length) {

    return {
      title: "",
      level: "",
      topic: "",
      scene: {
        imageURL: "",
        text: ""
      },
      rows: [],
      endTeacher: ""
    };

  }

  const firstRow =
    rows[0];

  const headers =
    firstRow.map(cell =>
      String(cell).trim()
    );

  const conversation = {

    title: "",
    level: "",
    topic: "",

    scene: {
      imageURL: "",
      text: ""
    },

    rows: [],

    endTeacher: ""

  };


  // ----------------------------------------------------------
  // OPTIONAL METADATA
  // ----------------------------------------------------------

  const titleIndex =
    headers.findIndex(
      h => h.toLowerCase() === "title"
    );

  const levelIndex =
    headers.findIndex(
      h => h.toLowerCase() === "level"
    );

  const topicIndex =
    headers.findIndex(
      h => h.toLowerCase() === "topic"
    );


  // ----------------------------------------------------------
  // DATA ROWS
  // ----------------------------------------------------------

  for (
    let r = 1;
    r < rows.length;
    r++
  ) {

    const spreadsheetRow =
      rows[r];

    if (
      !spreadsheetRow ||
      !spreadsheetRow.length
    ) {
      continue;
    }

    const title =
      spreadsheetRow[0] || "";

    const concept =
      spreadsheetRow[1] || "";

    const statement =
      spreadsheetRow[2] || "";

    // Skip completely empty rows

    if (
      !title &&
      !concept &&
      !statement
    ) {

      continue;

    }

    const questions = [];

    // Q1 begins in column D

    for (
      let c = 3;
      c < spreadsheetRow.length;
      c++
    ) {

      const cell =
        spreadsheetRow[c];

      if (
        !cell ||
        !String(cell).trim()
      ) {
        continue;
      }

      const question =
        parseQuestionCell(
          cell
        );

      if (question) {

        question.number =
          questions.length + 1;

        questions.push(
          question
        );

      }

    }

    conversation.rows.push({

      title:
        String(title).trim(),

      concept:
        String(concept).trim(),

      statement:
        String(statement).trim(),

      questions

    });

  }

  return conversation;

}


// ============================================================
// PARSE GOOGLE DOC / TSV
// ============================================================

function parseSpreadsheetTSV(text) {

  const cleaned =
    text.replace(/\r/g, "");

  const lines =
    cleaned.split("\n");

  return lines.map(line =>
    parseTSVLine(line)
  );

}


// ============================================================
// PARSE TSV LINE
// ============================================================

function parseTSVLine(line) {

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
      character === "\t" &&
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


// ============================================================
// PARSE QUESTION CELL
// ============================================================

function parseQuestionCell(cell) {

  let text =
    String(cell)
      .replace(/\r/g, "")
      .trim();

  // Remove wrapping quotes that can survive
  // Google Sheets / CSV export.

  if (
    text.startsWith('"') &&
    text.endsWith('"')
  ) {

    text =
      text.slice(
        1,
        -1
      );

  }

  const lines =
    text
      .split("\n")
      .map(line =>
        line.trim()
      )
      .filter(Boolean);

  if (!lines.length) {
    return null;
  }

  const type =
    lines[0]
      .toUpperCase()
      .trim();

  const validTypes = [
    "YES_NO",
    "EITHER_OR",
    "MULTIPLE_CHOICE",
    "SHORT_WRITE",
    "LONG_WRITE"
  ];

  if (
    !validTypes.includes(type)
  ) {

    console.warn(
      "Unknown question type:",
      type
    );

    return null;

  }

  const question = {

    type,

    prompt: "",

    answer: "",

    acceptedKeywords: [],

    options: [],

    correctOption: "",

    responseRequired: true

  };


  // ==========================================================
  // YES / NO
  // ==========================================================

  if (
    type === "YES_NO"
  ) {

    question.prompt =
      lines[1] || "";

    question.answer =
      lines[2] || "";

    return question;

  }


  // ==========================================================
  // EITHER / OR
  // ==========================================================

  if (
    type === "EITHER_OR"
  ) {

    question.prompt =
      lines[1] || "";

    question.answer =
      lines[2] || "";

    return question;

  }


  // ==========================================================
  // MULTIPLE CHOICE
  // ==========================================================

  if (
    type === "MULTIPLE_CHOICE"
  ) {

    question.prompt =
      lines[1] || "";

    for (
      let i = 2;
      i < lines.length - 1;
      i++
    ) {

      const option =
        lines[i];

      if (
        /^[A-Z]\.\s*/i.test(
          option
        )
      ) {

        question.options.push(
          option
        );

      }

    }

    question.correctOption =
      lines[lines.length - 1]
        .trim()
        .toUpperCase();

    return question;

  }


  // ==========================================================
  // SHORT WRITE
  // ==========================================================

  if (
    type === "SHORT_WRITE"
  ) {

    question.prompt =
      lines[1] || "";

    question.acceptedKeywords =
      (lines[2] || "")
        .split("|")
        .map(answer =>
          normalizeConversationAnswer(
            answer
          )
        )
        .filter(Boolean);

    return question;

  }


  // ==========================================================
  // LONG WRITE
  // ==========================================================

  if (
    type === "LONG_WRITE"
  ) {

    question.prompt =
      lines[1] || "";

    // Long write is not automatically
    // evaluated as correct/incorrect.

    question.responseRequired =
      false;

    return question;

  }

  return question;

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

  if (
    typeof conversationSceneText !==
    "undefined"
  ) {

    conversationSceneText.textContent =
      scene.text || "";

  }

  if (
    typeof conversationSceneImage !==
    "undefined"
  ) {

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

}


// ============================================================
// GET CURRENT QUESTION
// ============================================================

function getCurrentQuestion() {

  const row =
    conversationRows[
      currentConceptIndex
    ];

  if (!row) {
    return null;
  }

  return row.questions[
    currentQuestionIndex
  ] || null;

}


// ============================================================
// SHOW QUESTION
// ============================================================

function showConversationQuestion() {

  const row =
    conversationRows[
      currentConceptIndex
    ];

  if (!row) {

    finishConversation();

    return;

  }

  // If we've reached the end of this concept,
  // move to the next concept.

  if (
    currentQuestionIndex >=
    row.questions.length
  ) {

    currentConceptIndex++;

    currentQuestionIndex = 0;

    showConversationQuestion();

    return;

  }

  const question =
    row.questions[
      currentQuestionIndex
    ];

  conversationAttempts = 0;

  clearConversationResponseAreas();

  conversationFeedback.textContent =
    "";

  conversationFeedback.className =
    "conversation-feedback";

  conversationNextBtn.classList.add(
    "hidden"
  );

  conversationEndBtn.classList.remove(
    "hidden"
  );


  // ----------------------------------------------------------
  // PROGRESS
  // ----------------------------------------------------------

  conversationProgress.textContent =
    `Concept ${
      currentConceptIndex + 1
    } of ${
      conversationRows.length
    } • Question ${
      currentQuestionIndex + 1
    } of ${
      row.questions.length
    }`;


  // ----------------------------------------------------------
  // STATEMENT
  // ----------------------------------------------------------

  if (
    typeof conversationSceneText !==
    "undefined"
  ) {

    conversationSceneText.textContent =
      row.statement || "";

  }


  // ----------------------------------------------------------
  // PROMPT
  // ----------------------------------------------------------

  conversationPrompt.textContent =
    question.prompt || "";


  // ----------------------------------------------------------
  // SPEAK PROMPT
  // ----------------------------------------------------------

  playSpanishText(
    question.prompt
  );


  // ----------------------------------------------------------
  // QUESTION TYPE
  // ----------------------------------------------------------

  switch (
    question.type
  ) {

    case "YES_NO":

      showYesNo(
        question
      );

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

      showWriting(
        question
      );

      break;


    case "LONG_WRITE":

      showLongWriting(
        question
      );

      break;


    default:

      conversationFeedback.textContent =
        `⚠️ Unknown question type: ${
          question.type
        }`;

  }

}


// ============================================================
// CLEAR RESPONSE AREAS
// ============================================================

function clearConversationResponseAreas() {

  if (
    typeof conversationYesNo !==
    "undefined"
  ) {

    conversationYesNo.classList.add(
      "hidden"
    );

  }

  if (
    typeof conversationChoices !==
    "undefined"
  ) {

    conversationChoices.classList.add(
      "hidden"
    );

    conversationChoices.innerHTML =
      "";

  }

  if (
    typeof conversationWriting !==
    "undefined"
  ) {

    conversationWriting.classList.add(
      "hidden"
    );

  }

  if (
    typeof conversationSpeaking !==
    "undefined"
  ) {

    conversationSpeaking.classList.add(
      "hidden"
    );

  }

  if (
    typeof conversationWritingInput !==
    "undefined"
  ) {

    conversationWritingInput.value =
      "";

    conversationWritingInput.disabled =
      false;

  }

  if (
    typeof conversationSubmitWriting !==
    "undefined"
  ) {

    conversationSubmitWriting.disabled =
      false;

  }

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
//
// This uses the same existing answer-button area.
// The two choices are extracted from the prompt.
//
// Example:
// ¿Había un chico o una chica?
//
// Creates:
// [un chico] [una chica]
// ============================================================

function showEitherOr(question) {

  conversationYesNo.classList.remove(
    "hidden"
  );

  const buttons =
    conversationYesNo
      .querySelectorAll(
        ".conversation-answer-btn"
      );

  const choices =
    extractEitherOrChoices(
      question.prompt
    );


  if (
    choices.length !== 2
  ) {

    conversationFeedback.textContent =
      "⚠️ Could not determine the two choices.";

    conversationFeedback.className =
      "conversation-feedback error";

    return;

  }


  buttons.forEach(
    (button, index) => {

      if (
        !choices[index]
      ) {

        button.classList.add(
          "hidden"
        );

        return;

      }

      button.classList.remove(
        "hidden"
      );

      button.disabled =
        false;

      button.textContent =
        choices[index];

      button.dataset.answer =
        choices[index];

      button.onclick =
        () => {

          checkConversationAnswer(
            choices[index]
          );

        };

    }
  );

}


// ============================================================
// EXTRACT EITHER / OR CHOICES
// ============================================================

function extractEitherOrChoices(
  prompt
) {

  const normalized =
    String(prompt)
      .replace(
        /[¿?]/g,
        ""
      )
      .trim();

  const match =
    normalized.match(
      /^(.+?)\s+o\s+(.+?)(?:\s+.*)?$/i
    );

  if (!match) {
    return [];
  }

  let first =
    match[1].trim();

  let second =
    match[2].trim();

  // Remove leading question material
  // when the "o" occurs inside the actual
  // two choices.

  const firstWords =
    first.split(/\s+/);

  const secondWords =
    second.split(/\s+/);

  // In questions such as:
  // "¿Era George o Robert el chico?"
  //
  // We want:
  // George
  // Robert

  if (
    firstWords.length > 1
  ) {

    first =
      firstWords[
        firstWords.length - 1
      ];

  }

  if (
    secondWords.length > 1
  ) {

    second =
      secondWords[0];

  }

  return [
    first,
    second
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
              ? match[1]
                  .toUpperCase()
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
// SHORT WRITE
// ============================================================

function showWriting() {

  conversationWriting.classList.remove(
    "hidden"
  );

  conversationWritingInput.focus();

}


// ============================================================
// LONG WRITE
// ============================================================

function showLongWriting() {

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

  const row =
    conversationRows[
      currentConceptIndex
    ];

  const question =
    getCurrentQuestion();

  if (
    !row ||
    !question
  ) {

    return;

  }

  conversationAttempts++;


  // ==========================================================
  // RECORD ATTEMPT
  // ==========================================================

  recordQuestionAttempt(
    question,
    studentAnswer
  );


  // ==========================================================
  // LONG WRITE
  //
  // Always advances. Teacher reviews later.
  // ==========================================================

  if (
    question.type ===
    "LONG_WRITE"
  ) {

    conversationFeedback.textContent =
      "Respuesta guardada ✓";

    conversationFeedback.className =
      "conversation-feedback correct";

    disableCurrentConversationResponse();

    conversationNextBtn.classList.remove(
      "hidden"
    );

    return;

  }


  // ==========================================================
  // DETERMINE CORRECTNESS
  // ==========================================================

  let correct =
    false;


  // ----------------------------------------------------------
  // MULTIPLE CHOICE
  // ----------------------------------------------------------

  if (
    question.type ===
    "MULTIPLE_CHOICE"
  ) {

    correct =
      normalizeConversationAnswer(
        studentAnswer
      ) ===
      normalizeConversationAnswer(
        question.correctOption
      );

  }


  // ----------------------------------------------------------
  // YES / NO
  // ----------------------------------------------------------

  else if (
    question.type ===
    "YES_NO"
  ) {

    correct =
      normalizeConversationAnswer(
        studentAnswer
      ) ===
      normalizeConversationAnswer(
        question.answer
      );

  }


  // ----------------------------------------------------------
  // EITHER / OR
  // ----------------------------------------------------------

  else if (
    question.type ===
    "EITHER_OR"
  ) {

    correct =
      normalizeConversationAnswer(
        studentAnswer
      ) ===
      normalizeConversationAnswer(
        question.answer
      );

  }


  // ----------------------------------------------------------
  // SHORT WRITE
  // ----------------------------------------------------------

  else if (
    question.type ===
    "SHORT_WRITE"
  ) {

    correct =
      evaluateShortWrite(
        studentAnswer,
        question.acceptedKeywords
      );

  }


  // ==========================================================
  // CORRECT
  // ==========================================================

  if (correct) {

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


  // ==========================================================
  // INCORRECT
  //
  // The student does NOT move forward.
  // The current concept restarts from Q1.
  // ==========================================================

  conversationFeedback.textContent =
    "No exactamente. Vamos a repetir esta idea.";

  conversationFeedback.className =
    "conversation-feedback incorrect";


  // Give the student a moment to see
  // the feedback before resetting.

  setTimeout(
    () => {

      currentQuestionIndex = 0;

      conversationAttempts = 0;

      showConversationQuestion();

    },
    900
  );

}


// ============================================================
// SHORT WRITE EVALUATION
// ============================================================
//
// Spreadsheet answer:
//
// George | el chico | el chico era George
//
// Any accepted target that appears in the
// student's normalized response is accepted.
//
// This intentionally ignores:
// - capitalization
// - accents
// - punctuation
// - extra spaces
//
// ============================================================

function evaluateShortWrite(
  studentAnswer,
  acceptedKeywords
) {

  const student =
    normalizeConversationAnswer(
      studentAnswer
    );

  if (!student) {
    return false;
  }

  return acceptedKeywords.some(
    keyword => {

      if (!keyword) {
        return false;
      }

      return student.includes(
        keyword
      );

    }
  );

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
      /[¿?¡!.,;:"']/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    );

}


// ============================================================
// RECORD QUESTION ATTEMPT
// ============================================================

function recordQuestionAttempt(
  question,
  studentAnswer
) {

  const row =
    conversationRows[
      currentConceptIndex
    ];

  const existing =
    conversationReport.find(
      item =>
        item.conceptIndex ===
          currentConceptIndex &&
        item.questionIndex ===
          currentQuestionIndex
    );


  if (existing) {

    existing.attempts++;

    if (
      question.type ===
      "SHORT_WRITE"
    ) {

      existing.responses.push(
        {
          text:
            studentAnswer,
          accepted:
            false
        }
      );

    }

    if (
      question.type ===
      "LONG_WRITE"
    ) {

      existing.responses.push(
        {
          text:
            studentAnswer,
          accepted:
            false
        }
      );

    }

    return;

  }


  conversationReport.push({

    conceptIndex:
      currentConceptIndex,

    questionIndex:
      currentQuestionIndex,

    questionNumber:
      currentQuestionIndex + 1,

    type:
      question.type,

    prompt:
      question.prompt,

    attempts:
      1,

    responses:
      question.type === "SHORT_WRITE" ||
      question.type === "LONG_WRITE"
        ? [
            {
              text:
                studentAnswer,
              accepted:
                false
            }
          ]
        : []

  });

}


// ============================================================
// DISABLE RESPONSE
// ============================================================

function disableCurrentConversationResponse() {

  if (
    typeof conversationYesNo !==
    "undefined"
  ) {

    conversationYesNo
      .querySelectorAll(
        "button"
      )
      .forEach(button => {

        button.disabled =
          true;

      });

  }

  if (
    typeof conversationChoices !==
    "undefined"
  ) {

    conversationChoices
      .querySelectorAll(
        "button"
      )
      .forEach(button => {

        button.disabled =
          true;

      });

  }

  if (
    typeof conversationWritingInput !==
    "undefined"
  ) {

    conversationWritingInput.disabled =
      true;

  }

  if (
    typeof conversationSubmitWriting !==
    "undefined"
  ) {

    conversationSubmitWriting.disabled =
      true;

  }

}


// ============================================================
// NEXT QUESTION
// ============================================================

conversationNextBtn.addEventListener(
  "click",
  () => {

    const row =
      conversationRows[
        currentConceptIndex
      ];

    if (!row) {

      finishConversation();

      return;

    }

    currentQuestionIndex++;

    // End of concept:
    // move to next row.

    if (
      currentQuestionIndex >=
      row.questions.length
    ) {

      currentConceptIndex++;

      currentQuestionIndex = 0;

    }

    showConversationQuestion();

  }
);


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


// ============================================================
// ENTER KEY
// ============================================================

conversationWritingInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      // Long write should allow
      // line breaks, so Enter should
      // NOT submit it.

      const question =
        getCurrentQuestion();

      if (
        question &&
        question.type ===
          "LONG_WRITE"
      ) {

        return;

      }

      conversationSubmitWriting.click();

    }

  }
);


// ============================================================
// TEXT TO SPEECH
// ============================================================

function playSpanishText(text) {

  if (
    !text ||
    !(
      "speechSynthesis"
      in window
    )
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
      getCurrentQuestion();

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

  renderConversationReport();

}


// ============================================================
// TEACHER REPORT
// ============================================================

function renderConversationReport() {

  const report =
    document.createElement(
      "div"
    );

  report.className =
    "conversation-report";

  const heading =
    document.createElement(
      "h2"
    );

  heading.textContent =
    "Teacher Report";

  report.appendChild(
    heading
  );


  // ==========================================================
  // TABLE
  // ==========================================================

  const table =
    document.createElement(
      "table"
    );

  table.className =
    "conversation-report-table";


  const thead =
    document.createElement(
      "thead"
    );

  const headerRow =
    document.createElement(
      "tr"
    );

  [
    "Question",
    "Type",
    "Attempts",
    "Short Write Responses"
  ]
    .forEach(
      headingText => {

        const th =
          document.createElement(
            "th"
          );

        th.textContent =
          headingText;

        headerRow.appendChild(
          th
        );

      }
    );

  thead.appendChild(
    headerRow
  );

  table.appendChild(
    thead
  );


  const tbody =
    document.createElement(
      "tbody"
    );


  conversationReport.forEach(
    item => {

      const tr =
        document.createElement(
          "tr"
        );


      const questionCell =
        document.createElement(
          "td"
        );

      questionCell.textContent =
        item.questionNumber;

      tr.appendChild(
        questionCell
      );


      const typeCell =
        document.createElement(
          "td"
        );

      typeCell.textContent =
        item.type;

      tr.appendChild(
        typeCell
      );


      const attemptsCell =
        document.createElement(
          "td"
        );

      attemptsCell.textContent =
        item.attempts;

      tr.appendChild(
        attemptsCell
      );


      const responseCell =
        document.createElement(
          "td"
        );


      if (
        item.type ===
        "SHORT_WRITE"
      ) {

        item.responses.forEach(
          response => {

            const responseDiv =
              document.createElement(
                "div"
              );

            responseDiv.className =
              "conversation-report-response";

            responseDiv.textContent =
              response.text;

            responseCell.appendChild(
              responseDiv
            );

          }
        );

      } else {

        responseCell.textContent =
          "—";

      }


      tr.appendChild(
        responseCell
      );

      tbody.appendChild(
        tr
      );

    }
  );


  table.appendChild(
    tbody
  );

  report.appendChild(
    table
  );


  // ==========================================================
  // LONG WRITE RESPONSES
  // ==========================================================

  const longWrites =
    conversationReport.filter(
      item =>
        item.type ===
        "LONG_WRITE"
    );


  if (
    longWrites.length
  ) {

    const longWriteHeading =
      document.createElement(
        "h2"
      );

    longWriteHeading.textContent =
      "Long Write Responses";

    report.appendChild(
      longWriteHeading
    );


    longWrites.forEach(
      item => {

        const prompt =
          document.createElement(
            "h3"
          );

        prompt.textContent =
          item.prompt;

        report.appendChild(
          prompt
        );


        item.responses.forEach(
          response => {

            const responseBox =
              document.createElement(
                "div"
              );

            responseBox.className =
              "conversation-long-write-response";

            responseBox.textContent =
              response.text;

            report.appendChild(
              responseBox
            );

          }
        );

      }
    );

  }


  conversationPanel.appendChild(
    report
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

    conversationPanel.classList.add(
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
// END BUTTON
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
