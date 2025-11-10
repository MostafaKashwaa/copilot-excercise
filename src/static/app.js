document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (keep the placeholder option)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML (list with a remove button for each participant, or a "no participants" message)
        const participantsHtml =
          Array.isArray(details.participants) && details.participants.length
            ? `<div class="participants"><strong>Participants</strong><ul>${details.participants
                .map(
                  (p) =>
                    `<li class="participant-item"><span class="participant-name">${p}</span><button class="remove-participant" data-activity="${name}" data-participant="${p}" aria-label="Remove ${p}">🗑️</button></li>`
                )
                .join("")}</ul></div>`
            : `<div class="participants"><strong>Participants</strong><p class="no-participants">No participants yet</p></div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
  messageDiv.textContent = result.message;
  messageDiv.className = "success";
  signupForm.reset();
  // Refresh activities to show the new participant
  await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Delegated click handler for removing/unregistering a participant
  // Assumption: the server exposes a DELETE endpoint at
  //   /activities/:activity/signup?email=:email
  // which unregisters the participant. On success we refresh activities.
  document.addEventListener("click", async (event) => {
    const btn = event.target.closest(".remove-participant");
    if (!btn) return;

    const activity = btn.dataset.activity;
    const participant = btn.dataset.participant;

    if (!activity || !participant) return;

    // Simple optimistic UI: disable button while request runs
    btn.disabled = true;

    try {
      const url = `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(participant)}`;
      const resp = await fetch(url, { method: "DELETE" });
      const body = await resp.json().catch(() => ({}));

      if (resp.ok) {
        // Refresh activities to show updated participant lists
        await fetchActivities();

        // Show success message briefly
        messageDiv.textContent = body.message || `${participant} removed from ${activity}`;
        messageDiv.className = "message success";
        messageDiv.classList.remove("hidden");
        setTimeout(() => messageDiv.classList.add("hidden"), 4000);
      } else {
        messageDiv.textContent = body.detail || body.message || "Failed to remove participant";
        messageDiv.className = "message error";
        messageDiv.classList.remove("hidden");
      }
    } catch (err) {
      console.error("Error removing participant:", err);
      messageDiv.textContent = "Network error while removing participant";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
    } finally {
      btn.disabled = false;
    }
  });

  // Initialize app
  fetchActivities();
});
