const STORAGE_KEY = 'diary_entries_v2';
const LEGACY_KEY = 'diary_entries';

const dateInput = document.getElementById('dateInput');
const entryInput = document.getElementById('entryInput');
const saveBtn = document.getElementById('saveBtn');
const deleteBtn = document.getElementById('deleteBtn');
const newBtn = document.getElementById('newBtn');
const likeBtn = document.getElementById('likeBtn');
const likeCount = document.getElementById('likeCount');
const tagInput = document.getElementById('tagInput');
const tagChips = document.getElementById('tagChips');
const charCount = document.getElementById('charCount');
const statusText = document.getElementById('statusText');
const searchInput = document.getElementById('searchInput');
const entriesList = document.getElementById('entriesList');
const calGrid = document.getElementById('calGrid');
const calLabel = document.getElementById('calLabel');
const prevMonth = document.getElementById('prevMonth');
const nextMonth = document.getElementById('nextMonth');

let state = {
    entries: {},
    currentDate: todayStr(),
    draftTags: [],
    draftLikes: 0,
    draftLiked: false,
    calendarMonth: new Date(),
    searchQuery: '',
};

function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function loadEntries() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
        const old = JSON.parse(legacy);
        const migrated = {};
        Object.keys(old).forEach(date => {
            migrated[date] = {
                content: old[date],
                tags: [],
                likes: 0,
                liked: false,
                updatedAt: new Date().toISOString(),
            };
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
    }
    return {};
}

function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}

function formatDateLong(s) {
    const d = new Date(s + 'T00:00:00');
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}

function formatDateShort(s) {
    const d = new Date(s + 'T00:00:00');
    return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' });
}

/* ===== Editor binding ===== */
function loadIntoEditor(date) {
    state.currentDate = date;
    dateInput.value = date;
    const entry = state.entries[date];

    if (entry) {
        entryInput.value = entry.content || '';
        state.draftTags = [...(entry.tags || [])];
        state.draftLikes = entry.likes || 0;
        state.draftLiked = !!entry.liked;
        statusText.textContent = `編集中 — ${formatDateLong(date)}`;
    } else {
        entryInput.value = '';
        state.draftTags = [];
        state.draftLikes = 0;
        state.draftLiked = false;
        statusText.textContent = `新しい日記 — ${formatDateLong(date)}`;
    }

    renderTags();
    renderLike();
    updateCharCount();
    renderEntries();
    renderCalendar();
}

function renderTags() {
    tagChips.innerHTML = '';
    state.draftTags.forEach((tag, idx) => {
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        chip.textContent = `#${tag}`;
        const x = document.createElement('button');
        x.textContent = '×';
        x.title = '削除';
        x.onclick = () => {
            state.draftTags.splice(idx, 1);
            renderTags();
        };
        chip.appendChild(x);
        tagChips.appendChild(chip);
    });
}

function renderLike() {
    likeBtn.setAttribute('aria-pressed', state.draftLiked ? 'true' : 'false');
    likeCount.textContent = state.draftLikes;
}

function updateCharCount() {
    const n = entryInput.value.length;
    charCount.textContent = `${n} 文字`;
}

/* ===== Save / Delete ===== */
function saveCurrent() {
    const date = dateInput.value;
    const content = entryInput.value;
    if (!date) {
        statusText.textContent = '日付を入れてね';
        return;
    }
    if (!content.trim() && state.draftTags.length === 0) {
        statusText.textContent = '本文かタグを書いてから保存';
        return;
    }
    state.entries[date] = {
        content,
        tags: [...state.draftTags],
        likes: state.draftLikes,
        liked: state.draftLiked,
        updatedAt: new Date().toISOString(),
    };
    persist();
    state.currentDate = date;
    statusText.textContent = `保存しました — ${formatDateLong(date)}`;
    renderEntries();
    renderCalendar();
}

function deleteCurrent() {
    const date = state.currentDate;
    if (!state.entries[date]) {
        statusText.textContent = '保存されていません';
        return;
    }
    if (!confirm(`${formatDateLong(date)} の日記を削除しますか？`)) return;
    delete state.entries[date];
    persist();
    loadIntoEditor(todayStr());
}

/* ===== Like ===== */
likeBtn.addEventListener('click', () => {
    if (state.draftLiked) {
        state.draftLiked = false;
        state.draftLikes = Math.max(0, state.draftLikes - 1);
    } else {
        state.draftLiked = true;
        state.draftLikes += 1;
    }
    renderLike();
    if (state.entries[state.currentDate]) {
        state.entries[state.currentDate].liked = state.draftLiked;
        state.entries[state.currentDate].likes = state.draftLikes;
        persist();
        renderEntries();
    }
});

/* ===== Tags input ===== */
tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const v = tagInput.value.trim().replace(/^#/, '');
        if (v && !state.draftTags.includes(v)) {
            state.draftTags.push(v);
            renderTags();
        }
        tagInput.value = '';
    } else if (e.key === 'Backspace' && !tagInput.value && state.draftTags.length) {
        state.draftTags.pop();
        renderTags();
    }
});

/* ===== Char count ===== */
entryInput.addEventListener('input', updateCharCount);

/* ===== Date change ===== */
dateInput.addEventListener('change', () => {
    loadIntoEditor(dateInput.value);
});

/* ===== Save / Delete buttons ===== */
saveBtn.addEventListener('click', saveCurrent);
deleteBtn.addEventListener('click', deleteCurrent);
newBtn.addEventListener('click', () => loadIntoEditor(todayStr()));

entryInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        saveCurrent();
    }
});

/* ===== Search ===== */
searchInput.addEventListener('input', () => {
    state.searchQuery = searchInput.value.trim().toLowerCase();
    renderEntries();
});

/* ===== Entries list ===== */
function matchesSearch(entry, q) {
    if (!q) return true;
    const inContent = (entry.content || '').toLowerCase().includes(q);
    const inTags = (entry.tags || []).some(t => t.toLowerCase().includes(q));
    return inContent || inTags;
}

function renderEntries() {
    const dates = Object.keys(state.entries).sort().reverse();
    const filtered = dates.filter(d => matchesSearch(state.entries[d], state.searchQuery));

    entriesList.innerHTML = '';
    if (filtered.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty-state';
        li.textContent = state.searchQuery ? '該当なし' : 'まだ日記がありません';
        entriesList.appendChild(li);
        return;
    }

    filtered.forEach(date => {
        const entry = state.entries[date];
        const li = document.createElement('li');
        li.className = 'entry-item' + (date === state.currentDate ? ' active' : '');
        li.onclick = () => loadIntoEditor(date);

        const dateRow = document.createElement('div');
        dateRow.className = 'entry-item-date';
        const dateSpan = document.createElement('span');
        dateSpan.textContent = formatDateShort(date);
        dateRow.appendChild(dateSpan);
        if (entry.liked) {
            const heart = document.createElement('span');
            heart.className = 'entry-item-like';
            heart.textContent = `♥ ${entry.likes || 1}`;
            dateRow.appendChild(heart);
        }

        const preview = document.createElement('div');
        preview.className = 'entry-item-preview';
        preview.textContent = entry.content || '(本文なし)';

        li.appendChild(dateRow);
        li.appendChild(preview);

        if (entry.tags && entry.tags.length) {
            const meta = document.createElement('div');
            meta.className = 'entry-item-meta';
            entry.tags.slice(0, 4).forEach(t => {
                const tg = document.createElement('span');
                tg.className = 'entry-item-tag';
                tg.textContent = `#${t}`;
                meta.appendChild(tg);
            });
            li.appendChild(meta);
        }

        entriesList.appendChild(li);
    });
}

/* ===== Calendar ===== */
function renderCalendar() {
    const month = state.calendarMonth;
    const year = month.getFullYear();
    const m = month.getMonth();
    calLabel.textContent = `${year}年 ${m + 1}月`;

    calGrid.innerHTML = '';
    const heads = ['日', '月', '火', '水', '木', '金', '土'];
    heads.forEach(h => {
        const c = document.createElement('div');
        c.className = 'cal-cell head';
        c.textContent = h;
        calGrid.appendChild(c);
    });

    const first = new Date(year, m, 1);
    const last = new Date(year, m + 1, 0);
    const startDay = first.getDay();
    const daysInMonth = last.getDate();
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
        if (state.entries[dateStr]) c.classList.add('has-entry');
        if (dateStr === today) c.classList.add('today');
        if (dateStr === state.currentDate) c.classList.add('selected');
        c.textContent = d;
        c.onclick = () => loadIntoEditor(dateStr);
        calGrid.appendChild(c);
    }
}

prevMonth.addEventListener('click', () => {
    state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() - 1, 1);
    renderCalendar();
});
nextMonth.addEventListener('click', () => {
    state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() + 1, 1);
    renderCalendar();
});

/* ===== Init ===== */
state.entries = loadEntries();
loadIntoEditor(todayStr());
