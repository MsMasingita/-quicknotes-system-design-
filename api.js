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

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", () => handleDeleteNote(note.id, deleteBtn));

  headerDiv.appendChild(titleEl);
  headerDiv.appendChild(deleteBtn);

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

    setStatus(`Loaded ${notes.length} notes from the server.`, "success");
  } catch (error) {
    setStatus(`Failed to load notes: ${error.message}`, "error");
  } finally {
    loadBtn.disabled = false;
  }
}

async function handleCreateNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    setStatus("Validation error: Title is required.", "error");
    titleInput.focus();
    return;
  }

  if (title.length > 100) {
    setStatus("Validation error: Title cannot exceed 100 characters.", "error");
    titleInput.focus();
    return;
  }

  submitBtn.disabled = true;
  setStatus("Creating note...", "loading");

  try {
    const payload = {
      title: title,
      body: body,
      userId: 1,
    };

    const { data: newNote, status } = await request(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(payload),
    });

    const emptyStateEl = notesList.querySelector(".empty-state");
    if (emptyStateEl) {
      notesList.innerHTML = "";
    }

    notesList.prepend(createNoteElement(newNote));
    noteForm.reset();
    setStatus(`Note created (status ${status}, id ${newNote.id}).`, "success");
  } catch (error) {
    setStatus(`Failed to create note: ${error.message}`, "error");
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleDeleteNote(noteId, buttonElement) {
  /*
   * NOTE REGARDING JSONPLACEHOLDER:
   * JSONPlaceholder is a mock REST API. It simulates HTTP responses (such as 200 OK)
   * but does not mutate a real persistent database on the backend. Newly created items
   * (e.g. ID 101) return 200 on DELETE without persisting. We still send the network request
   * and, on HTTP success, remove the corresponding DOM element from the UI.
   */
  buttonElement.disabled = true;
  setStatus(`Deleting note #${noteId}...`, "loading");

  try {
    await request(`${API_URL}/${noteId}`, {
      method: "DELETE",
    });

    const noteItem = document.getElementById(`note-${noteId}`);
    if (noteItem) {
      noteItem.remove();
    }

    if (notesList.children.length === 0) {
      renderEmptyState();
    }

    setStatus(`Note #${noteId} successfully deleted.`, "success");
  } catch (error) {
    setStatus(`Failed to delete note #${noteId}: ${error.message}`, "error");
    buttonElement.disabled = false;
  }
}

loadBtn.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", handleCreateNote);
renderEmptyState();