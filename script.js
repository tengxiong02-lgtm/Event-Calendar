const LOCAL_USER_KEY = "fresnoEventsUserId";

function getOrCreateUserId() {
  let userId = localStorage.getItem(LOCAL_USER_KEY);

  if (!userId) {
    userId = "user_" + crypto.randomUUID();
    localStorage.setItem(LOCAL_USER_KEY, userId);
  }

  return userId;
}

const localUserId = getOrCreateUserId();
const SAVED_EVENTS_KEY = `savedEvents_${localUserId}`;

function getSavedEvents() {
  return JSON.parse(localStorage.getItem(SAVED_EVENTS_KEY)) || [];
}

function saveEvent(eventId) {
  const savedEvents = getSavedEvents();

  if (!savedEvents.includes(eventId)) {
    savedEvents.push(eventId);
    localStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(savedEvents));
  }
}

function removeSavedEvent(eventId) {
  const savedEvents = getSavedEvents().filter((id) => id !== eventId);
  localStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(savedEvents));
}

function isEventSaved(eventId) {
  return getSavedEvents().includes(eventId);
}

document.addEventListener("DOMContentLoaded", () => {
  loadEvents();
  setupModalClose();
  setupCalendarToggle();
});

async function loadEvents() {
  try {
    const response = await fetch("events.json");

    if (!response.ok) {
      throw new Error("Could not load events.json");
    }

    const events = await response.json();

    clearColumns();

    if (!Array.isArray(events) || events.length === 0) {
      showEmptyMessages();
      return;
    }

    const today = getTodayDateOnly();

    events.forEach((event) => {
      const eventDate = new Date(event.date + "T00:00:00");
      const card = createEventCard(event);

      if (isSameDate(eventDate, today)) {
        document.getElementById("current-events").appendChild(card);
      } else if (eventDate > today) {
        document.getElementById("future-events").appendChild(card);
      } else {
        document.getElementById("past-events").appendChild(card);
      }
    });

    showEmptyMessages();
  } catch (error) {
    console.error(error);
    showLoadError();
  }
}

function createEventCard(event) {
  const card = document.createElement("article");
  card.className = "event-card";

  const saved = isEventSaved(event.id);

  card.innerHTML = `
    <div class="event-content">
      <p class="event-type">${event.eventType || "Other"}</p>
      <h3>${event.title}</h3>

      <div class="event-actions">
        <button class="details-btn" type="button">View Details</button>
        <button class="save-btn" type="button">
          ${saved ? "Remove from My Calendar" : "Add to My Calendar"}
        </button>
      </div>
    </div>
  `;

  card.querySelector(".details-btn").addEventListener("click", () => {
    openEventModal(event);
  });

  card.querySelector(".save-btn").addEventListener("click", () => {
    if (isEventSaved(event.id)) {
      removeSavedEvent(event.id);
    } else {
      saveEvent(event.id);
    }

    loadEvents();
  });

  return card;
}

function openEventModal(event) {
  document.getElementById("modal-image").src = event.image;
  document.getElementById("modal-image").alt = event.title;
  document.getElementById("modal-type").textContent = event.eventType || "Event";
  document.getElementById("modal-title").textContent = event.title;
  document.getElementById("modal-date").textContent = formatDate(event.date);
  document.getElementById("modal-time").textContent = `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;
  document.getElementById("modal-location").textContent = event.location;
  document.getElementById("modal-host").textContent = event.host;
  document.getElementById("modal-importance").textContent = event.importance || "Normal";
  document.getElementById("modal-description").textContent = event.description;

  document.getElementById("event-modal").classList.remove("hidden");
}

function setupModalClose() {
  const modal = document.getElementById("event-modal");
  const closeBtn = document.getElementById("close-modal");

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.add("hidden");
    }
  });
}

function setupCalendarToggle() {
  const calendarToggle = document.getElementById("calendar-toggle");
  const calendarSection = document.getElementById("calendar-section");
  const closeCalendar = document.getElementById("close-calendar");

  calendarToggle.addEventListener("click", () => {
    renderSavedEventsCalendar();
    calendarSection.classList.remove("hidden");
  });

  closeCalendar.addEventListener("click", () => {
    calendarSection.classList.add("hidden");
  });
}

async function renderSavedEventsCalendar() {
  const calendarEvents = document.getElementById("calendar-events");
  const savedEventIds = getSavedEvents();

  calendarEvents.innerHTML = "";

  if (savedEventIds.length === 0) {
    calendarEvents.innerHTML = `<p class="empty-message">No saved events yet.</p>`;
    return;
  }

  const response = await fetch("events.json");
  const events = await response.json();

  const savedEvents = events.filter((event) => savedEventIds.includes(event.id));

  savedEvents.forEach((event) => {
    const eventItem = document.createElement("article");
    eventItem.className = "calendar-event";

    eventItem.innerHTML = `
      <h3>${event.title}</h3>
      <p><strong>Date:</strong> ${formatDate(event.date)}</p>
      <p><strong>Time:</strong> ${formatTime(event.startTime)} - ${formatTime(event.endTime)}</p>
      <p><strong>Location:</strong> ${event.location}</p>
      <button type="button" class="calendar-remove-btn">Remove</button>
    `;

    eventItem.querySelector(".calendar-remove-btn").addEventListener("click", () => {
      removeSavedEvent(event.id);
      loadEvents();
      renderSavedEventsCalendar();
    });

    calendarEvents.appendChild(eventItem);
  });
}

function clearColumns() {
  document.getElementById("current-events").innerHTML = "";
  document.getElementById("future-events").innerHTML = "";
  document.getElementById("past-events").innerHTML = "";
}

function showEmptyMessages() {
  addEmptyMessage("current-events", "No current events yet.");
  addEmptyMessage("future-events", "No future events yet.");
  addEmptyMessage("past-events", "No past events yet.");
}

function addEmptyMessage(columnId, message) {
  const column = document.getElementById(columnId);

  if (column.children.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = message;
    column.appendChild(empty);
  }
}

function showLoadError() {
  clearColumns();

  ["current-events", "future-events", "past-events"].forEach((columnId) => {
    const column = document.getElementById(columnId);
    const error = document.createElement("p");
    error.className = "empty-message";
    error.textContent = "Could not load events.";
    column.appendChild(error);
  });
}

function getTodayDateOnly() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isSameDate(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatTime(timeString) {
  if (!timeString) return "";

  const [hour, minute] = timeString.split(":");
  const date = new Date();
  date.setHours(Number(hour), Number(minute));

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });
}
