document.addEventListener("DOMContentLoaded", () => {
  const messageEl = document.getElementById("message");

  // Handle Registration
  if (document.getElementById("registerForm")) {
    document
      .getElementById("registerForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const graduationYear = document.getElementById("graduationYear").value;
        const branch = document.getElementById("branch").value;
        const currentCompany = document.getElementById("currentCompany").value;

        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              email,
              password,
              graduationYear,
              branch,
              currentCompany,
            }),
          });
          const data = await res.json();
          messageEl.textContent = data.msg;
          if (res.ok) {
            messageEl.className = "success";
            setTimeout(() => (window.location.href = "/login.html"), 2000);
          } else {
            messageEl.className = "error";
          }
        } catch (err) {
          messageEl.textContent = "An error occurred.";
          messageEl.className = "error";
        }
      });
  }

  // Handle Login
  if (document.getElementById("loginForm")) {
    document
      .getElementById("loginForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();

          if (res.ok) {
            messageEl.textContent = "Login Successful!";
            messageEl.className = "success";
            localStorage.setItem("token", data.token); // Save token
            // Redirect based on role
            if (data.role === "admin") {
              window.location.href = "/admin.html";
            } else {
              window.location.href = "/dashboard.html";
            }
          } else {
            messageEl.textContent = data.msg;
            messageEl.className = "error";
          }
        } catch (err) {
          messageEl.textContent = "An error occurred.";
          messageEl.className = "error";
        }
      });
  }
});
