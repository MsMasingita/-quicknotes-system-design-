const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadBtn = document.getElementById("load-btn");
const submitBtn = document.getElementById("submit-btn");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const statusMsg = document.getElementById("status");
const notesList = document.getElementById("notes-list");

function setStatus(text, type = "loading") {
  statusMsg.textContent = text;
  statusMsg.className = `status-msg ${type}`;
}

function clearStatus() {
  statusMsg.textContent = "";
  statusMsg.className = "status-msg";
}

function toggleButtons(disabled) {
  loadBtn.disabled = disabled;
  submitBtn.disabled = disabled;
  const deleteButtons = document.querySelectorAll(".delete-btn");
  deleteButtons.forEach((btn) => {
    btn.disabled = disabled;
  });
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

function renderNoteItem(note, prepend = false) {
  const li = document.createElement("li");
  li.className = "note-item";
  li.dataset.id = note.id;

  const contentDiv = document.createElement("div");
  contentDiv.className = "note-content";

  const titleEl = document.createElement("h3");
  titleEl.textContent = note.title;

  const bodyEl = document.createElement("p");
  bodyEl.textContent = note.body || "";

  contentDiv.appendChild(titleEl);
  contentDiv.appendChild(bodyEl);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "Delete";
  deleteBtn.type = "button";
  deleteBtn.addEventListener("click", () => handleDeleteNote(note.id, li));

  li.appendChild(contentDiv);
  li.appendChild(deleteBtn);

  if (prepend && notesList.firstChild) {
    notesList.insertBefore(li, notesList.firstChild);
  } else {
    notesList.appendChild(li);
  }
}

async function loadNotes() {
  toggleButtons(true);
  setStatus("Loading notes...", "loading");

  try {
    const notes = await request(`${API_URL}?_limit=10`);
    notesList.innerHTML = "";

    if (!notes || notes.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "empty-message";
      emptyLi.textContent = "No notes available.";
      notesList.appendChild(emptyLi);
      clearStatus();
      return;
    }

    notes.forEach((note) => renderNoteItem(note));
    setStatus("Loaded 10 notes from the server.", "success");
  } catch (err) {
    setStatus(`Failed to load notes: ${err.message}`, "error");
  } finally {
    toggleButtons(false);
  }
}

async function handleCreateNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    setStatus("A title is required.", "error");
    return;
  }

  if (title.length > 100) {
    setStatus("Title cannot exceed 100 characters.", "error");
    return;
  }

  toggleButtons(true);
  setStatus("Creating note...", "loading");

  try {
    const payload = {
      title: title,
      body: body,
      userId: 1,
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const createdNote = await response.json();

    const emptyMsg = notesList.querySelector(".empty-message");
    if (emptyMsg) {
      emptyMsg.remove();
    }

    renderNoteItem(createdNote, true);
    setStatus(`Note created (status ${response.status}, id ${createdNote.id}).`, "success");
    noteForm.reset();
  } catch (err) {
    setStatus(`Failed to create note: ${err.message}`, "error");
  } finally {
    toggleButtons(false);
  }
}

async function handleDeleteNote(id, element) {
  toggleButtons(true);
  setStatus(`Deleting note ${id}...`, "loading");

  try {
    /*
      JSONPlaceholder is a mock API and does not persist created notes (e.g. id: 101) on its server.
      Sending a DELETE to /posts/{id} mock-acknowledges the call, so we proceed with the API request
      and remove the item from the local DOM list on completion.
    */
    await request(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    element.remove();
    setStatus(`Note ${id} deleted successfully.`, "success");

    if (notesList.children.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "empty-message";
      emptyLi.textContent = "No notes available.";
      notesList.appendChild(emptyLi);
    }
  } catch (err) {
    setStatus(`Failed to delete note: ${err.message}`, "error");
  } finally {
    toggleButtons(false);
  }
}

loadBtn.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", handleCreateNote);