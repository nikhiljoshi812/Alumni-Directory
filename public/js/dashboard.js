document.addEventListener("DOMContentLoaded", async () => {
  // --- 1. INITIAL SETUP & TOKEN VERIFICATION ---
  const token = localStorage.getItem("token");
  if (!token) {
    // If no token exists, redirect to login page immediately
    window.location.href = "/login.html";
    return;
  }

  // --- 2. SELECTING ALL ELEMENTS FROM THE DOM ---
  // Navbar elements
  const userNameDisplay = document.getElementById("userNameDisplay");
  const logoutBtn = document.getElementById("logoutBtn");

  // Directory elements
  const alumniDirectoryDiv = document.getElementById("alumniDirectory");
  const searchInput = document.getElementById("searchInput");

  // Chat elements
  const socket = io();
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const messages = document.getElementById("messages");

  // Global variables to store data
  let allAlumni = [];
  let currentUserName = "User"; // Default name
  let currentUserId = null; // To store the logged-in user's ID
  let onlineUsers = []; // Add this line

  // --- 3. CORE FUNCTIONS ---

  // Fetches the currently logged-in user's data to get their name
  // --- NEW: Function to render the full contact list in the sidebar ---
  function renderContactList() {
    onlineUsersList.innerHTML = ""; // Clear the list

    // Create a Set of online user IDs for quick lookup
    const onlineUserIds = new Set(onlineUsers.map((u) => u.id));

    // Don't show the current user in their own contact list
    const otherAlumni = allAlumni.filter((alum) => alum._id !== currentUserId);

    if (otherAlumni.length === 0) {
      onlineUsersList.innerHTML =
        '<p class="p-4 text-gray-500 text-sm">No other alumni in the directory.</p>';
      return;
    }

    otherAlumni.forEach((alumnus) => {
      const isOnline = onlineUserIds.has(alumnus._id);

      const userElement = document.createElement("a");
      userElement.href = "#";
      userElement.setAttribute("data-id", alumnus._id);
      userElement.setAttribute("data-name", alumnus.name);
      userElement.className =
        "contact-item flex items-center p-4 text-gray-600 hover:bg-gray-100";
      userElement.innerHTML = `
            <span class="h-3 w-3 rounded-full ${
              isOnline ? "bg-green-500" : "bg-gray-400"
            } mr-3 flex-shrink-0"></span>
            <span class="truncate">${alumnus.name}</span>
        `;

      userElement.addEventListener("click", (e) => {
        e.preventDefault();
        const userId = e.currentTarget.getAttribute("data-id");
        const userName = e.currentTarget.getAttribute("data-name");
        openPrivateChat(userId, userName);
      });

      onlineUsersList.appendChild(userElement);
    });
  }
  async function fetchCurrentUser() {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { "x-auth-token": token },
      });
      if (!res.ok) throw new Error("Could not fetch user data");

      const user = await res.json();
      currentUserName = user.name;
      socket.emit("user connected", { userId: user._id, userName: user.name });
      currentUserId = user._id;

      // Update the navbar with the user's name
      if (userNameDisplay) {
        userNameDisplay.textContent = `Welcome, ${currentUserName}`;
      }
      // --- NEW: Wait for server confirmation, then send user info ---
      socket.on("connect", () => {
        // Just announce that the current user is connected
        socket.emit("user connected", {
          userId: currentUserId,
          userName: currentUserName,
        });
      });
    } catch (err) {
      console.error(err);
      // If fetching fails, redirect to login as the token might be invalid
      localStorage.removeItem("token");
      window.location.href = "/login.html";
    }
  }

  // Fetches the list of all verified alumni
  async function fetchAlumni() {
    try {
      const res = await fetch("/api/alumni", {
        headers: { "x-auth-token": token },
      });
      if (!res.ok) throw new Error("Failed to fetch alumni");

      allAlumni = await res.json();
      displayAlumni(allAlumni);
      renderContactList();
    } catch (err) {
      console.error(err);
    }
  }

  // Displays the alumni cards on the page
  function displayAlumni(alumniList) {
    console.log(
      "--- DisplayAlumni function CALLED with this data: ---",
      alumniList
    ); // <-- ADD THIS LINE

    alumniDirectoryDiv.innerHTML = "";
    alumniDirectoryDiv.innerHTML = ""; // Clear existing list
    if (!alumniList || alumniList.length === 0) {
      alumniDirectoryDiv.innerHTML =
        '<p class="text-gray-500">No alumni found.</p>';
      return;
    }

    alumniList.forEach((alumnus) => {
      // Create a link element that will wrap the card
      const linkWrapper = document.createElement("a");
      linkWrapper.href = `/profile.html?id=${alumnus._id}`; // Set the correct URL with the user's ID

      // Create the card div
      const alumniCard = document.createElement("div");
      alumniCard.className =
        "bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300";

      // Set the inner HTML of the card
      alumniCard.innerHTML = `
        <h3 class="text-xl font-bold text-blue-600 mb-2">${alumnus.name}</h3>
        <p class="text-gray-700"><strong class="font-semibold">Branch:</strong> ${alumnus.branch}</p>
        <p class="text-gray-700"><strong class="font-semibold">Graduation:</strong> ${alumnus.graduationYear}</p>
    `;

      // Put the card inside the link wrapper
      linkWrapper.appendChild(alumniCard);

      // Add the complete link (with the card inside) to the page
      alumniDirectoryDiv.appendChild(linkWrapper);
    });
  }

  // --- 4. EVENT LISTENERS ---

  // Logout button
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  });

  // Search input
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredAlumni = allAlumni.filter(
      (alumnus) =>
        alumnus.name.toLowerCase().includes(searchTerm) ||
        alumnus.branch.toLowerCase().includes(searchTerm)
    );
    displayAlumni(filteredAlumni);
  });

  // Chat form submission
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (chatInput.value) {
      const chatMessage = {
        name: currentUserName,
        text: chatInput.value,
      };
      socket.emit("chat message", chatMessage);
      chatInput.value = "";
    }
  });

  // Listen for incoming chat messages
  socket.on("chat message", (msg) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong class="text-blue-600">${msg.name}:</strong> ${msg.text}`;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  });

  // --- 5. INITIAL PAGE LOAD ---
  // Run the main functions to populate the page
  await fetchCurrentUser();
  await fetchAlumni();
  // --- Sidebar Toggle Logic ---
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");

  if (sidebarToggle && sidebar) {
    // Start with the sidebar closed by default
    sidebar.classList.add("-ml-64");

    // Toggle on click
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("-ml-64");
    });
  }
  // --- Floating Chat Toggle Logic ---
  const chatHeader = document.getElementById("chat-header");
  const chatBody = document.getElementById("chat-body");
  const chatToggleIcon = document.getElementById("chat-toggle-icon");

  if (chatHeader && chatBody) {
    chatHeader.addEventListener("click", () => {
      chatBody.classList.toggle("hidden");
      // Optional: change icon direction
      chatToggleIcon.textContent = chatBody.classList.contains("hidden")
        ? "▲"
        : "▼";
    });
  }
  // --- NEW: Listen for the updated user list from the server ---
  const onlineUsersList = document.getElementById("online-users-list");

  //   });

  // --- Listen for updates to the online user list (with click handling) ---
  socket.on("update user list", (users) => {
    socket.on("update user list", (users) => {
      onlineUsers = users; // Update the global list of online users
      renderContactList(); // Re-render the sidebar to show who is online/offline
    });
    const otherUsers = users.filter((user) => user.id !== currentUserId);

    if (otherUsers.length === 0) {
      onlineUsersList.innerHTML =
        '<p class="p-4 text-gray-500 text-sm">No other users online.</p>';
      return;
    }

    otherUsers.forEach((user) => {
      const userElement = document.createElement("a");
      userElement.href = "#";
      // Add data attributes to store user info
      userElement.setAttribute("data-id", user.id);
      userElement.setAttribute("data-name", user.name);
      userElement.className =
        "contact-item flex items-center p-4 text-gray-600 hover:bg-gray-100";
      userElement.innerHTML = `
            <span class="h-3 w-3 rounded-full bg-green-500 mr-3"></span>
            ${user.name}
        `;

      // Add a click event listener to each user
      userElement.addEventListener("click", (e) => {
        e.preventDefault();
        const userId = e.currentTarget.getAttribute("data-id");
        const userName = e.currentTarget.getAttribute("data-name");
        openPrivateChat(userId, userName);
      });

      onlineUsersList.appendChild(userElement);
    });
  });

  // --- NEW: Function to open a private chat window ---
  // Replace the old openPrivateChat function with this
  function openPrivateChat(userId, userName) {
    // Check if a chat window for this user already exists
    if (document.getElementById(`chat-window-${userId}`)) {
      return; // Don't open a duplicate window
    }

    // Create the chat window element
    const chatWindow = document.createElement("div");
    chatWindow.id = `chat-window-${userId}`;
    chatWindow.className =
      "fixed bottom-4 right-96 bg-white rounded-t-lg shadow-2xl w-80"; // Adjust position as needed

    chatWindow.innerHTML = `
        <div class="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center cursor-pointer">
            <h3 class="font-bold">${userName}</h3>
            <button class="close-chat text-white font-bold">X</button>
        </div>
        <div class="p-4">
            <ul class="messages-list overflow-y-auto h-64 space-y-2">
                </ul>
            <form class="private-chat-form flex mt-3">
                <input autocomplete="off" class="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" placeholder="Private message..." />
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-r-md transition duration-300 text-sm">Send</button>
            </form>
        </div>
    `;

    // Append the new chat window to the body
    document.body.appendChild(chatWindow);
    socket.emit("load private history", {
      userId: currentUserId,
      partnerId: userId,
    });

    const chatForm = chatWindow.querySelector(".private-chat-form");
    const chatInput = chatWindow.querySelector("input");

    // --- Logic to SEND a private message ---
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (chatInput.value) {
        socket.emit("private message", {
          to: userId,
          text: chatInput.value,
        });
        chatInput.value = "";
      }
    });

    // --- Logic to CLOSE the chat window ---
    chatWindow.querySelector(".close-chat").addEventListener("click", () => {
      chatWindow.remove();
    });
  }

  socket.on("load old messages", (messages) => {
    const messagesContainer = document.getElementById("messages");
    messagesContainer.innerHTML = ""; // Clear chat on load

    messages.forEach((msg) => {
      const item = document.createElement("li");
      item.innerHTML = `<strong class="text-blue-600">${msg.senderName}:</strong> ${msg.text}`;
      messagesContainer.appendChild(item);
    });

    // Scroll to the bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
  // Replace your old 'private message' listener with this
  socket.on("private message", (message) => {
    const chatPartnerId =
      message.from === currentUserId ? message.to : message.from;
    const chatPartnerName =
      message.from === currentUserId ? "You" : message.fromName;

    let chatWindow = document.getElementById(`chat-window-${chatPartnerId}`);

    if (!chatWindow) {
      // This is the fix for the mistake I mentioned earlier
      const contactName =
        allAlumni.find((u) => u._id === chatPartnerId)?.name || "User";
      openPrivateChat(chatPartnerId, contactName);
      chatWindow = document.getElementById(`chat-window-${chatPartnerId}`);
    }

    const messagesList = chatWindow.querySelector(".messages-list");
    const item = document.createElement("li");

    if (message.from === currentUserId) {
      item.innerHTML = `<strong class="text-green-600">Me:</strong> ${message.text}`;
      item.className = "text-right";
    } else {
      item.innerHTML = `<strong class="text-blue-600">${message.fromName}:</strong> ${message.text}`;
    }

    messagesList.appendChild(item);
    messagesList.scrollTop = messagesList.scrollHeight;
  });
  // --- NEW: Listen for the private chat history from the server ---
  socket.on("private history loaded", async ({ partnerId, history }) => {
    const chatWindow = document.getElementById(`chat-window-${partnerId}`);
    if (!chatWindow) return;

    const messagesList = chatWindow.querySelector(".messages-list");
    messagesList.innerHTML = ""; // Clear the list before loading history

    history.forEach((message) => {
      const item = document.createElement("li");
      if (message.from === currentUserId) {
        item.innerHTML = `<strong class="text-green-600">Me:</strong> ${message.text}`;
        item.className = "text-right";
      } else {
        // We need the partner's name. Let's find it.
        const partner = allAlumni.find((u) => u._id === partnerId);
        const partnerName = partner ? partner.name : "User";
        item.innerHTML = `<strong class="text-blue-600">${partnerName}:</strong> ${message.text}`;
      }
      messagesList.appendChild(item);
    });
    messagesList.scrollTop = messagesList.scrollHeight;
    await fetchCurrentUser();
    await fetchAlumni();
  });
  // --- NEW: Check if we need to open a chat window on page load ---
  const chatWithId = localStorage.getItem("chatWithId");
  const chatWithName = localStorage.getItem("chatWithName");

  if (chatWithId && chatWithName) {
    openPrivateChat(chatWithId, chatWithName);
    // Clear the stored items so it doesn't open every time
    localStorage.removeItem("chatWithId");
    localStorage.removeItem("chatWithName");
  }
});
