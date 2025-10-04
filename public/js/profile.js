document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  // ADD THIS BLOCK to identify the current user to the server

  let currentUserId = null;
  async function fetchCurrentUser() {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { "x-auth-token": token },
      });
      if (!res.ok) return;
      const user = await res.json();
      currentUserId = user._id;
      // Announce that the current user is active on this page
      socket.emit("user connected", { userId: user._id, userName: user.name });
    } catch (err) {
      console.error("Could not fetch current user:", err);
    }
  }
  fetchCurrentUser(); // Run the function
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  const profileContainer = document.getElementById("profile-container");

  // Get the user ID from the URL (e.g., ?id=12345)
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("id");

  if (!userId) {
    profileContainer.innerHTML =
      '<p class="text-red-500">Error: No user ID provided.</p>';
    return;
  }

  try {
    const res = await fetch(`/api/alumni/${userId}`, {
      headers: { "x-auth-token": token },
    });

    if (!res.ok) {
      throw new Error("Could not fetch profile.");
    }

    const alumnus = await res.json();

    /// Replace the block that starts with profileContainer.innerHTML = ...

    // Display the profile data
    profileContainer.innerHTML = `
    <div class="flex items-center space-x-6 mb-8 border-b pb-6">
        <div class="bg-blue-600 text-white h-24 w-24 rounded-full flex items-center justify-center text-4xl font-bold">
            ${alumnus.name.charAt(0).toUpperCase()}
        </div>
        <div>
            <h1 class="text-4xl font-bold text-gray-800">${alumnus.name}</h1>
              <span id="status-indicator" class="ml-4"></span>
            <p class="text-lg text-gray-500">${alumnus.branch} - Batch of ${
      alumnus.graduationYear
    }</p>
        </div>
    </div>

    <div>
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">Details</h2>
        <div class="space-y-3">
            <p class="text-gray-800"><strong class="font-semibold w-32 inline-block">Email:</strong> ${
              alumnus.email
            }</p>
            <p class="text-gray-800"><strong class="font-semibold w-32 inline-block">Currently at:</strong> ${
              alumnus.currentCompany
            }</p>
            <p class="text-gray-800"><strong class="font-semibold w-32 inline-block">Member Since:</strong> ${new Date(
              alumnus.registrationDate
            ).toLocaleDateString()}</p>
        </div>
    </div>

    <div class="mt-8 border-t pt-6">
        <button id="connectBtn" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300">
            Connect with ${alumnus.name}
        </button>
    </div>
`;

    // --- NEW: Add event listener to the "Connect" button ---
    const connectBtn = document.getElementById("connectBtn");
    connectBtn.addEventListener("click", () => {
      // Save the details of the user we want to chat with
      localStorage.setItem("chatWithId", alumnus._id);
      localStorage.setItem("chatWithName", alumnus.name);

      // Redirect back to the dashboard
      window.location.href = "/dashboard.html";
    });
  } catch (err) {
    profileContainer.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
    console.error(err);
  }
  // --- NEW: Real-time Status Logic ---
  const socket = io();

  // Listen for the updated user list from the server
  socket.on("update user list", (onlineUsers) => {
    const statusIndicator = document.getElementById("status-indicator");
    if (!statusIndicator) return;

    // Check if the ID of the user on this profile page is in the online list
    const isOnline = onlineUsers.some((user) => user.id === userId);

    if (isOnline) {
      statusIndicator.innerHTML = `
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"></circle></svg>
                Online
            </span>
        `;
    } else {
      statusIndicator.innerHTML = `
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                <svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"></circle></svg>
                Offline
            </span>
        `;
    }
  });
});
