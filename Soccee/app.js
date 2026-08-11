// ============================================================================
// SOCCEE — app.js
// Drives index.html: primary nav active-states, tab switching, and rendering
// match data pulled from api/fetch_matches.php (which itself proxies the
// openfootball worldcup.json feed server-side, so no API key ever reaches
// the browser).
// ============================================================================

const state = {
  matches: [],
  currentMatch: null,
  activeTab: "stats",
};

// ---------------------------------------------------------------------------
// Nav bar (Matches / Table / Teams / More) — black bg -> active = YELLOW
// ---------------------------------------------------------------------------
document.querySelectorAll(".nav-link-black").forEach((el) => {
  el.addEventListener("click", () => {
    document.querySelectorAll(".nav-link-black").forEach((n) => n.classList.remove("active"));
    el.classList.add("active");
    // el.dataset.nav tells you which section was picked (matches/table/teams/more).
    // Each currently renders the same match dashboard below; wire real
    // sub-pages in here as you build them out (e.g. a standings table view).
  });
});

// ---------------------------------------------------------------------------
// Tabs under the match card (Stats / Lineups / Player Info) -> active = RED
// ---------------------------------------------------------------------------
document.querySelectorAll(".nav-link-red[data-tab]").forEach((el) => {
  el.addEventListener("click", () => {
    document.querySelectorAll(".nav-link-red[data-tab]").forEach((n) => n.classList.remove("active"));
    el.classList.add("active");
    state.activeTab = el.dataset.tab;
    renderTabPanel();
  });
});

// ---------------------------------------------------------------------------
// Login / Register button (top right) -> goes to the dedicated auth page.
// The auth UI is intentionally NOT part of this page; it only appears once
// the user navigates there, per the brief.
// ---------------------------------------------------------------------------
document.getElementById("authBtn").addEventListener("click", () => {
  window.location.href = "login.php";
});

// ---------------------------------------------------------------------------
// Match picker
// ---------------------------------------------------------------------------
document.getElementById("matchPicker").addEventListener("change", (e) => {
  const idx = Number(e.target.value);
  state.currentMatch = state.matches[idx];
  renderMatch();
  renderTabPanel();
});

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------
async function loadMatches() {
  try {
    const res = await fetch("api/fetch_matches.php");
    if (!res.ok) throw new Error("API error " + res.status);
    const data = await res.json();
    state.matches = data.matches || [];

    const picker = document.getElementById("matchPicker");
    picker.innerHTML = state.matches
      .map((m, i) => `<option value="${i}">${m.round} — ${m.team1} vs ${m.team2}</option>`)
      .join("");

    // Default to the most recent match with a final score, else the first one.
    const withScore = state.matches.findIndex((m) => m.score && m.score.ft);
    const startIdx = withScore !== -1 ? withScore : 0;
    picker.value = startIdx;
    state.currentMatch = state.matches[startIdx];

    renderMatch();
    renderTabPanel();
  } catch (err) {
    document.getElementById("matchMeta").textContent =
      "Couldn't load match data — check that fetch_matches.php can reach the API.";
    console.error(err);
  }
}

function flagUrl(teamName, code) {
  // flagcdn.com is free and keyed off ISO country codes; fetch_matches.php
  // attaches a best-guess `code` per team when it can. Falls back to a
  // generic placeholder if not.
  return code ? `https://flagcdn.com/w80/${code}.png` : "https://flagcdn.com/w80/un.png";
}

function goalList(goals) {
  if (!goals || goals.length === 0) return "";
  return goals
    .map((g) => `<div class="scorer-row">&#9917; ${g.name} ${g.minute}'</div>`)
    .join("");
}

function renderMatch() {
  const m = state.currentMatch;
  if (!m) return;

  document.getElementById("matchMeta").textContent =
    `${m.round || ""} • ${m.group ? "Group " + m.group : ""} • ${m.date || ""}`;

  document.getElementById("stageBadge").textContent = m.round || "Group Stage";

  document.getElementById("homeName").textContent = m.team1;
  document.getElementById("awayName").textContent = m.team2;
  document.getElementById("homeFlag").src = flagUrl(m.team1, m.team1_code);
  document.getElementById("awayFlag").src = flagUrl(m.team2, m.team2_code);

  const ft = m.score && m.score.ft;
  document.getElementById("homeGoals").textContent = ft ? ft[0] : "-";
  document.getElementById("awayGoals").textContent = ft ? ft[1] : "-";
  document.getElementById("matchStatus").textContent = ft ? "Full Time" : "Scheduled";

  document.getElementById("homeScorers").innerHTML = goalList(m.goals1);
  document.getElementById("awayScorers").innerHTML = goalList(m.goals2);
}

// ---------------------------------------------------------------------------
// Tab panel (Stats / Lineups / Player Info)
// ---------------------------------------------------------------------------
function renderTabPanel() {
  const panel = document.getElementById("tabPanel");
  const m = state.currentMatch;
  if (!m) return;

  if (state.activeTab === "stats") {
    panel.innerHTML = renderStats(m);
  } else if (state.activeTab === "lineups") {
    panel.innerHTML = renderLineups(m);
  } else {
    panel.innerHTML = renderPlayers(m);
  }
}

function renderStats(m) {
  // openfootball doesn't ship possession/shots data, so this reads from
  // m.stats if fetch_matches.php supplied it, and otherwise shows a clear
  // "no stats available" state instead of inventing numbers.
  const stats = m.stats;
  if (!stats) {
    return `<p class="text-sm text-gray-500 text-center">Detailed match stats aren't available for this fixture yet.</p>`;
  }
  const rows = [
    ["Possession", stats.possession],
    ["Shots on Target", stats.shotsOnTarget],
    ["Corners", stats.corners],
    ["Fouls", stats.fouls],
  ];
  return rows
    .map(([label, pair]) => {
      if (!pair) return "";
      const [h, a] = pair;
      const total = h + a || 1;
      return `
        <div class="stat-row mb-4">
          <div class="flex justify-between text-sm font-medium mb-1">
            <span>${h}</span><span class="stat-label">${label}</span><span>${a}</span>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-home" style="width:${(h / total) * 100}%"></div>
            <div class="stat-bar-away" style="width:${(a / total) * 100}%"></div>
          </div>
        </div>`;
    })
    .join("");
}

function renderLineups(m) {
  if (!m.lineups) {
    return `<p class="text-sm text-gray-500 text-center">Lineups haven't been published for this fixture yet.</p>`;
  }
  const side = (label, list) => `
    <div>
      <h3 class="font-semibold mb-2">${label}</h3>
      <ul class="text-sm space-y-1">
        ${list.map((p) => `<li>#${p.number} ${p.name} <span class="text-gray-400">(${p.position})</span></li>`).join("")}
      </ul>
    </div>`;
  return `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    ${side(m.team1, m.lineups.team1)}
    ${side(m.team2, m.lineups.team2)}
  </div>`;
}

function renderPlayers(m) {
  if (!m.lineups) {
    return `<p class="text-sm text-gray-500 text-center">Player profiles need lineup data, which isn't published for this fixture yet.</p>`;
  }
  const all = [...m.lineups.team1, ...m.lineups.team2];
  return `<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    ${all
      .map(
        (p) => `
      <div class="player-card p-3 text-center">
        <img src="${p.photo || "assets/player-placeholder.png"}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=0d1b3e&color=fff'" class="w-16 h-16 rounded-full mx-auto object-cover mb-2" alt="${p.name}">
        <div class="font-medium text-sm">${p.name}</div>
        <div class="text-xs text-gray-500">#${p.number} • Age ${p.age || "—"}</div>
      </div>`
      )
      .join("")}
  </div>`;
}

loadMatches();
