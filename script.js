document.addEventListener("DOMContentLoaded", () => {
  loadEvents();
  setupModalClose();
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

  card.innerHTML = `
    <img src="${event.image}" alt="${event.title}" class="event-image">
    <div class="event-content">
      <p class="event-type">${event.eventType || "Other"}</p>
      <h3>${event.title}</h3>
      <button class="details-btn" type="button">View Details</button>
    </div>
  `;

  card.querySelector(".details-btn").addEventListener("click", () => {
    openEventModal(event);
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
