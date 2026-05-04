const STORAGE_KEY = 'diary_entries_v2';
const PROFILE_KEY = 'diary_profile_v1';
const SOCIAL_KEYS = ['twitter', 'note', 'facebook', 'hp', 'service'];
const SOCIAL_LABELS = {
    twitter: 'X',
    note: 'note',
    facebook: 'Facebook',
    hp: 'HP',
    service: 'サービス',
};
const SOCIAL_COLORS = {
    twitter: '#000000',
    note: '#41c9b4',
    facebook: '#1877f2',
    hp: '#2f5b3c',
    service: '#a86b3c',
};
const SOCIAL_SVG = {
    twitter: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    note: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="currentColor"/><path d="M7 17V8h2.4l4.5 5.8h.1V8h2.2v9h-2.4l-4.5-5.8H9.2V17z" fill="#fff"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    hp: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2 a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    service: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
};

function escapeHtml(s) {
    return (s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function linkify(text) {
    const escaped = escapeHtml(text);
    return escaped.replace(/(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

const DEFAULT_PHOTO = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
       <rect width='64' height='64' fill='#cde0cb'/>
       <circle cx='32' cy='26' r='11' fill='#6b9b6b'/>
       <path d='M10 60 C 14 44 50 44 54 60 Z' fill='#6b9b6b'/>
     </svg>`
);

const heroPhoto = document.getElementById('heroPhoto');
const heroName = document.getElementById('heroName');
const heroIntro = document.getElementById('heroIntro');
const heroSocials = document.getElementById('heroSocials');
const feed = document.getElementById('feed');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const readerModal = document.getElementById('readerModal');
const readerClose = document.getElementById('readerClose');
const readerOverlay = document.querySelector('.reader-overlay');
const readerDate = document.getElementById('readerDate');
const readerBody = document.getElementById('readerBody');
const readerTags = document.getElementById('readerTags');
const readerLike = document.getElementById('readerLike');
const readerLikeCount = document.getElementById('readerLikeCount');
const readerImages = document.getElementById('readerImages');
const readerTitle = document.getElementById('readerTitle');
const calGrid = document.getElementById('calGrid');
const calLabel = document.getElementById('calLabel');
const prevMonth = document.getElementById('prevMonth');
const nextMonth = document.getElementById('nextMonth');
const popularList = document.getElementById('popularList');

let calendarMonth = new Date();

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

let state = {
    entries: {},
    profile: { name: '', intro: '', photo: '', socials: {} },
    query: '',
    currentDate: null,
};

function loadEntries() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}
function loadProfile() {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{"name":"","intro":"","photo":"","socials":{}}');
}
function persistEntries() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}

function formatLong(s) {
    const d = new Date(s + 'T00:00:00');
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}
function dayParts(s) {
    const d = new Date(s + 'T00:00:00');
    return {
        day: d.getDate(),
        month: d.toLocaleDateString('ja-JP', { month: 'short' }),
        year: d.getFullYear(),
    };
}

function renderProfile() {
    heroPhoto.src = state.profile.photo || DEFAULT_PHOTO;
    heroName.textContent = state.profile.name || '名前未設定';
    heroIntro.textContent = state.profile.intro || '';
    heroIntro.style.display = state.profile.intro ? '' : 'none';

    heroSocials.innerHTML = '';
    const socials = state.profile.socials || {};
    SOCIAL_KEYS.forEach(k => {
        if (!socials[k]) return;
        const a = document.createElement('a');
        a.className = 'social-icon';
        a.href = socials[k];
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.title = SOCIAL_LABELS[k];
        a.innerHTML = SOCIAL_SVG[k];
        a.style.color = SOCIAL_COLORS[k];
        heroSocials.appendChild(a);
    });
}

function matchesSearch(entry, q) {
    if (!q) return true;
    return (entry.content || '').toLowerCase().includes(q) ||
        (entry.tags || []).some(t => t.toLowerCase().includes(q));
}

function renderFeed() {
    const dates = Object.keys(state.entries).sort().reverse();
    const published = dates.filter(d => state.entries[d].published);
    const filtered = published.filter(d => matchesSearch(state.entries[d], state.query));

    feed.innerHTML = '';
    if (filtered.length === 0) {
        emptyState.hidden = false;
        emptyState.textContent = state.query
            ? '該当する日記が見つかりません'
            : 'まだ公開された日記はありません';
        return;
    }
    emptyState.hidden = true;

    filtered.forEach(date => {
        const entry = state.entries[date];
        const card = document.createElement('article');
        card.className = 'feed-card';
        card.onclick = () => openReader(date);

        const dateBlock = document.createElement('div');
        dateBlock.className = 'feed-card-date';
        const parts = dayParts(date);
        const day = document.createElement('div');
        day.className = 'feed-card-day';
        day.textContent = parts.day;
        const month = document.createElement('div');
        month.className = 'feed-card-month';
        month.textContent = parts.month;
        const year = document.createElement('div');
        year.className = 'feed-card-year';
        year.textContent = parts.year;
        dateBlock.appendChild(day);
        dateBlock.appendChild(month);
        dateBlock.appendChild(year);

        const main = document.createElement('div');
        main.className = 'feed-card-main';

        if (entry.title) {
            const titleEl = document.createElement('h3');
            titleEl.className = 'feed-card-title';
            titleEl.textContent = entry.title;
            main.appendChild(titleEl);
        }

        if (entry.images && entry.images.length) {
            const cover = document.createElement('div');
            cover.className = 'feed-card-cover';
            const img = document.createElement('img');
            img.src = entry.images[0];
            img.loading = 'lazy';
            img.alt = '';
            cover.appendChild(img);
            if (entry.images.length > 1) {
                const badge = document.createElement('span');
                badge.className = 'feed-card-cover-count';
                badge.textContent = `+${entry.images.length - 1}`;
                cover.appendChild(badge);
            }
            main.appendChild(cover);
        }

        const body = document.createElement('div');
        body.className = 'feed-card-body';
        if (entry.content) {
            body.innerHTML = linkify(entry.content);
        } else {
            body.textContent = '(本文なし)';
        }
        main.appendChild(body);

        const meta = document.createElement('div');
        meta.className = 'feed-card-meta';
        const tags = document.createElement('div');
        tags.className = 'feed-tags';
        (entry.tags || []).slice(0, 5).forEach(t => {
            const tg = document.createElement('span');
            tg.className = 'feed-tag';
            tg.textContent = `#${t}`;
            tags.appendChild(tg);
        });
        meta.appendChild(tags);
        if (entry.likes) {
            const likes = document.createElement('span');
            likes.className = 'feed-likes';
            likes.textContent = `♥ ${entry.likes}`;
            meta.appendChild(likes);
        }
        main.appendChild(meta);

        card.appendChild(dateBlock);
        card.appendChild(main);
        feed.appendChild(card);
    });
}

function openReader(date) {
    const entry = state.entries[date];
    if (!entry) return;
    state.currentDate = date;
    readerDate.textContent = formatLong(date);
    if (entry.title) {
        readerTitle.textContent = entry.title;
        readerTitle.hidden = false;
    } else {
        readerTitle.hidden = true;
    }
    readerImages.innerHTML = '';
    if (entry.images && entry.images.length) {
        entry.images.forEach(src => {
            const img = document.createElement('img');
            img.className = 'reader-image';
            img.src = src;
            img.loading = 'lazy';
            img.onclick = () => window.open(src, '_blank');
            readerImages.appendChild(img);
        });
        readerImages.hidden = false;
    } else {
        readerImages.hidden = true;
    }
    readerBody.innerHTML = linkify(entry.content || '');
    readerTags.innerHTML = '';
    (entry.tags || []).forEach(t => {
        const tg = document.createElement('span');
        tg.className = 'feed-tag';
        tg.textContent = `#${t}`;
        readerTags.appendChild(tg);
    });
    updateReaderLike();
    readerModal.hidden = false;
    document.body.style.overflow = 'hidden';
}

function closeReader() {
    readerModal.hidden = true;
    state.currentDate = null;
    document.body.style.overflow = '';
}

function updateReaderLike() {
    const entry = state.entries[state.currentDate];
    if (!entry) return;
    readerLike.setAttribute('aria-pressed', entry.liked ? 'true' : 'false');
    readerLike.querySelector('.heart').textContent = entry.liked ? '♥' : '♡';
    readerLikeCount.textContent = entry.likes || 0;
}

readerLike.addEventListener('click', () => {
    const entry = state.entries[state.currentDate];
    if (!entry) return;
    if (entry.liked) {
        entry.liked = false;
        entry.likes = Math.max(0, (entry.likes || 0) - 1);
    } else {
        entry.liked = true;
        entry.likes = (entry.likes || 0) + 1;
    }
    persistEntries();
    updateReaderLike();
    renderFeed();
    renderPopular();
});

readerClose.addEventListener('click', closeReader);
readerOverlay.addEventListener('click', closeReader);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !readerModal.hidden) closeReader();
});

searchInput.addEventListener('input', () => {
    state.query = searchInput.value.trim().toLowerCase();
    renderFeed();
});

function renderCalendar() {
    const year = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    calLabel.textContent = `${year}年 ${m + 1}月`;
    calGrid.innerHTML = '';
    ['日', '月', '火', '水', '木', '金', '土'].forEach(h => {
        const c = document.createElement('div');
        c.className = 'cal-cell head';
        c.textContent = h;
        calGrid.appendChild(c);
    });
    const startDay = new Date(year, m, 1).getDay();
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const today = todayStr();
    for (let i = 0; i < startDay; i++) {
        const c = document.createElement('div');
        c.className = 'cal-cell empty';
        calGrid.appendChild(c);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const c = document.createElement('div');
        c.className = 'cal-cell';
        c.textContent = d;
        const entry = state.entries[dateStr];
        if (entry && entry.published) {
            c.classList.add('has-entry');
            c.onclick = () => openReader(dateStr);
        }
        if (dateStr === today) c.classList.add('today');
        calGrid.appendChild(c);
    }
}

prevMonth.addEventListener('click', () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    renderCalendar();
});
nextMonth.addEventListener('click', () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    renderCalendar();
});

function shortMonthDay(s) {
    const d = new Date(s + 'T00:00:00');
    return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

function renderPopular() {
    popularList.innerHTML = '';
    const dates = Object.keys(state.entries);
    const ranked = dates
        .filter(d => state.entries[d].published && (state.entries[d].likes || 0) > 0)
        .sort((a, b) => (state.entries[b].likes || 0) - (state.entries[a].likes || 0))
        .slice(0, 5);

    if (ranked.length === 0) {
        const li = document.createElement('li');
        li.className = 'popular-empty';
        li.textContent = 'まだ人気の日記はありません';
        popularList.appendChild(li);
        return;
    }
    ranked.forEach((date, idx) => {
        const entry = state.entries[date];
        const li = document.createElement('li');
        li.className = 'popular-item';
        li.onclick = () => openReader(date);

        const head = document.createElement('div');
        head.className = 'popular-head';
        const rank = document.createElement('span');
        rank.className = 'popular-rank';
        rank.textContent = `${idx + 1}.`;
        const date_ = document.createElement('span');
        date_.className = 'popular-date';
        date_.textContent = shortMonthDay(date);
        const likes = document.createElement('span');
        likes.className = 'popular-likes';
        likes.textContent = `♥ ${entry.likes}`;
        head.appendChild(rank);
        head.appendChild(date_);
        head.appendChild(likes);

        const preview = document.createElement('div');
        preview.className = 'popular-preview';
        preview.textContent = entry.title || entry.content || '(本文なし)';

        li.appendChild(head);
        li.appendChild(preview);
        popularList.appendChild(li);
    });
}

function renderAll() {
    renderProfile();
    renderFeed();
    renderCalendar();
    renderPopular();
}

let usingDataJson = false;

async function loadFromDataJson() {
    try {
        const res = await fetch('data.json', { cache: 'no-cache' });
        if (!res.ok) return null;
        const data = await res.json();
        return {
            entries: data.entries || {},
            profile: data.profile || { name: '', intro: '', photo: '', socials: {} },
        };
    } catch (e) {
        return null;
    }
}

window.addEventListener('storage', (e) => {
    if (usingDataJson) return;
    if (e.key === STORAGE_KEY || e.key === PROFILE_KEY) {
        state.entries = loadEntries();
        state.profile = loadProfile();
        renderAll();
    }
});

(async () => {
    const fromJson = await loadFromDataJson();
    if (fromJson) {
        usingDataJson = true;
        state.entries = fromJson.entries;
        state.profile = fromJson.profile;
    } else {
        state.entries = loadEntries();
        state.profile = loadProfile();
    }
    renderAll();
})();

window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('loaded');
    }, 900);
});
