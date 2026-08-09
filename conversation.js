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


// ------------------------------------------------------------
// DOM REFERENCES
// ------------------------------------------------------------

const conversationBtn =
  document.getElementById("conversationBtn");

const conversationSelectionPanel =
  document.getElementById("conversationSelectionPanel");

const conversationList =
  document.getElementById("conversationList");

const conversationSelectionBackBtn =
  document.getElementById("conversationSelectionBackBtn");


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

  console.log(
    "Loading conversation:",
    conversation.title
  );

  console.log(
    "Google Doc URL:",
    docURL
  );

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

    // For now, display the raw document
    // so we can verify the connection.

    conversationList.innerHTML =
      `<pre style="
        white-space: pre-wrap;
        text-align: left;
        max-height: 600px;
        overflow-y: auto;
      ">${escapeHTML(text)}</pre>`;

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
