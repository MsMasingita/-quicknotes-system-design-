const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadBtn = document.getElementById("load-btn");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const notesList = document.getElementById("notes-list");

function setStatus(message, type) {
  if (!message) {
    statusEl.textContent = "";
    statusEl.className = "";
    statusEl.classList.remove("active");
    return;
  }
  statusEl.textContent = message;
  statusEl.className = `active ${type}`;
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  if (response.status === 204) {
    return { data: null, status: response.status };
  }
  const data = await response.json();
  return { data, status: response.status };
}

function renderEmptyState() {
  notesList.innerHTML = "";
  const emptyItem = document.createElement("li");
  emptyItem.className = "empty-state";
  emptyItem.textContent = "No notes available. Click 'Load notes' or create one above.";
  notesList.appendChild(emptyItem);
}

function createNoteElement(note) {
  const li = document.createElement("li");
  li.className = "note-item";
  li.id = `note-${note.id}`;

  const headerDiv = document.createElement("div");
  headerDiv.className = "note-header";

  const titleEl = document.createElement("h3");
  titleEl.className = "note-title";
  titleEl.textContent = note.title;

  headerDiv.appendChild(titleEl);

  const bodyEl = document.createElement("p");
  bodyEl.className = "note-body";
  bodyEl.textContent = note.body || "";

  li.appendChild(headerDiv);
  li.appendChild(bodyEl);
  return li;
}

async function loadNotes() {
  loadBtn.disabled = true;
  setStatus("Loading notes...", "loading");

  try {
    const { data: notes } = await request(`${API_URL}?_limit=10`);
    notesList.innerHTML = "";

    if (!notes || notes.length === 0) {
      renderEmptyState();
      setStatus("No notes found on server.", "success");
      return;
    }

    notes.forEach((note) => {
      notesList.appendChild(createNoteElement(note));
    });

    setStatus("Loaded 10 notes from the server.", "success");
  } catch (error) {
    setStatus(`Failed to load notes: ${error.message}`, "error");
  } finally {
    loadBtn.disabled = false;
  }
}

loadBtn.addEventListener("click", loadNotes);
renderEmptyState();