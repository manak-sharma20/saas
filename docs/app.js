const API_URL = "https://saas-9s1s.onrender.com";

const state = {
  token: localStorage.getItem("token"),
};

// --- API Helper ---
async function apiCall(endpoint, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  if (state.token) headers["Authorization"] = `Bearer ${state.token}`;

  try {
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${API_URL}${endpoint}`, options);
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) logout();
      if (res.status === 409) throw new Error("__conflict__");
      if (res.status === 403) throw new Error("You do not have permission to do this.");
      throw new Error(data.error || data.err || "Something went wrong");
    }
    return data;
  } catch (err) {
    throw err;
  }
}

// --- Auth ---
async function register() {
  const org = document.getElementById("org").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error");
  const btn = document.querySelector(".btn-primary");

  if (!org || !email || !password) {
    showError(errorEl, "All fields are required");
    return;
  }

  setLoading(btn, true);
  try {
    await apiCall("/auth/register", "POST", { name: org, email, password });
    window.location.href = "login.html?registered=true";
  } catch (err) {
    showError(errorEl, err.message);
  } finally {
    setLoading(btn, false);
  }
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error");
  const btn = document.querySelector(".btn-primary");

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

// --- Projects ---
async function loadProjects() {
  if (!state.token) return;

  const list = document.getElementById("projectList");
  const empty = document.getElementById("empty");
  const loading = document.getElementById("loadingState");

  if (loading) loading.style.display = "block";
  if (empty) empty.style.display = "none";

  try {
    const projects = await apiCall("/projects");
    if (loading) loading.style.display = "none";
    list.innerHTML = "";

    if (projects.length === 0) {
      if (empty) {
        empty.textContent = "No projects yet. Create your first one above.";
        empty.style.display = "block";
      }
      return;
    }

    const tokenUser = parseJwt(state.token);
    const isAdmin = tokenUser && tokenUser.role === "ADMIN";

    projects.forEach((p) => {
      const li = document.createElement("li");
      li.className = "project-item";
      const statusClass = getStatusClass(p.status);
      li.innerHTML = `
        <div class="project-info">
          <h3>${escapeHtml(p.name)}</h3>
          <div class="project-meta">
            <span class="badge badge-${statusClass}">${escapeHtml(p.status || "ACTIVE")}</span>
            <span class="project-date">Created ${formatDate(p.createdAt)}</span>
          </div>
        </div>
        ${isAdmin ? `<button class="btn-danger" onclick="deleteProject('${escapeHtml(p.id)}')">Delete</button>` : ""}
      `;
      list.appendChild(li);
    });
  } catch (err) {
    if (loading) loading.style.display = "none";
    if (empty) {
      empty.textContent = "Failed to load projects. Please refresh.";
      empty.style.display = "block";
    }
    console.error("Failed to load projects:", err);
  }
}

async function createProject() {
  const nameInput = document.getElementById("projectName");
  const statusInput = document.getElementById("projectStatus");
  const name = nameInput.value.trim();
  const status = statusInput ? statusInput.value : "ACTIVE";
  const btn = document.getElementById("createBtn");
  const errorEl = document.getElementById("createError");

  if (!name) {
    showError(errorEl, "Project name is required");
    return;
  }

  setLoading(btn, true);
  try {
    const tokenUser = parseJwt(state.token);
    if (!tokenUser || !tokenUser.id) throw new Error("Invalid session. Please log in again.");
    await apiCall("/projects", "POST", { name, status, createdBy: tokenUser.id });
    nameInput.value = "";
    if (statusInput) statusInput.value = "ACTIVE";
    errorEl.style.display = "none";
    loadProjects();
  } catch (err) {
    showError(errorEl, err.message);
  } finally {
    setLoading(btn, false);
  }
}

async function deleteProject(id) {
  if (!confirm("Delete this project? This action cannot be undone.")) return;
  try {
    await apiCall(`/projects/${id}`, "DELETE");
    loadProjects();
  } catch (err) {
    alert(err.message);
  }
}

// --- Profile ---
async function loadProfile() {
  if (!state.token) return;
  const container = document.getElementById("profileContent");

  try {
    const user = await apiCall("/users/me");
    container.innerHTML = `
      <div class="profile-card">
        <div class="profile-row">
          <span class="profile-label">Email</span>
          <span class="profile-value">${escapeHtml(user.email)}</span>
        </div>
        <div class="profile-row">
          <span class="profile-label">Role</span>
          <span class="badge ${user.role === "ADMIN" ? "badge-accent" : "badge-primary"}">${escapeHtml(user.role)}</span>
        </div>
        <div class="profile-row">
          <span class="profile-label">Organization ID</span>
          <span class="profile-mono">${escapeHtml(user.organizationId)}</span>
        </div>
        <div class="profile-row">
          <span class="profile-label">User ID</span>
          <span class="profile-mono">${escapeHtml(user.id)}</span>
        </div>
        <div class="profile-row">
          <span class="profile-label">Member Since</span>
          <span class="profile-value">${formatDate(user.createdAt)}</span>
        </div>
      </div>
      <button class="btn-danger btn-inline" onclick="logout()">Sign Out</button>
    `;
  } catch (err) {
    container.innerHTML = `<p class="error-message" style="display:block;">Failed to load profile: ${escapeHtml(err.message)}</p>`;
  }
}

// --- Team / Members ---
function initMembersPage() {
  const container = document.getElementById("memberContent");
  const tokenUser = parseJwt(state.token);

  if (!tokenUser || tokenUser.role !== "ADMIN") {
    container.innerHTML = `
      <div class="card">
        <h3 style="color: var(--accent-color); margin-bottom: 0.5rem; font-size: 1rem;">Access Denied</h3>
        <p class="text-muted mb-0">Admin privileges are required to manage team members.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="card">
      <h3 style="font-size: 1rem; margin-bottom: 0.375rem;">Invite Member</h3>
      <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 1.25rem;">
        Invited members join your organization with the MEMBER role.
      </p>
      <div class="form-group">
        <label for="inviteEmail">Email Address</label>
        <input id="inviteEmail" type="email" placeholder="colleague@company.com">
      </div>
      <div class="form-group">
        <label for="invitePassword">Temporary Password</label>
        <input id="invitePassword" type="password" placeholder="Set a temporary password" onkeypress="if(event.key==='Enter')inviteMember()">
      </div>
      <button id="inviteBtn" class="btn-primary btn-inline" onclick="inviteMember()">Invite Member</button>
      <p id="inviteError" class="error-message"></p>
      <p id="inviteSuccess" class="success-message"></p>
    </div>
    <div class="card">
      <h3 style="font-size: 1rem; margin-bottom: 1rem;">Roles</h3>
      <div class="roles-list">
        <div class="role-row">
          <span class="badge badge-accent" style="white-space: nowrap; margin-top: 2px;">ADMIN</span>
          <div class="role-info">
            <p class="role-name">Administrator</p>
            <p class="role-desc">Can create, view, and delete projects. Can invite new members to the organization.</p>
          </div>
        </div>
        <div class="role-row">
          <span class="badge badge-primary" style="white-space: nowrap; margin-top: 2px;">MEMBER</span>
          <div class="role-info">
            <p class="role-name">Member</p>
            <p class="role-desc">Can create and view projects within the organization. Cannot delete projects or invite others.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function inviteMember() {
  const emailInput = document.getElementById("inviteEmail");
  const passwordInput = document.getElementById("invitePassword");
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const errorEl = document.getElementById("inviteError");
  const successEl = document.getElementById("inviteSuccess");
  const btn = document.getElementById("inviteBtn");

  if (!email || !password) {
    showError(errorEl, "Email and password are required");
    return;
  }

  setLoading(btn, true);
  try {
    await apiCall("/users/invite", "POST", { email, password });
    emailInput.value = "";
    passwordInput.value = "";
    errorEl.style.display = "none";
    successEl.textContent = `Member ${email} invited successfully.`;
    successEl.style.display = "block";
    setTimeout(() => { successEl.style.display = "none"; }, 5000);
  } catch (err) {
    const msg = err.message === "__conflict__"
      ? "An account with this email already exists."
      : err.message;
    showError(errorEl, msg);
  } finally {
    setLoading(btn, false);
  }
}

// --- Helpers ---
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window.atob(base64).split("").map(c =>
        "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
      ).join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function getStatusClass(status) {
  if (!status) return "primary";
  switch (status.toUpperCase()) {
    case "ACTIVE":   return "primary";
    case "INACTIVE": return "accent";
    case "ARCHIVED": return "secondary";
    default:         return "primary";
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric"
  });
}

function showError(element, message) {
  element.textContent = message;
  element.style.color = "var(--accent-color)";
  element.style.display = "block";
}

function setLoading(element, isLoading) {
  if (isLoading) {
    element.classList.add("loading");
    element.dataset.originalText = element.textContent;
    element.textContent = "Loading...";
  } else {
    element.classList.remove("loading");
    element.textContent = element.dataset.originalText || element.textContent;
  }
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text)
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
  const tokenUser = isAuth ? parseJwt(state.token) : null;
  const isAdmin = tokenUser && tokenUser.role === "ADMIN";
  const page = window.location.pathname.split("/").pop() || "index.html";

  function activeClass(p) {
    return page === p ? "nav-link nav-link-active" : "nav-link";
  }

  nav.innerHTML = `
    <div class="nav-content">
      <a href="${isAuth ? "projects.html" : "login.html"}" class="nav-brand">SaaS</a>
      <div class="nav-links">
        ${!isAuth ? `
          <a href="login.html" class="${activeClass("login.html")}">Login</a>
          <a href="register.html" class="${activeClass("register.html")}">Register</a>
        ` : `
          <a href="projects.html" class="${activeClass("projects.html")}">Projects</a>
          ${isAdmin ? `<a href="members.html" class="${activeClass("members.html")}">Team</a>` : ""}
          <a href="profile.html" class="${activeClass("profile.html")}">Profile</a>
          <a href="#" onclick="logout()" class="nav-link nav-link-logout">Logout</a>
        `}
      </div>
    </div>
  `;

  document.body.insertBefore(nav, document.body.firstChild);
}

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();

  const page = window.location.pathname.split("/").pop() || "index.html";
  const protectedPages = ["projects.html", "profile.html", "members.html"];
  const authPages = ["login.html", "register.html"];

  if (protectedPages.includes(page) && !state.token) {
    window.location.href = "login.html";
    return;
  }

  if (authPages.includes(page) && state.token) {
    window.location.href = "projects.html";
    return;
  }

  if (page === "projects.html") loadProjects();
  if (page === "profile.html") loadProfile();
  if (page === "members.html") initMembersPage();

  if (page === "login.html") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered")) {
      const errorEl = document.getElementById("error");
      if (errorEl) {
        errorEl.textContent = "Account created successfully. Please sign in.";
        errorEl.style.color = "var(--primary-color)";
        errorEl.style.display = "block";
      }
    }
  }
});
