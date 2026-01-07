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
      // Reset activity select options (keep the placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsDiv.appendChild(participantsHeading);

        const ul = document.createElement("ul");

        const participants = Array.isArray(details.participants) ? details.participants : [];

        // Helper to get initials from email/local-part
        const initialsFromEmail = (email) => {
          const local = (email || "").split("@")[0] || "";
          const parts = local.split(/[\._\-]/).filter(Boolean);
          if (parts.length >= 2 && parts[0] && parts[1]) return (parts[0][0] + parts[1][0]).toUpperCase();
          return local.slice(0, 2).toUpperCase() || "?" ;
        };

        if (participants.length === 0) {
          const li = document.createElement("li");
          li.className = "participant";
          const spanName = document.createElement("span");
          spanName.className = "name";
          spanName.textContent = "No participants yet";
          li.appendChild(spanName);
          ul.appendChild(li);
        } else {
          participants.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant";

            const avatar = document.createElement("span");
            avatar.className = "avatar";
            avatar.textContent = initialsFromEmail(email);

            const nameSpan = document.createElement("span");
            nameSpan.className = "name";
            nameSpan.textContent = email;

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "delete-icon";
            deleteBtn.title = `Remove ${email}`;
            deleteBtn.textContent = "✖";

            deleteBtn.addEventListener("click", async (e) => {
              e.stopPropagation();
              if (!confirm(`Remove ${email} from ${name}?`)) return;
              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants/${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );
                const data = await res.json();
                if (res.ok) {
                  // refresh activities list to reflect change
                  fetchActivities();
                  messageDiv.textContent = data.message;
                  messageDiv.className = "message success";
                  messageDiv.classList.remove("hidden");
                  setTimeout(() => messageDiv.classList.add("hidden"), 3000);
                } else {
                  messageDiv.textContent = data.detail || "Failed to remove participant";
                  messageDiv.className = "message error";
                  messageDiv.classList.remove("hidden");
                }
              } catch (err) {
                console.error("Error removing participant:", err);
                messageDiv.textContent = "Failed to remove participant. Try again.";
                messageDiv.className = "message error";
                messageDiv.classList.remove("hidden");
              }
            });

            li.appendChild(avatar);
            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
          });
        }

        participantsDiv.appendChild(ul);
        activityCard.appendChild(participantsDiv);

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
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities immediately so the new participant appears
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
