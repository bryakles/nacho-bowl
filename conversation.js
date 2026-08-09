// ============================================================
// NACHO BOWL — CONVERSATION SELECTION
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
let conversationQuestions = [];
let currentConversationIndex = 0;
let conversationAttempts = 0;
let conversationScaffoldShown = false;


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

  // Hide the normal panels.

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

  // Show conversation selection.

  conversationSelectionPanel.classList.remove("hidden");

  // Load conversations.

  await loadConversationIndex();

}


// ------------------------------------------------------------
// LOAD GOOGLE SHEET
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
      parseConversationCSV(csv);

    // Only show active conversations.

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
// PARSE CSV
// ------------------------------------------------------------

function parseConversationCSV(csv) {

  const lines =
    csv
      .replace(/\r/g, "")
      .split("\n")
      .filter(line => line.trim() !== "");

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
        title: row["Title"] || "",
        level: row["Level"] || "",
        topic: row["Topic"] || "",
        description: row["Description"] || "",
        docURL: row["Doc URL"] || "",
        active:
          String(row["Active"])
            .toLowerCase() === "true",
        order:
          Number(row["Order"]) || 9999,
        imageURL: row["Image URL"] || ""
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

  for (let i = 0; i < line.length; i++) {

    const character = line[i];

    if (character === '"') {

      if (
        insideQuotes &&
        line[i + 1] === '"'
      ) {

        current += '"';
        i++;

      } else {

        insideQuotes = !insideQuotes;

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

    card.addEventListener("click", () => {

      selectConversation(conversation);

    });

    conversationList.appendChild(card);

  });

}


// ------------------------------------------------------------
// SELECT CONVERSATION
// ------------------------------------------------------------

function selectConversation(conversation) {

  if (!conversation.docURL) {

    conversationList.innerHTML =
      `<p class="error-msg">
        ⚠️ This conversation does not have a Google Doc URL.
      </p>`;

    return;

  }

  const docURL =
    convertGoogleDocURL(conversation.docURL);

  // Hide the conversation list.

  conversationSelectionPanel.classList.add(
    "hidden"
  );

  // Show the actual conversation.

  conversationPanel.classList.remove(
    "hidden"
  );

  // Load the selected Google Doc.

  loadConversationDocument(
    conversation,
    docURL
  );

}

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

async function loadConversationDocument(
  conversation,
  docURL
) {

  conversationList.innerHTML =
    `<p class="filter-hint">
      Loading <strong>${conversation.title}</strong>...
    </p>`;

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

    console.log(
      "Conversation document loaded."
    );

    console.log(text);

    conversationData = parseConversation(text);

    if (!conversationData.questions.length) {
    
      throw new Error(
        "No questions were found in this conversation."
      );
    
    }
    
    conversationQuestions =
      conversationData.questions;
    
    currentConversationIndex = 0;
    conversationAttempts = 0;
    conversationScaffoldShown = false;
    
    renderConversationHeader();
    renderConversationScene();
    showConversationQuestion();

  } catch (error) {

    console.error(
      "Conversation document loading error:",
      error
    );

    conversationList.innerHTML =
      `<p class="error-msg">
        ⚠️ Could not load this conversation.
      </p>`;

  }

}

function escapeHTML(text) {

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
// ------------------------------------------------------------
// BACK
// ------------------------------------------------------------

conversationSelectionBackBtn.addEventListener(
  "click",
  () => {

    conversationSelectionPanel.classList.add(
      "hidden"
    );

    if (typeof filterPanel !== "undefined") {
      filterPanel.classList.remove("hidden");
    }

  }
);

conversationEndBtn.addEventListener("click", () => {

  conversationPanel.classList.add("hidden");

  conversationSelectionPanel.classList.remove(
    "hidden"
  );

  loadConversationIndex();

});

// ------------------------------------------------------------
// PARSE CONVERSATION DOCUMENT
// ------------------------------------------------------------

function parseConversation(text) {

  const lines =
    text
      .replace(/\r/g, "")
      .split("\n");

  const conversation = {

    title: "",
    level: "",
    topic: "",

    scene: {
      imageURL: "",
      text: ""
    },

    questions: [],

    endTeacher: ""

  };

  let section = "";
  let currentQuestion = null;
  let currentField = null;
  let collectingOptions = false;
  let collectingAccepted = false;


  for (let i = 0; i < lines.length; i++) {

    const rawLine = lines[i];

    const line = rawLine.trim();

    if (!line) continue;


    // --------------------------------------------------------
    // QUESTION HEADER
    // --------------------------------------------------------

    const questionMatch =
      line.match(/^##\s*QUESTION\s+(\d+)/i);

    if (questionMatch) {

      if (currentQuestion) {
        conversation.questions.push(
          currentQuestion
        );
      }

      currentQuestion = {

        number:
          Number(questionMatch[1]),

        type: "",

        teacher: "",

        answer: "",

        options: [],

        accepted: [],

        scaffold: "",

        imageURL: ""

      };

      section = "question";

      currentField = null;

      collectingOptions = false;
      collectingAccepted = false;

      continue;

    }


    // --------------------------------------------------------
    // SCENE
    // --------------------------------------------------------

    if (/^##\s*SCENE/i.test(line)) {

      section = "scene";

      currentField = null;

      continue;

    }


    // --------------------------------------------------------
    // END
    // --------------------------------------------------------

    if (/^##\s*END/i.test(line)) {

      if (currentQuestion) {

        conversation.questions.push(
          currentQuestion
        );

        currentQuestion = null;

      }

      section = "end";

      currentField = null;

      continue;

    }


    // --------------------------------------------------------
    // TOP-LEVEL FIELDS
    // --------------------------------------------------------

    if (
      !currentQuestion &&
      section !== "scene" &&
      section !== "end"
    ) {

      const titleMatch =
        line.match(/^TITLE:\s*(.*)$/i);

      const levelMatch =
        line.match(/^LEVEL:\s*(.*)$/i);

      const topicMatch =
        line.match(/^TOPIC:\s*(.*)$/i);


      if (titleMatch) {

        conversation.title =
          titleMatch[1].trim();

        continue;

      }


      if (levelMatch) {

        conversation.level =
          levelMatch[1].trim();

        continue;

      }


      if (topicMatch) {

        conversation.topic =
          topicMatch[1].trim();

        continue;

      }

    }


    // --------------------------------------------------------
    // END TEACHER
    // --------------------------------------------------------

    if (section === "end") {

      if (/^TEACHER:/i.test(line)) {

        currentField = "endTeacher";

        continue;

      }


      if (currentField === "endTeacher") {

        conversation.endTeacher +=
          (conversation.endTeacher
            ? " "
            : "") +
          line;

      }

      continue;

    }


    // --------------------------------------------------------
    // SCENE FIELDS
    // --------------------------------------------------------

    if (section === "scene") {

      if (/^IMAGE_URL:/i.test(line)) {

        conversation.scene.imageURL =
          line
            .replace(/^IMAGE_URL:\s*/i, "")
            .trim();

        currentField = null;

        continue;

      }


      if (/^TEXT:/i.test(line)) {

        currentField = "sceneText";

        continue;

      }


      if (currentField === "sceneText") {

        conversation.scene.text +=
          (conversation.scene.text
            ? " "
            : "") +
          line;

      }

      continue;

    }


    // --------------------------------------------------------
    // QUESTION FIELDS
    // --------------------------------------------------------

    if (currentQuestion) {

      if (/^TYPE:/i.test(line)) {

        currentQuestion.type =
          line
            .replace(/^TYPE:\s*/i, "")
            .trim()
            .toUpperCase();

        currentField = null;

        collectingOptions = false;
        collectingAccepted = false;

        continue;

      }


      if (/^TEACHER:/i.test(line)) {

        currentField = "teacher";

        collectingOptions = false;
        collectingAccepted = false;

        continue;

      }


      if (/^ANSWER:/i.test(line)) {

        currentField = "answer";

        collectingOptions = false;
        collectingAccepted = false;

        continue;

      }


      if (/^OPTIONS:/i.test(line)) {

        currentField = "options";

        collectingOptions = true;
        collectingAccepted = false;

        continue;

      }


      if (/^ACCEPT:/i.test(line)) {

        currentField = "accepted";

        collectingAccepted = true;
        collectingOptions = false;

        continue;

      }


      if (/^SCAFFOLD:/i.test(line)) {

        currentField = "scaffold";

        collectingOptions = false;
        collectingAccepted = false;

        continue;

      }


      if (/^IMAGE_URL:/i.test(line)) {

        currentQuestion.imageURL =
          line
            .replace(/^IMAGE_URL:\s*/i, "")
            .trim();

        currentField = null;

        continue;

      }


      // ------------------------------------------------------
      // OPTIONS
      // ------------------------------------------------------

      if (
        collectingOptions &&
        /^[A-Z]\.\s*/.test(line)
      ) {

        currentQuestion.options.push(line);

        continue;

      }


      // ------------------------------------------------------
      // ACCEPTED ANSWERS
      // ------------------------------------------------------

      if (collectingAccepted) {

        currentQuestion.accepted.push(line);

        continue;

      }


      // ------------------------------------------------------
      // MULTI-LINE FIELDS
      // ------------------------------------------------------

      if (currentField === "teacher") {

        currentQuestion.teacher +=
          (currentQuestion.teacher
            ? " "
            : "") +
          line;

        continue;

      }


      if (currentField === "answer") {

        currentQuestion.answer +=
          (currentQuestion.answer
            ? " "
            : "") +
          line;

        continue;

      }


      if (currentField === "scaffold") {

        currentQuestion.scaffold +=
          (currentQuestion.scaffold
            ? " "
            : "") +
          line;

        continue;

      }

    }

  }


  // ----------------------------------------------------------
  // FINAL QUESTION
  // ----------------------------------------------------------

  if (currentQuestion) {

    conversation.questions.push(
      currentQuestion
    );

  }


  return conversation;

}
