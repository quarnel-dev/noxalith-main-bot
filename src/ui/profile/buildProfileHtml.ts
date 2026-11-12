export interface ProfileCardData {
  displayName: string
  avatarUrl: string | null
  joinedAt: Date | null
  level: number
  reputation: number
  progress: {
    currentXp: number
    requiredXp: number
  } | null
}

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
})

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

export function buildProfileHtml(data: ProfileCardData): string {
  const { displayName, avatarUrl, joinedAt, level, reputation, progress } = data
  const name = escapeHtml(displayName)

  const avatar = avatarUrl
    ? `<img class="avatar" src="${escapeHtml(avatarUrl)}" alt="">`
    : `<span class="avatar" aria-hidden="true">${escapeHtml([...displayName][0]?.toUpperCase() ?? '?')}</span>`

  const joined = joinedAt ? `<p>В Noxalith с ${dateFormat.format(joinedAt)}</p>` : ''

  const footer = progress
    ? `
      <footer class="progress">
        <p class="progress-label">
          <span>До уровня ${numberFormat.format(level + 1)}</span>
          <span>${numberFormat.format(progress.currentXp)} / ${numberFormat.format(progress.requiredXp)} XP</span>
        </p>
        <progress
          aria-label="Прогресс до следующего уровня"
          value="${progress.currentXp}"
          max="${progress.requiredXp}"
        ></progress>
      </footer>`
    : ''

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Профиль · ${name}</title>
  <style>
    * { box-sizing: border-box; }

    body {
      min-height: 100vh;
      margin: 0;
      padding: 16px;
      display: grid;
      place-items: center;
      background: #0c121b;
      color: #edf4fa;
      font-family: Geist, system-ui, sans-serif;
    }

    .card {
      width: min(100%, 510px);
      padding: 19px 22px;
      border: 1px solid #243547;
      border-radius: 12px;
      background:
        radial-gradient(ellipse at 100% 0%, #112438 0%, transparent 62%),
        #050c15;
    }

    .card-header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: start;
      gap: 16px;
    }

    .identity {
      display: flex;
      align-items: center;
      gap: 13px;
      min-width: 0;
    }

    .avatar {
      display: grid;
      place-items: center;
      flex: 0 0 52px;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #162638;
      color: #9ccde8;
      object-fit: cover;
      font-size: 21px;
      font-weight: 600;
    }

    .identity-text { min-width: 0; }

    h1 {
      margin: 0 0 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 22px;
      line-height: 1.1;
      font-weight: 650;
    }

    p { margin: 0; }

    .details, .level-label, .progress-label {
      color: #91a3b6;
      font-size: 12px;
      line-height: 1.4;
    }

    .level {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .level-value {
      display: block;
      color: #9ccde8;
      font-size: 32px;
      line-height: 1;
      font-weight: 650;
    }

    .progress { margin-top: 15px; }

    .progress-label {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
      font-variant-numeric: tabular-nums;
    }

    progress {
      appearance: none;
      display: block;
      width: 100%;
      height: 4px;
      overflow: hidden;
      border: 0;
      border-radius: 2px;
      background: #1b2b3c;
    }

    progress::-webkit-progress-bar { background: #1b2b3c; }
    progress::-webkit-progress-value { background: #9ccde8; }
    progress::-moz-progress-bar { background: #9ccde8; }
  </style>
</head>
<body>
  <main id="profile-card" class="card">
    <header class="card-header">
      <section class="identity" aria-label="Участник">
        ${avatar}
        <div class="identity-text">
          <h1>${name}</h1>
          <div class="details">
            ${joined}
            <p>Репутация ${numberFormat.format(reputation)}</p>
          </div>
        </div>
      </section>
      <p class="level">
        <strong class="level-value">${numberFormat.format(level)}</strong>
        <span class="level-label">Уровень</span>
      </p>
    </header>
    ${footer}
  </main>
</body>
</html>`
}
