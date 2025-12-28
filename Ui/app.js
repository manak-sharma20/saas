const API_URL = "https://saas-9s1s.onrender.com";

// --- State Management ---
const state = {
  user: null,
  token: localStorage.getItem("token"),
};

// --- API Helper ---
async function apiCall(endpoint, method = "GET", body = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (state.token) {
    headers["Authorization"] = `Bearer ${state.token}`;
  }

  try {
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${endpoint}`, options);
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        logout(); // Auto logout on 401
      }
      throw new Error(data.error || "Something went wrong");
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// --- Auth Functions ---
async function register() {
  const org = document.getElementById("org").value;
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error");
  const btn = document.querySelector("button");

  if (!org || !name || !email || !password) {
    showError(errorEl, "All fields are required");
    return;
  }

  setLoading(btn, true);
  try {
    await apiCall("/auth/register", "POST", { organization: org, name, email, password });
    window.location.href = "login.html?registered=true";
  } catch (err) {
    showError(errorEl, err.message);
  } finally {
    setLoading(btn, false);
  }
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error");
  const btn = document.querySelector("button");

  if (!email || !password) {
    showError(errorEl, "All fields are required");
    return;
  }

  setLoading(btn, true);
  try {
    const data = await apiCall("/auth/login", "POST", { email, password });
    localStorage.setItem("token", data.token);
    state.token = data.token;
    window.location.href = "projects.html";
  } catch (err) {
    showError(errorEl, err.message);
  } finally {
    setLoading(btn, false);
  }
}

function logout() {
  localStorage.removeItem("token");
  state.token = null;
  window.location.href = "login.html";
}

// --- Project Functions ---
async function loadProjects() {
  if (!state.token) return;

  const list = document.getElementById("projectList");
  const empty = document.getElementById("empty");

  try {
    const projects = await apiCall("/projects");

    list.innerHTML = "";
    if (projects.length === 0) {
      empty.innerText = "No projects found. Create one!";
      empty.style.display = "block";
    } else {
      empty.style.display = "none";
      projects.forEach((p) => {
        const li = document.createElement("li");
        li.className = "project-item";
        li.innerHTML = `
          <div class="project-info">
            <h3>${escapeHtml(p.name)}</h3>
            <span class="project-status">${escapeHtml(p.status || 'Active')}</span>
          </div>
          <button class="btn-danger" onclick="deleteProject('${p.id}')">Delete</button>
        `;
        list.appendChild(li);
      });
    }
  } catch (err) {
    console.error("Failed to load projects", err);
  }
}

async function createProject() {
  const nameInput = document.getElementById("projectName");
  const name = nameInput.value;
  const btn = document.getElementById("createBtn");

  if (!name) return;

  setLoading(btn, true);
  try {
    const user = parseJwt(state.token);
    if (!user || !user.id) throw new Error("Invalid token");

    await apiCall("/projects", "POST", { name, createdBy: user.id });
    nameInput.value = "";
    loadProjects();
  } catch (err) {
    alert(err.message);
  } finally {
    setLoading(btn, false);
  }
}

async function deleteProject(id) {
  try {
    await apiCall(`/projects/${id}`, "DELETE");
    loadProjects();
  } catch (err) {
    alert(err.message);
  }
}

// --- UI Helpers ---
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function showError(element, message) {
  element.innerText = message;
  element.style.color = "var(--error-color)";
}

function setLoading(element, isLoading) {
  if (isLoading) {
    element.classList.add("loading");
    element.dataset.originalText = element.innerText;
    element.innerText = "Loading...";
  } else {
    element.classList.remove("loading");
    element.innerText = element.dataset.originalText || element.innerText;
  }
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderNavbar() {
  const nav = document.createElement("nav");
  nav.className = "navbar";

  const isAuth = !!state.token;

  nav.innerHTML = `
    <div class="nav-content">
      <a href="${isAuth ? 'projects.html' : 'login.html'}" class="nav-brand">SaaS App</a>
      <div class="nav-links">
        ${!isAuth ? `
          <a href="login.html" class="nav-link">Login</a>
          <a href="register.html" class="nav-link">Register</a>
        ` : `
          <a href="projects.html" class="nav-link">Projects</a>
          <a href="#" onclick="logout()" class="nav-link">Logout</a>
        `}
      </div>
    </div>
  `;

  document.body.insertBefore(nav, document.body.firstChild);
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();

  // Check auth for protected pages
  if (window.location.pathname.includes("projects.html")) {
    if (!state.token) {
      window.location.href = "login.html";
    } else {
      loadProjects();
    }
  }

  // Check for registration success message
  if (window.location.pathname.includes("login.html")) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("registered")) {
      const errorEl = document.getElementById("error");
      errorEl.innerText = "Registration successful! Please login.";
      errorEl.style.color = "var(--success-color)";
    }
  }
});
