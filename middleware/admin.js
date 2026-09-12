document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const pendingListDiv = document.getElementById("pendingList");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  // --- Function to fetch and display pending users ---
  async function fetchPendingUsers() {
    try {
      const res = await fetch("/api/admin/pending", {
        headers: { "x-auth-token": token },
      });

      if (!res.ok) {
        // If token is invalid or user is not an admin, redirect to login
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          window.location.href = "/login.html";
        }
        throw new Error("Failed to fetch users");
      }

      const users = await res.json();
      pendingListDiv.innerHTML = ""; // Clear previous list

      if (users.length === 0) {
        pendingListDiv.innerHTML =
          '<p class="text-gray-500 col-span-full">No pending approvals at the moment.</p>';
        return;
      }

      // Create a styled card for each pending user
      users.forEach((user) => {
        const userCard = document.createElement("div");
        userCard.className =
          "bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm space-y-3";
        userCard.innerHTML = `
                    <h3 class="text-xl font-bold text-blue-600">${user.name}</h3>
                    <p class="text-gray-700"><strong class="font-semibold">Email:</strong> ${user.email}</p>
                    <p class="text-gray-700"><strong class="font-semibold">Branch:</strong> ${user.branch}</p>
                    <p class="text-gray-700"><strong class="font-semibold">Graduation:</strong> ${user.graduationYear}</p>
                    <div class="mt-4 flex space-x-4">
                        <button class="approve-btn w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300" data-id="${user._id}">Approve</button>
                        <button class="reject-btn w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300" data-id="${user._id}">Reject</button>
                    </div>
                `;
        pendingListDiv.appendChild(userCard);
      });
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }

  // --- Event listener for Approve/Reject buttons ---
  pendingListDiv.addEventListener("click", async (e) => {
    const targetButton = e.target.closest("button");
    if (!targetButton) return; // Exit if the click was not on a button

    const userId = targetButton.dataset.id;
    if (!userId) return;

    let url = "";
    let method = "";

    if (targetButton.classList.contains("approve-btn")) {
      url = `/api/admin/approve/${userId}`;
      method = "PUT";
    } else if (targetButton.classList.contains("reject-btn")) {
      url = `/api/admin/reject/${userId}`;
      method = "DELETE";
    }

    if (url) {
      try {
        targetButton.textContent = "Processing...";
        targetButton.disabled = true;

        const res = await fetch(url, {
          method,
          headers: { "x-auth-token": token },
        });

        if (res.ok) {
          // Refresh the list to show the change
          fetchPendingUsers();
        } else {
          const data = await res.json();
          alert(`Action failed: ${data.msg || "Server error"}`);
          targetButton.textContent = method === "PUT" ? "Approve" : "Reject";
          targetButton.disabled = false;
        }
      } catch (err) {
        console.error("Action Error:", err);
        alert("An error occurred. Please try again.");
      }
    }
  });

  // --- Logout functionality ---
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  });

  // --- Initial Fetch ---
  fetchPendingUsers();
});
