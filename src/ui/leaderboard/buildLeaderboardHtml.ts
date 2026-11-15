export interface LeaderboardEntry {
  userId: string
  rank: number
  displayName: string
  avatarUrl: string | null
  level: number
  totalXp: number
}

export interface LeaderboardCardData {
  top: readonly LeaderboardEntry[]
  viewer: LeaderboardEntry | null
}

const numberFormat = new Intl.NumberFormat('ru-RU')

const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => htmlEntities[char]!)
}

function renderAvatar(entry: LeaderboardEntry): string {
  if (entry.avatarUrl) {
    return `<img class="avatar" src="${escapeHtml(entry.avatarUrl)}" alt="">`
  }

  const initial = [...entry.displayName][0]?.toUpperCase() ?? '?'
  return `<span class="avatar" aria-hidden="true">${escapeHtml(initial)}</span>`
}

function renderRow(entry: LeaderboardEntry): string {
  return `
    <li class="row">
      <span class="position">${numberFormat.format(entry.rank)}</span>
      ${renderAvatar(entry)}
      <span class="name">${escapeHtml(entry.displayName)}</span>
      <span class="level">${numberFormat.format(entry.level)}</span>
      <span class="xp">${numberFormat.format(entry.totalXp)}</span>
    </li>`
}

export function buildLeaderboardHtml(data: LeaderboardCardData): string {
  const viewerOutsideTop = data.viewer && !data.top.some((entry) => entry.userId === data.viewer?.userId) ? data.viewer : null

  const rows = data.top.length ? data.top.map(renderRow).join('') : '<li class="empty">Пока никто не получил XP</li>'

  const viewer = viewerOutsideTop
    ? `
      <footer class="self">
        <p class="self-caption">Твоё место</p>
        <ol class="self-list">${renderRow(viewerOutsideTop)}</ol>
      </footer>`
    : ''

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Рейтинг участников Noxalith</title>
  <style>
    * { box-sizing: border-box; }

    body {
      min-height: 100vh;
      margin: 0;
      padding: 16px;
      display: grid;
      place-items: center;
      background: transparent;
      color: #edf4fa;
      font-family: Geist, system-ui, sans-serif;
    }

    .card {
      width: min(100%, 510px);
      padding: 22px;
      border: 1px solid #243547;
      border-radius: 12px;
      overflow: hidden;
      background:
        radial-gradient(ellipse at 100% 0%, #112438 0%, transparent 60%),
        #050c15;
    }

    h1 {
      margin: 0 0 18px;
      font-size: 22px;
      line-height: 1.1;
      font-weight: 650;
      letter-spacing: -0.02em;
    }

    .column-labels,
    .row {
      display: grid;
      grid-template-columns: 29px 31px minmax(0, 1fr) 58px 79px;
      align-items: center;
      column-gap: 9px;
    }

    .column-labels {
      margin-bottom: 5px;
      color: #91a3b6;
      font-size: 10px;
    }

    .column-labels .level-label { text-align: center; }
    .column-labels .xp-label { text-align: right; }

    ol {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .row {
      min-height: 43px;
      border-bottom: 1px solid #182736;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }

    .list .row:last-child { border-bottom: 0; }

    .position {
      color: #91a3b6;
      font-size: 12px;
      font-weight: 600;
    }

    .list .row:nth-child(-n+3) .position {
      color: #9ccde8;
    }

    .avatar {
      display: grid;
      place-items: center;
      width: 29px;
      height: 29px;
      border-radius: 50%;
      background: #17283a;
      color: #9ccde8;
      object-fit: cover;
      font-size: 12px;
      font-weight: 600;
    }

    .name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 550;
    }

    .level {
      color: #91a3b6;
      text-align: center;
    }

    .xp {
      color: #c7d6e3;
      text-align: right;
    }

    .empty {
      padding: 14px 0;
      color: #91a3b6;
      font-size: 12px;
    }

    .self {
      margin-top: 16px;
      padding-top: 13px;
      border-top: 1px solid #314354;
    }

    .self-caption {
      margin: 0 0 5px;
      color: #91a3b6;
      font-size: 11px;
    }

    .self .row {
      min-height: 39px;
      border: 0;
    }

    .self .position,
    .self .xp {
      color: #9ccde8;
    }

    .self .name { font-weight: 650; }
  </style>
</head>
<body>
  <main id="leaderboard-card" class="card">
    <h1>Рейтинг участников</h1>

    <div class="column-labels" aria-hidden="true">
      <span>№</span>
      <span></span>
      <span>Участник</span>
      <span class="level-label">Ур.</span>
      <span class="xp-label">XP</span>
    </div>

    <ol class="list" aria-label="Первые десять участников">
      ${rows}
    </ol>

    ${viewer}
  </main>
</body>
</html>`
}
