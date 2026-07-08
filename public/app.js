let activeAuthState = 'login'; 
let currentPrimaryTab = 'matches'; 
let currentSubTab = 'stats';
let liveMatchDataPackage = null;

document.addEventListener('DOMContentLoaded', () => {
    initApplicationController();
});

function initApplicationController() {
    renderDynamicAuthFields();
    setupNavigationRoutingHandlers();

    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'switch-to-register') {
            e.preventDefault();
            activeAuthState = 'register';
            renderDynamicAuthFields();
        }
        if (e.target && e.target.id === 'switch-to-login-toggle') {
            e.preventDefault();
            activeAuthState = 'login';
            renderDynamicAuthFields();
        }
    });

    document.getElementById('auth-form').addEventListener('submit', runFormSubmitTransaction);
    document.getElementById('logout-btn').addEventListener('click', handleSystemLogoutAction);
}

// FORM FIELD CONDITIONAL INJECTION ENGINE

function renderDynamicAuthFields() {
    const inputsBox = document.getElementById('dynamic-inputs');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleContainer = document.getElementById('toggle-auth-container');
    const alertBox = document.getElementById('auth-alert');

    alertBox.classList.add('hidden');

    if (activeAuthState === 'login') {
        title.textContent = "Welcome Back!";
        subtitle.textContent = "Please Sign In to continue";
        submitBtn.textContent = "Login";
        toggleContainer.innerHTML = `Not a member? <a href="#" id="switch-to-register" class="text-purple-600 font-bold underline">Register Now</a>`;
        
        inputsBox.innerHTML = `
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Email</label>
                <input type="email" id="field-email" placeholder="example@mail.com" class="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition">
            </div>
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Password</label>
                <input type="password" id="field-password" placeholder="••••••••" class="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition">
            </div>
        `;
    } else {
        // Register view fields sequence deployment
        title.textContent = "Create Account";
        subtitle.textContent = "Join the platform to track stats";
        submitBtn.textContent = "Register";
        toggleContainer.innerHTML = `Already a member? <a href="#" id="switch-to-login-toggle" class="text-purple-600 font-bold underline">Login Here</a>`;
        
        inputsBox.innerHTML = `
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Username</label>
                <input type="text" id="field-username" placeholder="Your Name" class="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition">
            </div>
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Email</label>
                <input type="email" id="field-email" placeholder="example@mail.com" class="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition">
            </div>
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">New Password</label>
                <input type="password" id="field-password" placeholder="••••••••" class="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition">
                <div id="password-analysis" class="text-[11px] font-bold text-gray-400 mt-1">Analysis: Awaiting Input</div>
            </div>
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Confirm New Password</label>
                <input type="password" id="field-confirm-password" placeholder="••••••••" class="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition">
            </div>
        `;

        document.getElementById('field-password').addEventListener('input', runLivePasswordValidationAnalysis);
    }
}

function runLivePasswordValidationAnalysis(e) {
    const pass = e.target.value;
    const analysisBox = document.getElementById('password-analysis');
    if (!pass) {
        analysisBox.textContent = "Analysis: Awaiting Input";
        analysisBox.className = "text-[11px] font-bold text-gray-400 mt-1";
        return;
    }

    let indicators = 0;
    if (pass.length >= 8) indicators++;
    if (/[A-Z]/.test(pass)) indicators++;
    if (/[0-9]/.test(pass)) indicators++;
    if (/[^A-Za-z0-9]/.test(pass)) indicators++;

    if (indicators <= 1) {
        analysisBox.textContent = "Analysis: Weak Security Profile (Mix complex variables)";
        analysisBox.className = "text-[11px] font-bold text-red-500 mt-1";
    } else if (indicators <= 3) {
        analysisBox.textContent = "Analysis: Medium Protection Rank";
        analysisBox.className = "text-[11px] font-bold text-yellow-600 mt-1";
    } else {
        analysisBox.textContent = "Analysis: Strong Structural Security Matrix Met";
        analysisBox.className = "text-[11px] font-bold text-green-600 mt-1";
    }
}

// REGEX VALIDATION & DATA TRANSACTIONS LAYER
async function runFormSubmitTransaction(e) {
    e.preventDefault();
    const alertBox = document.getElementById('auth-alert');
    alertBox.classList.add('hidden');

    const email = document.getElementById('field-email').value.trim();
    const password = document.getElementById('field-password').value;

    
    const emailValidationFilter = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValidationFilter.test(email)) {
        triggerUIMessage("Format Error: Please enter a complete valid email address (e.g., name@example.com).", "error");
        
        const emailField = document.getElementById('field-email');
        emailField.focus();
        emailField.classList.add('border-red-500', 'ring-2', 'ring-red-500');
        return;
    } else {
        document.getElementById('field-email').classList.remove('border-red-500', 'ring-2', 'ring-red-500');
    }

    let bodyPayload = { email, password };
    let endpointTarget = 'http://localhost:8000/api/auth/login';

    if (activeAuthState === 'register') {
        const username = document.getElementById('field-username').value.trim();
        const confirmPass = document.getElementById('field-confirm-password').value;

        if (!username || !confirmPass) {
            triggerUIMessage("Validation Exception: Complete all registration entries.", "error");
            return;
        }
        if (password !== confirmPass) {
            triggerUIMessage("Validation Exception: New passwords entries do not match.", "error");
            return;
        }
        bodyPayload.username = username;
        endpointTarget = 'http://localhost:8000/api/auth/register';
    }

    try {
        const response = await fetch(endpointTarget, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
        });

        const result = await response.json();

        if (result.success) {
            if (activeAuthState === 'login') {
                document.getElementById('auth-section').classList.add('hidden');
                document.getElementById('main-viewport').classList.remove('hidden');
                executeExternalAPIQuery();
            } else {
                activeAuthState = 'login';
                renderDynamicAuthFields();
                triggerUIMessage("Registration authorized! Login below.", "success");
            }
        } else {
            triggerUIMessage(result.message, "error");
        }
    } catch (err) {
        triggerUIMessage("Connection Refused: Unable to communicate with Express backend.", "error");
    }
}

function triggerUIMessage(msg, mode) {
    const alertBox = document.getElementById('auth-alert');
    alertBox.textContent = msg;
    if (mode === "error") {
        alertBox.className = "mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl font-semibold text-center";
    } else {
        alertBox.className = "mb-4 p-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded-xl font-semibold text-center";
    }
    alertBox.classList.remove('hidden');
}

function handleSystemLogoutAction() {
    document.getElementById('main-viewport').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');
    activeAuthState = 'login';
    renderDynamicAuthFields();
}

// INTERACTIVE TAB SELECTION ROUTING (Hover / Active styles)
function setupNavigationRoutingHandlers() {
    const topTabIds = ['top-tab-matches', 'top-tab-table', 'top-tab-teams', 'top-tab-more'];
    topTabIds.forEach(id => {
        document.getElementById(id).addEventListener('click', (e) => {
            topTabIds.forEach(t => document.getElementById(t).classList.remove('top-active'));
            e.target.classList.add('top-active');
            currentPrimaryTab = id.replace('top-tab-', '');
            renderPurpleCanvasContent();
        });
    });

    const greenTabIds = ['green-tab-stats', 'green-tab-lineups', 'green-tab-players'];
    greenTabIds.forEach(id => {
        document.getElementById(id).addEventListener('click', (e) => {
            greenTabIds.forEach(t => document.getElementById(t).classList.remove('lower-active'));
            e.target.classList.add('lower-active');
            currentSubTab = id.replace('green-tab-', '');
            renderPurpleCanvasContent();
        });
    });
}

// API SYNCHRONIZATION DATA LAYER MODULES
async function executeExternalAPIQuery() {
    try {
        const response = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026&live=all', {
            method: 'GET',
            headers: {
                'x-rapidapi-key': 'YOUR_API_SPORTS_KEY_HERE',
                'x-rapidapi-host': 'v3.football.api-sports.io'
            }
        });

        if (!response.ok) throw new Error("API status response exception.");
        const incomingData = await response.json();
        
        if (incomingData.response && incomingData.response.length > 0) {
            const parsedMatch = incomingData.response[0];
            liveMatchDataPackage = {
                stage: parsedMatch.fixture.status.long || "Round of 16",
                teamA: parsedMatch.teams.home.name,
                teamB: parsedMatch.teams.away.name,
                scoreA: parsedMatch.goals.home ?? 0,
                scoreB: parsedMatch.goals.away ?? 0,
                scorersA: [], 
                scorersB: []
            };
        } else {
            throw new Error("No live matches returned in target structural channel loop query indices.");
        }
    } catch (e) {
        console.warn("Activating local simulation profile backup sequence loop:", e.message);
        loadLocalFixtureBackupProfile();
    }
    populateScoreboardElements();
}

function loadLocalFixtureBackupProfile() {
    liveMatchDataPackage = {
        stage: "Quarter Final",
        teamA: "Argentina",
        teamB: "Austria",
        scoreA: 2,
        scoreB: 0,
        scorersA: ["Lionel Messi (38')", "Lionel Messi (90+5')"],
        scorersB: [],
        stats: { posA: 57, posB: 43, shA: 14, shB: 6 },
        lineups: {
            teamA: ["E. Martínez (#23)", "C. Romero (#13)", "L. Messi (#10)"],
            teamB: ["A. Schlager (#1)", "M. Sabitzer (#9)", "M. Gregoritsch (#11)"]
        },
        playerDirectory: [
            { name: "Lionel Messi", age: 39, jersey: 10, role: "Forward", asset: "🇦🇷" },
            { name: "Emiliano Martínez", age: 33, jersey: 23, role: "Goalkeeper", asset: "🇦🇷" },
            { name: "Marcel Sabitzer", age: 32, jersey: 9, role: "Midfielder", asset: "🇦🇹" }
        ]
    };
}

function populateScoreboardElements() {
    if (!liveMatchDataPackage) return;

    document.getElementById('tournament-stage-text').textContent = liveMatchDataPackage.stage;
    document.getElementById('live-team-a').textContent = liveMatchDataPackage.teamA;
    document.getElementById('live-team-b').textContent = liveMatchDataPackage.teamB;
    document.getElementById('live-goals-score').textContent = `${liveMatchDataPackage.scoreA} - ${liveMatchDataPackage.scoreB}`;

    document.getElementById('live-scorers-team-a').innerHTML = liveMatchDataPackage.scorersA.map(s => `<div>⚽ ${s}</div>`).join('');
    document.getElementById('live-scorers-team-b').innerHTML = liveMatchDataPackage.scorersB.map(s => `<div>⚽ ${s}</div>`).join('');

    renderPurpleCanvasContent();
}

function renderPurpleCanvasContent() {
    const canvas = document.getElementById('purple-dynamic-canvas');
    if (!liveMatchDataPackage) return;

    if (currentPrimaryTab === 'table') {
        canvas.innerHTML = `
            <h3 class="text-base font-bold mb-4 text-gray-800">Tournament Group Standings</h3>
            <table class="w-full text-left text-xs border border-gray-100 rounded-xl overflow-hidden">
                <thead class="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-100">
                    <tr><th class="p-3">Team</th><th class="p-3">MP</th><th class="p-3">W</th><th class="p-3">PTS</th></tr>
                </thead>
                <tbody class="divide-y divide-gray-100 font-medium">
                    <tr><td class="p-3 font-bold text-purple-600">Argentina</td><td class="p-3">3</td><td class="p-3">3</td><td class="p-3 font-black">9</td></tr>
                    <tr><td class="p-3 font-bold text-gray-700">Austria</td><td class="p-3">3</td><td class="p-3">1</td><td class="p-3 font-black">4</td></tr>
                </tbody>
            </table>`;
        return;
    }
    if (currentPrimaryTab === 'teams') {
        canvas.innerHTML = `
            <h3 class="text-base font-bold mb-2 text-gray-800">All Team Information Directory</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-4">
                <div class="p-4 bg-gray-50 rounded-xl border border-gray-100"><div class="font-black text-purple-600">Argentina [CONMEBOL]</div><p class="text-gray-500 mt-1">Manager: Lionel Scaloni<br>Base Camp: Dallas Hub</p></div>
                <div class="p-4 bg-gray-50 rounded-xl border border-gray-100"><div class="font-black text-purple-600">Austria [UEFA]</div><p class="text-gray-500 mt-1">Manager: Ralf Rangnick<br>Base Camp: New York Facility</p></div>
            </div>`;
        return;
    }
    if (currentPrimaryTab === 'more') {
        canvas.innerHTML = `
            <h3 class="text-base font-bold text-gray-800 mb-1">More Options Module</h3>
            <p class="text-xs text-gray-400 font-medium">This section structural blueprint is configured for additional requirements updates sequence instructions.</p>`;
        return;
    }

    if (currentSubTab === 'stats') {
        canvas.innerHTML = `
            <div class="max-w-md mx-auto space-y-4 text-xs font-bold text-gray-700">
                <div class="text-center tracking-widest text-gray-400 uppercase text-[10px] mb-4">Attacking Metrics</div>
                <div>
                    <div class="flex justify-between mb-1"><span>${liveMatchDataPackage.stats?.posA}%</span><span>Possession</span><span>${liveMatchDataPackage.stats?.posB}%</span></div>
                    <div class="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex"><div class="bg-purple-600 h-full" style="width: ${liveMatchDataPackage.stats?.posA}%"></div><div class="bg-gray-200 h-full" style="width: ${liveMatchDataPackage.stats?.posB}%"></div></div>
                </div>
                <div>
                    <div class="flex justify-between mb-1"><span>${liveMatchDataPackage.stats?.shA}</span><span>Shots on Goal</span><span>${liveMatchDataPackage.stats?.shB}</span></div>
                    <div class="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex"><div class="bg-purple-600 h-full" style="width: 70%"></div><div class="bg-gray-200 h-full" style="width: 30%"></div></div>
                </div>
            </div>`;
    } else if (currentSubTab === 'lineups') {
        canvas.innerHTML = `
            <div class="grid grid-cols-2 gap-8 text-xs font-medium text-gray-700">
                <div>
                    <h4 class="font-black uppercase text-purple-600 border-b pb-1 mb-2">${liveMatchDataPackage.teamA}</h4>
                    <ul class="space-y-1">${liveMatchDataPackage.lineups?.teamA.map(p => `<li>• ${p}</li>`).join('')}</ul>
                </div>
                <div>
                    <h4 class="font-black uppercase text-purple-600 border-b pb-1 mb-2 text-right">${liveMatchDataPackage.teamB}</h4>
                    <ul class="space-y-1 text-right">${liveMatchDataPackage.lineups?.teamB.map(p => `<li>${p} •</li>`).join('')}</ul>
                </div>
            </div>`;
    } else if (currentSubTab === 'players') {
        canvas.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                ${liveMatchDataPackage.playerDirectory?.map(p => `
                    <div class="p-4 border border-gray-100 rounded-2xl bg-white shadow-sm flex flex-col justify-between">
                        <div>
                            <div class="flex items-center justify-between"><span class="font-black text-gray-800 text-sm">${p.name}</span><span class="text-lg">${p.asset}</span></div>
                            <div class="text-purple-600 font-bold mt-1">${p.role}</div>
                        </div>
                        <div class="mt-4 pt-2 border-t border-gray-100 flex justify-between font-bold text-gray-400">
                            <span>Age: ${p.age}</span><span class="text-gray-900 font-black">#${p.jersey}</span>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    }
}
