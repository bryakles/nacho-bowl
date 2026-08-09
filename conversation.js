// ============================================================
// NACHO BOWL — CONVERSATION ENGINE
// Version 1
// ============================================================

// ------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------

// Paste the published Google Doc URL here.
const CONVERSATION_URL =
  "https://docs.google.com/document/d/1SKtGroJi2XKavlou09asttGIvFOzoui5tSG336m2SYg/export?format=txt";


// ------------------------------------------------------------
// STATE
// ------------------------------------------------------------

let conversationData = null;
let conversationQuestions = [];
let currentConversationIndex = 0;
let conversationAttempts = 0;
let conversationScaffoldShown = false;

let conversationMediaRecorder = null;
let conversationAudioChunks = [];
let conversationAudioBlob = null;
let conversationAudioURL = null;


// ------------------------------------------------------------
// DOM REFERENCES
// ------------------------------------------------------------

const conversationPanel =
  document.getElementById("conversationPanel");

const conversationTitle =
  document.getElementById("conversationTitle");

const conversationLevel =
  document.getElementById("conversationLevel");

const conversationProgress =
  document.getElementById("conversationProgress");

const conversationScene =
  document.getElementById("conversationScene");

const conversationSceneImage =
  document.getElementById("conversationSceneImage");

const conversationSceneText =
  document.getElementById("conversationSceneText");

const conversationPrompt =
  document.getElementById("conversationPrompt");

const conversationReplayBtn =
  document.getElementById("conversationReplayBtn");

const conversationYesNo =
  document.getElementById("conversationYesNo");

const conversationChoices =
  document.getElementById("conversationChoices");

const conversationWriting =
  document.getElementById("conversationWriting");

const conversationWritingInput =
  document.getElementById("conversationWritingInput");

const conversationSubmitWriting =
  document.getElementById("conversationSubmitWriting");

const conversationSpeaking =
  document.getElementById("conversationSpeaking");

const conversationRecordBtn =
  document.getElementById("conversationRecordBtn");

const conversationStopBtn =
  document.getElementById("conversationStopBtn");

const conversationAudioPlayback =
  document.getElementById("conversationAudioPlayback");

const conversationRecordingActions =
  document.getElementById("conversationRecordingActions");

const conversationRecordAgainBtn =
  document.getElementById("conversationRecordAgainBtn");

const conversationDownloadBtn =
  document.getElementById("conversationDownloadBtn");

const conversationFeedback =
  document.getElementById("conversationFeedback");

const conversationScaffold =
  document.getElementById("conversationScaffold");

const conversationScaffoldText =
  document.getElementById("conversationScaffoldText");

const conversationNextBtn =
  document.getElementById("conversationNextBtn");

const conversationEndBtn =
  document.getElementById("conversationEndBtn");


// ------------------------------------------------------------
// START CONVERSATION
// ------------------------------------------------------------

async function startConversation() {

  try {

    conversationPanel.classList.remove("hidden");

    // Hide other panels.
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

    showConversationLoading();

    const response = await fetch(CONVERSATION_URL);

    if (!response.ok) {
      throw new Error(
        `Could not load conversation (${response.status})`
      );
    }

    const text = await response.text();

    conversationData = parseConversation(text);

    if (!conversationData.questions.length) {
      throw new Error("No questions found in conversation.");
    }

    conversationQuestions = conversationData.questions;
    currentConversationIndex = 0;
    conversationAttempts = 0;
    conversationScaffoldShown = false;

    renderConversationHeader();
    renderConversationScene();

    showConversationQuestion();

  } catch (error) {

    console.error("Conversation loading error:", error);

    conversationFeedback.textContent =
      "⚠️ Could not load the conversation.";

    conversationFeedback.className =
      "conversation-feedback error";

  }

}


// ------------------------------------------------------------
// PARSER
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

    // ------------------------------------------
    // QUESTION HEADER
    // ------------------------------------------

    const questionMatch =
      line.match(/^##\s*QUESTION\s+(\d+)/i);

    if (questionMatch) {

      if (currentQuestion) {
        conversation.questions.push(currentQuestion);
      }

      currentQuestion = {
        number: Number(questionMatch[1]),
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

    // ------------------------------------------
    // SCENE
    // ------------------------------------------

    if (/^##\s*SCENE/i.test(line)) {

      section = "scene";
      currentField = null;
      continue;
    }

    // ------------------------------------------
    // END
    // ------------------------------------------

    if (/^##\s*END/i.test(line)) {

      if (currentQuestion) {
        conversation.questions.push(currentQuestion);
        currentQuestion = null;
      }

      section = "end";
      currentField = null;
      continue;
    }

    // ------------------------------------------
    // TOP-LEVEL FIELDS
    // ------------------------------------------

    if (!currentQuestion && section !== "scene" && section !== "end") {

      const titleMatch = line.match(/^TITLE:\s*(.*)$/i);
      const levelMatch = line.match(/^LEVEL:\s*(.*)$/i);
      const topicMatch = line.match(/^TOPIC:\s*(.*)$/i);

      if (titleMatch) {
        conversation.title = titleMatch[1].trim();
        continue;
      }

      if (levelMatch) {
        conversation.level = levelMatch[1].trim();
        continue;
      }

      if (topicMatch) {
        conversation.topic = topicMatch[1].trim();
        continue;
      }
    }

    // ------------------------------------------
    // END TEACHER
    // ------------------------------------------

    if (section === "end") {

      if (/^TEACHER:/i.test(line)) {
        currentField = "endTeacher";
        continue;
      }

      if (currentField === "endTeacher") {
        conversation.endTeacher +=
          (conversation.endTeacher ? " " : "") +
          line;
      }

      continue;
    }

    // ------------------------------------------
    // SCENE FIELDS
    // ------------------------------------------

    if (section === "scene") {

      if (/^IMAGE_URL:/i.test(line)) {
        conversation.scene.imageURL =
          line.replace(/^IMAGE_URL:\s*/i, "").trim();
        currentField = null;
        continue;
      }

      if (/^TEXT:/i.test(line)) {
        currentField = "sceneText";
        continue;
      }

      if (currentField === "sceneText") {
        conversation.scene.text +=
          (conversation.scene.text ? " " : "") +
          line;
      }

      continue;
    }

    // ------------------------------------------
    // QUESTION FIELDS
    // ------------------------------------------

    if (currentQuestion) {

      if (/^TYPE:/i.test(line)) {

        currentQuestion.type =
          line.replace(/^TYPE:\s*/i, "")
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
          line.replace(/^IMAGE_URL:\s*/i, "")
            .trim();

        currentField = null;

        continue;
      }

      // ----------------------------------------
      // OPTIONS
      // ----------------------------------------

      if (
        collectingOptions &&
        /^[A-Z]\.\s*/.test(line)
      ) {

        currentQuestion.options.push(line);

        continue;
      }

      // ----------------------------------------
      // ACCEPTED ANSWERS
      // ----------------------------------------

      if (collectingAccepted) {

        currentQuestion.accepted.push(line);

        continue;
      }

      // ----------------------------------------
      // MULTI-LINE FIELDS
      // ----------------------------------------

      if (currentField === "teacher") {

        currentQuestion.teacher +=
          (currentQuestion.teacher ? " " : "") +
          line;

        continue;
      }

      if (currentField === "answer") {

        currentQuestion.answer +=
          (currentQuestion.answer ? " " : "") +
          line;

        continue;
      }

      if (currentField === "scaffold") {

        currentQuestion.scaffold +=
          (currentQuestion.scaffold ? " " : "") +
          line;

        continue;
      }
    }
  }

  // Add final question.
  if (currentQuestion) {
    conversation.questions.push(currentQuestion);
  }

  return conversation;
}


// ------------------------------------------------------------
// HEADER
// ------------------------------------------------------------

function renderConversationHeader() {

  conversationTitle.textContent =
    conversationData.title || "Conversation";

  conversationLevel.textContent =
    conversationData.level
      ? `Level ${conversationData.level}`
      : "";

}


// ------------------------------------------------------------
// SCENE
// ------------------------------------------------------------

function renderConversationScene() {

  const scene = conversationData.scene;

  conversationSceneText.textContent =
    scene.text || "";

  if (scene.imageURL) {

    conversationSceneImage.src =
      scene.imageURL;

    conversationSceneImage.alt =
      conversationData.title || "Scene";

    conversationSceneImage.classList.remove("hidden");

  } else {

    conversationSceneImage.classList.add("hidden");

  }

}


// ------------------------------------------------------------
// QUESTION DISPLAY
// ------------------------------------------------------------

function showConversationQuestion() {

  const question =
    conversationQuestions[currentConversationIndex];

  if (!question) {
    finishConversation();
    return;
  }

  conversationAttempts = 0;
  conversationScaffoldShown = false;

  conversationFeedback.textContent = "";
  conversationFeedback.className =
    "conversation-feedback";

  conversationScaffold.classList.add("hidden");
  conversationNextBtn.classList.add("hidden");

  clearConversationResponseAreas();

  conversationProgress.textContent =
    `Question ${currentConversationIndex + 1} of ${conversationQuestions.length}`;

  conversationPrompt.textContent =
    question.teacher;

  if (question.imageURL) {

    conversationSceneImage.src =
      question.imageURL;

    conversationSceneImage.alt =
      "Question image";

    conversationSceneImage.classList.remove("hidden");

  } else {

    renderConversationScene();

  }

  playSpanishText(question.teacher);

  switch (question.type) {

    case "YES_NO":
      showYesNo();
      break;

    case "MULTIPLE_CHOICE":
      showMultipleChoice(question);
      break;

    case "SHORT_WRITE":
    case "LONG_WRITE":
      showWriting(question);
      break;

    case "SHORT_SPEAK":
    case "LONG_SPEAK":
      showSpeaking();
      break;

    default:

      conversationFeedback.textContent =
        `⚠️ Unknown question type: ${question.type}`;

  }

}


// ------------------------------------------------------------
// CLEAR RESPONSE AREAS
// ------------------------------------------------------------

function clearConversationResponseAreas() {

  conversationYesNo.classList.add("hidden");
  conversationChoices.classList.add("hidden");
  conversationWriting.classList.add("hidden");
  conversationSpeaking.classList.add("hidden");

  conversationWritingInput.value = "";

  conversationAudioPlayback.classList.add("hidden");
  conversationRecordingActions.classList.add("hidden");

  conversationAudioPlayback.removeAttribute("src");

  if (conversationAudioURL) {
    URL.revokeObjectURL(conversationAudioURL);
    conversationAudioURL = null;
  }

  conversationAudioBlob = null;

}


// ------------------------------------------------------------
// YES / NO
// ------------------------------------------------------------

function showYesNo() {

  conversationYesNo.classList.remove("hidden");

  conversationYesNo
    .querySelectorAll(".conversation-answer-btn")
    .forEach(button => {

      button.onclick = () => {

        checkConversationAnswer(
          button.dataset.answer
        );

      };

    });

}


// ------------------------------------------------------------
// MULTIPLE CHOICE
// ------------------------------------------------------------

function showMultipleChoice(question) {

  conversationChoices.innerHTML = "";

  question.options.forEach(option => {

    const button =
      document.createElement("button");

    button.className =
      "btn btn-primary conversation-choice-btn";

    button.textContent = option;

    button.addEventListener("click", () => {

      checkConversationAnswer(option);

    });

    conversationChoices.appendChild(button);

  });

  conversationChoices.classList.remove("hidden");

}


// ------------------------------------------------------------
// WRITING
// ------------------------------------------------------------

function showWriting() {

  conversationWriting.classList.remove("hidden");

  conversationWritingInput.focus();

}


// ------------------------------------------------------------
// SPEAKING
// ------------------------------------------------------------

function showSpeaking() {

  conversationSpeaking.classList.remove("hidden");

}


// ------------------------------------------------------------
// CHECK ANSWER
// ------------------------------------------------------------

function checkConversationAnswer(studentAnswer) {

  const question =
    conversationQuestions[currentConversationIndex];

  const normalizedStudent =
    normalizeConversationAnswer(studentAnswer);

  const acceptedAnswers = [
    question.answer,
    ...question.accepted
  ]
    .filter(Boolean)
    .map(normalizeConversationAnswer);

  const correct =
    acceptedAnswers.includes(normalizedStudent);

  if (correct) {

    conversationFeedback.textContent =
      "¡Muy bien! ✓";

    conversationFeedback.className =
      "conversation-feedback correct";

    disableCurrentConversationResponse();

    conversationNextBtn.classList.remove("hidden");

    return;
  }

  handleConversationWrongAnswer(question);

}


// ------------------------------------------------------------
// WRONG ANSWER
// ------------------------------------------------------------

function handleConversationWrongAnswer(question) {

  conversationAttempts++;

  conversationFeedback.textContent =
    "No exactamente. Inténtalo otra vez.";

  conversationFeedback.className =
    "conversation-feedback incorrect";

  if (
    conversationAttempts >= 2 &&
    question.scaffold &&
    !conversationScaffoldShown
  ) {

    conversationScaffoldText.textContent =
      question.scaffold;

    conversationScaffold.classList.remove("hidden");

    conversationScaffoldShown = true;

    playSpanishText(question.scaffold);

  }

}


// ------------------------------------------------------------
// NORMALIZE ANSWERS
// ------------------------------------------------------------

function normalizeConversationAnswer(value) {

  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:"]/g, "")
    .replace(/\s+/g, " ");

}


// ------------------------------------------------------------
// DISABLE RESPONSE
// ------------------------------------------------------------

function disableCurrentConversationResponse() {

  conversationYesNo
    .querySelectorAll("button")
    .forEach(button => {
      button.disabled = true;
    });

  conversationChoices
    .querySelectorAll("button")
    .forEach(button => {
      button.disabled = true;
    });

  conversationWritingInput.disabled = true;

  conversationSubmitWriting.disabled = true;

}


// ------------------------------------------------------------
// NEXT QUESTION
// ------------------------------------------------------------

conversationNextBtn.addEventListener("click", () => {

  currentConversationIndex++;

  showConversationQuestion();

});


// ------------------------------------------------------------
// WRITTEN RESPONSE
// ------------------------------------------------------------

conversationSubmitWriting.addEventListener("click", () => {

  const answer =
    conversationWritingInput.value.trim();

  if (!answer) return;

  checkConversationAnswer(answer);

});

conversationWritingInput.addEventListener("keydown", event => {

  if (
    event.key === "Enter" &&
    !event.shiftKey
  ) {

    event.preventDefault();

    conversationSubmitWriting.click();

  }

});


// ------------------------------------------------------------
// TEXT TO SPEECH
// ------------------------------------------------------------

function playSpanishText(text) {

  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.lang = "es-ES";
  utterance.rate = 0.9;

  window.speechSynthesis.speak(utterance);

}


conversationReplayBtn.addEventListener("click", () => {

  const question =
    conversationQuestions[currentConversationIndex];

  if (question) {
    playSpanishText(question.teacher);
  }

});


// ------------------------------------------------------------
// RECORDING
// ------------------------------------------------------------

conversationRecordBtn.addEventListener("click", async () => {

  try {

    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: true
      });

    conversationAudioChunks = [];

    conversationMediaRecorder =
      new MediaRecorder(stream);

    conversationMediaRecorder.ondataavailable =
      event => {

        if (event.data.size > 0) {
          conversationAudioChunks.push(event.data);
        }

      };

    conversationMediaRecorder.onstop = () => {

      conversationAudioBlob =
        new Blob(
          conversationAudioChunks,
          { type: "audio/webm" }
        );

      conversationAudioURL =
        URL.createObjectURL(
          conversationAudioBlob
        );

      conversationAudioPlayback.src =
        conversationAudioURL;

      conversationAudioPlayback.classList.remove(
        "hidden"
      );

      conversationRecordingActions.classList.remove(
        "hidden"
      );

      conversationMediaRecorder.stream
        .getTracks()
        .forEach(track => track.stop());

    };

    conversationMediaRecorder.start();

    conversationRecordBtn.classList.add("hidden");
    conversationStopBtn.classList.remove("hidden");

  } catch (error) {

    console.error("Microphone error:", error);

    conversationFeedback.textContent =
      "⚠️ Microphone access was not available.";

    conversationFeedback.className =
      "conversation-feedback error";

  }

});


conversationStopBtn.addEventListener("click", () => {

  if (
    conversationMediaRecorder &&
    conversationMediaRecorder.state !== "inactive"
  ) {

    conversationMediaRecorder.stop();

  }

  conversationStopBtn.classList.add("hidden");
  conversationRecordBtn.classList.remove("hidden");

});


conversationRecordAgainBtn.addEventListener("click", () => {

  conversationAudioBlob = null;

  conversationAudioPlayback.classList.add(
    "hidden"
  );

  conversationRecordingActions.classList.add(
    "hidden"
  );

});


conversationDownloadBtn.addEventListener("click", () => {

  if (!conversationAudioBlob) return;

  const title =
    conversationData.title
      .replace(/[^a-z0-9áéíóúüñ]+/gi, "_")
      .replace(/^_|_$/g, "");

  const questionNumber =
    currentConversationIndex + 1;

  const filename =
    `NachoBowl_${title}_Question${questionNumber}.webm`;

  const link =
    document.createElement("a");

  link.href =
    conversationAudioURL;

  link.download =
    filename;

  document.body.appendChild(link);

  link.click();

  link.remove();

});


// ------------------------------------------------------------
// SPEAKING → NEXT
// ------------------------------------------------------------

conversationSpeaking.addEventListener("click", event => {

  if (
    event.target === conversationDownloadBtn ||
    event.target === conversationRecordAgainBtn ||
    event.target === conversationRecordBtn ||
    event.target === conversationStopBtn
  ) {
    return;
  }

});


// ------------------------------------------------------------
// FINISH
// ------------------------------------------------------------

function finishConversation() {

  clearConversationResponseAreas();

  conversationPrompt.textContent =
    conversationData.endTeacher ||
    "¡Muy bien! Has terminado la conversación.";

  conversationFeedback.textContent =
    "🎉 ¡Conversación completada!";

  conversationFeedback.className =
    "conversation-feedback correct";

  conversationNextBtn.classList.add("hidden");

  conversationEndBtn.classList.remove("hidden");

}


// ------------------------------------------------------------
// LOADING
// ------------------------------------------------------------

function showConversationLoading() {

  conversationPrompt.textContent =
    "Cargando conversación...";

  conversationSceneText.textContent = "";

  conversationFeedback.textContent = "";

}
