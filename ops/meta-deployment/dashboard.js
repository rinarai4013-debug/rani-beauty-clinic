// Meta Commander OS — Dashboard Logic

(function () {
  const SCOREBOARD_PATH = "team-scoreboard.json";

  // Health scoring
  function getHealthColor(score) {
    if (score === null || score === undefined) return "gray";
    if (score >= 90) return "green";
    if (score >= 75) return "green";
    if (score >= 50) return "yellow";
    return "red";
  }

  function getHealthLabel(score) {
    if (score === null || score === undefined) return "Not Started";
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Stable";
    if (score >= 50) return "At Risk";
    return "Blocked";
  }

  function getStatusPill(status) {
    const map = {
      COMPLETE: "pill-green",
      IN_PROGRESS: "pill-blue",
      READY_FOR_REVIEW: "pill-yellow",
      BLOCKED: "pill-red",
      NOT_STARTED: "pill-gray",
      NOT_AVAILABLE: "pill-gray",
      OK: "pill-green",
      EARLY_STAGE: "pill-blue",
    };
    return map[status] || "pill-gray";
  }

  function getProgressColor(rate) {
    if (rate >= 75) return "progress-green";
    if (rate >= 50) return "progress-yellow";
    if (rate > 0) return "progress-red";
    return "progress-gray";
  }

  function getOwnerBadge(score) {
    if (score >= 75) return '<span class="badge badge-ok">OK</span>';
    if (score >= 50) return '<span class="badge badge-warning">Warning</span>';
    return '<span class="badge badge-critical">Critical</span>';
  }

  // Render functions
  function renderHeader(data) {
    return `
      <div class="header">
        <div>
          <h1>Meta Commander OS — Deployment Dashboard</h1>
          <div class="header-meta">${data.meta.deployment_name}</div>
        </div>
        <div class="header-meta">
          Source: META-COMMANDER-OS-v8.md<br>
          Updated: ${new Date(data.meta.last_updated).toLocaleDateString()}
        </div>
      </div>
    `;
  }

  function renderHealthHero(data) {
    const h = data.overall_health;
    const color = getHealthColor(h.score);
    return `
      <div class="health-hero">
        <div class="health-label">Overall Deployment Health</div>
        <div class="health-score-big" style="color: var(--${color})">${h.score}</div>
        <div class="health-sublabel">${getHealthLabel(h.score)}</div>
        <div class="health-stats">
          <div class="health-stat">
            <div class="health-stat-value">${h.phases_complete}/${h.phases_total}</div>
            <div class="health-stat-label">Phases Complete</div>
          </div>
          <div class="health-stat">
            <div class="health-stat-value">${h.completion_rate}%</div>
            <div class="health-stat-label">Completion</div>
          </div>
          <div class="health-stat">
            <div class="health-stat-value" style="color: var(--red)">${h.critical_blockers}</div>
            <div class="health-stat-label">Blockers</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderPhaseCards(data) {
    const cats = data.categories;
    const cards = cats
      .map((c) => {
        const color = getHealthColor(c.health_score);
        const pColor = getProgressColor(c.completion_rate);
        return `
        <div class="card card-${color}">
          <div class="card-header">
            <div>
              <div class="card-title">${c.name}</div>
              <span class="pill ${getStatusPill(c.status)}">${c.status.replace(/_/g, " ")}</span>
            </div>
            <div class="card-score" style="color: var(--${color})">${c.health_score}</div>
          </div>
          <div class="progress-bar"><div class="progress-fill ${pColor}" style="width: ${c.completion_rate}%"></div></div>
          <div class="card-meta">
            ${c.completed_tasks}/${c.total_tasks} tasks &middot;
            ${c.blockers_count} blocker${c.blockers_count !== 1 ? "s" : ""} &middot;
            ${c.overdue_tasks} overdue &middot;
            Owner: ${c.owner}
          </div>
          <div class="card-meta">${c.notes}</div>
        </div>
      `;
      })
      .join("");

    return `
      <div class="section-title"><span class="icon">📊</span> Phase Health Cards</div>
      <div class="grid grid-3">${cards}</div>
    `;
  }

  function renderOwnerBoard(data) {
    const owners = data.owner_summary;
    // Rank owners
    const sorted = [...owners].sort(
      (a, b) => b.average_health_score - a.average_health_score
    );

    const rows = owners
      .map((o) => {
        const color = getHealthColor(o.average_health_score);
        return `
        <tr>
          <td><strong>${o.owner_name}</strong></td>
          <td style="color: var(--${color}); font-weight: 700">${o.average_health_score}</td>
          <td>${o.completed}</td>
          <td>${o.total_assigned}</td>
          <td>${o.overdue > 0 ? `<span style="color: var(--red); font-weight: 600">${o.overdue}</span>` : "0"}</td>
          <td>${o.blocked > 0 ? `<span style="color: var(--red); font-weight: 600">${o.blocked}</span>` : "0"}</td>
          <td><span class="pill ${getStatusPill(o.overall_status.toUpperCase().replace(/ /g, "_"))}">${o.overall_status}</span></td>
          <td>${getOwnerBadge(o.average_health_score)}</td>
        </tr>
      `;
      })
      .join("");

    // Rankings
    const strongest = sorted[0];
    const mostBlocked = [...owners].sort((a, b) => b.blocked - a.blocked)[0];
    const mostOverdue = [...owners].sort((a, b) => b.overdue - a.overdue)[0];

    return `
      <div class="section-title"><span class="icon">👥</span> Owner Performance Board</div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Owner</th><th>Health</th><th>Done</th><th>Total</th>
              <th>Overdue</th><th>Blocked</th><th>Status</th><th>Badge</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="grid grid-3" style="margin-bottom: 24px">
        <div class="card card-green">
          <div class="card-title">Strongest This Cycle</div>
          <div class="card-score" style="color: var(--green)">${strongest ? strongest.owner_name : "—"}</div>
          <div class="card-meta">Health: ${strongest ? strongest.average_health_score : "—"}</div>
        </div>
        <div class="card card-red">
          <div class="card-title">Most Blocked</div>
          <div class="card-score" style="color: var(--red)">${mostBlocked && mostBlocked.blocked > 0 ? mostBlocked.owner_name : "None"}</div>
          <div class="card-meta">${mostBlocked ? mostBlocked.blocked + " blocked tasks" : ""}</div>
        </div>
        <div class="card card-yellow">
          <div class="card-title">Most Overdue</div>
          <div class="card-score" style="color: var(--yellow)">${mostOverdue && mostOverdue.overdue > 0 ? mostOverdue.owner_name : "None"}</div>
          <div class="card-meta">${mostOverdue ? mostOverdue.overdue + " overdue tasks" : ""}</div>
        </div>
      </div>
    `;
  }

  function renderBlockers(data) {
    const blockers = data.blockers || [];
    if (blockers.length === 0) {
      return `
        <div class="section-title"><span class="icon">🚧</span> Blockers Panel</div>
        <div class="card card-green"><div class="card-title">No active blockers</div></div>
      `;
    }

    const rows = blockers
      .filter((b) => !b.resolved)
      .map(
        (b) => `
      <tr>
        <td><strong>${b.id}</strong></td>
        <td>${b.phase}</td>
        <td>${b.description}</td>
        <td><span class="pill ${b.severity === "CRITICAL" ? "pill-red" : "pill-yellow"}">${b.severity}</span></td>
        <td>${b.owner}</td>
        <td>${new Date(b.created).toLocaleDateString()}</td>
      </tr>
    `
      )
      .join("");

    return `
      <div class="section-title"><span class="icon">🚧</span> Blockers Panel (${blockers.filter((b) => !b.resolved).length} active)</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Phase</th><th>Description</th><th>Severity</th><th>Owner</th><th>Created</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  function renderNotifications(data) {
    const notifs = data.notifications || [];
    if (notifs.length === 0) {
      return `
        <div class="section-title"><span class="icon">📨</span> Notifications Sent</div>
        <div class="card card-gray"><div class="card-title">No notifications sent yet</div></div>
      `;
    }

    const rows = [...notifs]
      .reverse()
      .slice(0, 20)
      .map(
        (n) => `
      <tr>
        <td>${new Date(n.timestamp).toLocaleString()}</td>
        <td>${n.subject}</td>
        <td><span class="pill ${getStatusPill(n.status)}">${n.status}</span></td>
        <td>${n.recipient}</td>
        <td>${n.notes || "—"}</td>
      </tr>
    `
      )
      .join("");

    return `
      <div class="section-title"><span class="icon">📨</span> Notifications Sent (${notifs.length} total)</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Time</th><th>Subject</th><th>Status</th><th>Recipient</th><th>Notes</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  function renderCommunityHealth(data) {
    const ch = data.community_health;
    if (!ch) return "";

    const channels = [
      { name: "DMs", data: ch.dm_response },
      { name: "Comments", data: ch.comment_response },
      { name: "Reviews", data: ch.review_response },
      { name: "Escalations", data: ch.escalations },
    ];

    const cards = channels
      .map((c) => {
        const d = c.data;
        const color = getHealthColor(d.health_score);
        return `
        <div class="card card-${color}">
          <div class="card-header">
            <div class="card-title">${c.name}</div>
            <div class="card-score" style="color: var(--${color})">${d.health_score}</div>
          </div>
          <div class="card-meta">
            Status: <span class="pill ${getStatusPill(d.status)}">${d.status.replace(/_/g, " ")}</span>
          </div>
          <div class="card-meta">
            ${d.average_response_time_hours !== null ? `Avg Response: ${d.average_response_time_hours}h` : "No data yet"}
            ${d.backlog_count !== null ? ` &middot; Backlog: ${d.backlog_count}` : ""}
            ${d.sla_compliance_rate !== null ? ` &middot; SLA: ${d.sla_compliance_rate}%` : ""}
          </div>
          <div class="card-meta">${d.notes}</div>
        </div>
      `;
      })
      .join("");

    return `
      <div class="section-title"><span class="icon">💬</span> Community Response Health</div>
      <div class="grid grid-4">${cards}</div>
    `;
  }

  function renderKPISnapshot(data) {
    const kpi = data.weekly_kpi_snapshot;
    if (!kpi || !kpi.week_of) {
      return `
        <div class="section-title"><span class="icon">📈</span> Weekly KPI Snapshot</div>
        <div class="card card-gray">
          <div class="card-title">No KPI data available yet</div>
          <div class="card-meta">KPIs will populate after controlled launch (Phase 9).</div>
          <div class="card-meta" style="margin-top: 8px; font-weight: 600; color: var(--red)">
            CPA / ROAS not trusted unless Gate 1 tracking integrity is verified.
          </div>
        </div>
      `;
    }

    const fmt = (v) => (v !== null ? v : "—");
    const fmtDollar = (v) => (v !== null ? `$${v.toLocaleString()}` : "—");

    return `
      <div class="section-title"><span class="icon">📈</span> Weekly KPI Snapshot — Week of ${kpi.week_of}</div>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-value">${fmtDollar(kpi.spend)}</div>
          <div class="kpi-label">Spend</div>
          <div class="kpi-confidence pill ${getStatusPill(kpi.confidence)}">${kpi.confidence}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${fmt(kpi.leads)}</div>
          <div class="kpi-label">Leads</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${fmt(kpi.booked_consults)}</div>
          <div class="kpi-label">Booked Consults</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${kpi.show_rate !== null ? kpi.show_rate + "%" : "—"}</div>
          <div class="kpi-label">Show Rate</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${fmt(kpi.patient_starts)}</div>
          <div class="kpi-label">Patient Starts</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${fmtDollar(kpi.cpl)}</div>
          <div class="kpi-label">CPL</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${fmtDollar(kpi.cpa)}</div>
          <div class="kpi-label">CPA</div>
          <div class="kpi-confidence pill pill-yellow">PROVISIONAL</div>
        </div>
      </div>
      <div class="grid grid-3">
        <div class="card card-blue">
          <div class="card-title">Top Creative</div>
          <div class="card-meta">${kpi.top_creative || "—"}</div>
        </div>
        <div class="card card-yellow">
          <div class="card-title">Weak Point</div>
          <div class="card-meta">${kpi.weak_point || "—"}</div>
        </div>
        <div class="card card-${kpi.action === "SCALE" ? "green" : kpi.action === "HOLD" ? "yellow" : "red"}">
          <div class="card-title">Action</div>
          <div class="card-score">${kpi.action || "—"}</div>
        </div>
      </div>
      ${!kpi.gate_1_verified ? '<div class="card card-red" style="margin-top: 12px; margin-bottom: 24px"><div class="card-title" style="color: var(--red)">CPA / ROAS not trusted — Gate 1 tracking integrity not verified.</div></div>' : ""}
    `;
  }

  function renderNextActions(data) {
    const blockers = (data.blockers || []).filter((b) => !b.resolved);
    const cats = data.categories || [];
    const actions = [];

    // Generate actions from current state
    const notStarted = cats.filter((c) => c.status === "NOT_STARTED");
    const blocked = cats.filter((c) => c.status === "BLOCKED");

    blockers.forEach((b) => {
      actions.push(`Resolve blocker: ${b.description} (${b.phase})`);
    });

    notStarted.forEach((c) => {
      if (c.name.includes("Tracking")) {
        actions.push(`Start Gate 1: Verify Meta Pixel fires on ranibeautyclinic.com`);
      } else if (c.name.includes("Community")) {
        actions.push(`Assign DM/comment responders and get template approval`);
      }
    });

    if (actions.length === 0) {
      actions.push("All phases on track. Continue monitoring.");
    }

    const items = actions
      .slice(0, 7)
      .map(
        (a, i) => `
      <li class="action-item">
        <span class="action-number">${i + 1}</span>
        <span>${a}</span>
      </li>
    `
      )
      .join("");

    return `
      <div class="section-title"><span class="icon">🎯</span> Next Actions</div>
      <div class="card" style="margin-bottom: 24px">
        <ul class="action-list">${items}</ul>
      </div>
    `;
  }

  function renderFooter() {
    return `
      <div class="footer">
        Rani Beauty Clinic — Meta Commander OS v8.0 Deployment Dashboard<br>
        Source of truth: META-COMMANDER-OS-v8.md &middot; Open team-scoreboard.json to update data
      </div>
    `;
  }

  function renderError(msg) {
    document.getElementById("app").innerHTML = `
      <div class="header">
        <div><h1>Meta Commander OS — Deployment Dashboard</h1></div>
      </div>
      <div class="health-hero">
        <div class="health-label" style="color: var(--red)">Error Loading Data</div>
        <div style="margin-top: 12px; color: var(--text-muted)">${msg}</div>
      </div>
    `;
  }

  // Main render
  function render(data) {
    const app = document.getElementById("app");
    app.innerHTML = [
      renderHeader(data),
      renderHealthHero(data),
      renderPhaseCards(data),
      renderOwnerBoard(data),
      renderBlockers(data),
      renderCommunityHealth(data),
      renderKPISnapshot(data),
      renderNotifications(data),
      renderNextActions(data),
      renderFooter(),
    ].join("");
  }

  // Load data
  async function init() {
    try {
      const resp = await fetch(SCOREBOARD_PATH);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      render(data);
    } catch (e) {
      renderError(
        `Could not load ${SCOREBOARD_PATH}.<br><br>` +
          `If opening from the filesystem, some browsers block local fetch().<br>` +
          `Try: <code>python3 -m http.server 8080</code> in this directory, then open <code>http://localhost:8080/dashboard.html</code>`
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
