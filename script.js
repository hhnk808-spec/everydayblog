const STORAGE_KEY = 'diary_entries_v2';
const LEGACY_KEY = 'diary_entries';
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
const EMOJI_LIST = ['😊','😄','🥰','😂','😴','😅','😎','🤔','💪','✨','🎉','🌱','🌸','🌷','🌿','🍀','☀️','⛅','🌙','⭐','💡','📝','📚','☕','🍵','🍰','💼','📈','🎯','❤️','💚','🔥','⚡','🙌','👏','🎀','🌈','🥳','🙏','🤝'];

const dateInput = document.getElementById('dateInput');
const titleInput = document.getElementById('titleInput');
const entryInput = document.getElementById('entryInput');
const saveBtn = document.getElementById('saveBtn');
const deleteBtn = document.getElementById('deleteBtn');
const newBtn = document.getElementById('newBtn');
const likeBtn = document.getElementById('likeBtn');
const likeCount = document.getElementById('likeCount');
const publishBtn = document.getElementById('publishBtn');
const publishLabel = document.getElementById('publishLabel');
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

const photoWrap = document.getElementById('photoWrap');
const photoInput = document.getElementById('photoInput');
const profilePhoto = document.getElementById('profilePhoto');
const profileNameView = document.getElementById('profileNameView');
const profileNameInput = document.getElementById('profileNameInput');
const profileIntroView = document.getElementById('profileIntroView');
const profileIntroInput = document.getElementById('profileIntroInput');
const introCount = document.getElementById('introCount');
const introEditWrap = document.querySelector('.intro-edit-wrap');
const socialsView = document.getElementById('socialsView');
const socialsEdit = document.getElementById('socialsEdit');
const profileEditBtn = document.getElementById('profileEditBtn');
const profileSaveBtn = document.getElementById('profileSaveBtn');
const profileCancelBtn = document.getElementById('profileCancelBtn');

const DEFAULT_PHOTO = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
       <rect width='64' height='64' fill='#cde0cb'/>
       <circle cx='32' cy='26' r='11' fill='#6b9b6b'/>
       <path d='M10 60 C 14 44 50 44 54 60 Z' fill='#6b9b6b'/>
     </svg>`
);

let state = {
    entries: {},
    profile: { name: '', intro: '', photo: '', socials: {} },
    currentDate: todayStr(),
    draftTags: [],
    draftLikes: 0,
    draftLiked: false,
    draftPublished: false,
    draftImages: [],
    calendarMonth: new Date(),
    searchQuery: '',
    profileEditing: false,
};

let autoSaveTimer = null;
let lastAutoSavedSignature = '';
let suppressAutoSave = false;

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ===== Storage ===== */
function loadEntries() {
    let entries;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        entries = JSON.parse(raw);
    } else {
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
            const old = JSON.parse(legacy);
            entries = {};
            Object.keys(old).forEach(date => {
                entries[date] = {
                    content: old[date], tags: [], likes: 0, liked: false,
                    published: true,
                    updatedAt: new Date().toISOString(),
                };
            });
        } else {
            return {};
        }
    }
    let changed = !raw;
    Object.keys(entries).forEach(date => {
        if (entries[date].published === undefined) {
            entries[date].published = true;
            changed = true;
        }
    });
    if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return entries;
}
function persistEntries() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}
function loadProfile() {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
    return { name: '', intro: '', photo: '', socials: {} };
}
function persistProfile() {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile));
}

/* ===== Date helpers ===== */
function formatDateLong(s) {
    const d = new Date(s + 'T00:00:00');
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}
function formatDateShort(s) {
    const d = new Date(s + 'T00:00:00');
    return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' });
}

/* ===== Profile ===== */
function renderProfile() {
    profileNameView.textContent = state.profile.name || '名前を設定';
    profileIntroView.textContent = state.profile.intro || '自己紹介を書きましょう';
    profilePhoto.src = state.profile.photo || DEFAULT_PHOTO;
    renderSocials();
}

function renderSocials() {
    socialsView.innerHTML = '';
    SOCIAL_KEYS.forEach(key => {
        const url = state.profile.socials[key];
        const el = document.createElement(url ? 'a' : 'span');
        el.className = 'social-icon' + (url ? '' : ' disabled');
        el.title = SOCIAL_LABELS[key];
        el.innerHTML = SOCIAL_SVG[key];
        if (url) {
            el.href = url;
            el.target = '_blank';
            el.rel = 'noopener noreferrer';
            el.style.color = SOCIAL_COLORS[key];
        }
        socialsView.appendChild(el);
    });
}

function setProfileEditMode(editing) {
    state.profileEditing = editing;

    profileNameView.hidden = editing;
    profileNameInput.hidden = !editing;
    profileIntroView.hidden = editing;
    introEditWrap.hidden = !editing;
    socialsView.hidden = editing;
    socialsEdit.hidden = !editing;
    profileEditBtn.hidden = editing;
    profileSaveBtn.hidden = !editing;
    profileCancelBtn.hidden = !editing;

    if (editing) {
        profileNameInput.value = state.profile.name || '';
        profileIntroInput.value = state.profile.intro || '';
        introCount.textContent = profileIntroInput.value.length;
        socialsEdit.querySelectorAll('input').forEach(inp => {
            inp.value = state.profile.socials[inp.dataset.key] || '';
        });
    }
}

profileEditBtn.addEventListener('click', () => setProfileEditMode(true));
profileCancelBtn.addEventListener('click', () => setProfileEditMode(false));
profileSaveBtn.addEventListener('click', () => {
    state.profile.name = profileNameInput.value.trim();
    state.profile.intro = profileIntroInput.value.trim();
    const socials = {};
    socialsEdit.querySelectorAll('input').forEach(inp => {
        const v = inp.value.trim();
        if (v) socials[inp.dataset.key] = v;
    });
    state.profile.socials = socials;
    persistProfile();
    renderProfile();
    setProfileEditMode(false);
});
profileIntroInput.addEventListener('input', () => {
    introCount.textContent = profileIntroInput.value.length;
});

photoWrap.addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            const max = 240;
            const scale = Math.min(1, max / Math.max(img.width, img.height));
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            state.profile.photo = dataUrl;
            persistProfile();
            renderProfile();
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    photoInput.value = '';
});

/* ===== Editor ===== */
function loadIntoEditor(date, { flush = true } = {}) {
    if (flush) flushAutoSave();
    suppressAutoSave = true;
    state.currentDate = date;
    dateInput.value = date;
    const entry = state.entries[date];
    if (entry) {
        titleInput.value = entry.title || '';
        entryInput.value = entry.content || '';
        state.draftTags = [...(entry.tags || [])];
        state.draftLikes = entry.likes || 0;
        state.draftLiked = !!entry.liked;
        state.draftPublished = !!entry.published;
        state.draftImages = [...(entry.images || [])];
        statusText.textContent = `編集中 — ${formatDateLong(date)}`;
    } else {
        titleInput.value = '';
        entryInput.value = '';
        state.draftTags = [];
        state.draftLikes = 0;
        state.draftLiked = false;
        state.draftPublished = true;
        state.draftImages = [];
        statusText.textContent = `新しい日記 — ${formatDateLong(date)}`;
    }
    renderTags();
    renderLike();
    renderPublish();
    renderImages();
    updateCharCount();
    renderEntries();
    renderCalendar();
    setSavedSignature(date);
    suppressAutoSave = false;
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
            scheduleAutoSave();
        };
        chip.appendChild(x);
        tagChips.appendChild(chip);
    });
}

function renderLike() {
    likeBtn.setAttribute('aria-pressed', state.draftLiked ? 'true' : 'false');
    likeBtn.querySelector('.heart').textContent = state.draftLiked ? '♥' : '♡';
    likeCount.textContent = state.draftLikes;
}

function renderPublish() {
    publishBtn.setAttribute('aria-pressed', state.draftPublished ? 'true' : 'false');
    publishLabel.textContent = state.draftPublished ? '公開中' : '下書き';
}

function updateCharCount() {
    charCount.textContent = `${entryInput.value.length} 文字`;
}

function hasDraftContent() {
    return !!(
        titleInput.value.trim()
        || entryInput.value.trim()
        || state.draftTags.length
        || state.draftImages.length
    );
}

function getDraftSignature(date = dateInput.value) {
    return JSON.stringify({
        date,
        title: titleInput.value.trim(),
        content: entryInput.value,
        tags: state.draftTags,
        likes: state.draftLikes,
        liked: state.draftLiked,
        published: state.draftPublished,
        images: state.draftImages,
    });
}

function setSavedSignature(date = dateInput.value) {
    lastAutoSavedSignature = getDraftSignature(date);
}

function saveCurrent({ silent = false, date = dateInput.value } = {}) {
    const content = entryInput.value;
    if (!date) {
        if (!silent) statusText.textContent = '日付を入れてね';
        return false;
    }
    if (!hasDraftContent()) {
        if (!silent) statusText.textContent = '題名・本文・タグのいずれかを入れてから保存';
        return false;
    }
    state.entries[date] = {
        title: titleInput.value.trim(),
        content,
        tags: [...state.draftTags],
        likes: state.draftLikes,
        liked: state.draftLiked,
        published: state.draftPublished,
        images: [...state.draftImages],
        updatedAt: new Date().toISOString(),
    };
    persistEntries();
    state.currentDate = date;
    setSavedSignature(date);
    statusText.textContent = silent
        ? `自動保存しました — ${new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`
        : `保存しました — ${formatDateLong(date)}`;
    renderEntries();
    renderCalendar();
    return true;
}

function autoSaveCurrent(date = dateInput.value) {
    if (suppressAutoSave || !hasDraftContent()) return;
    const signature = getDraftSignature(date);
    if (signature === lastAutoSavedSignature) return;
    saveCurrent({ silent: true, date });
}

function scheduleAutoSave() {
    if (suppressAutoSave) return;
    clearTimeout(autoSaveTimer);
    if (!hasDraftContent()) return;
    statusText.textContent = '自動保存待ち...';
    autoSaveTimer = setTimeout(autoSaveCurrent, 700);
}

function flushAutoSave(date = dateInput.value) {
    clearTimeout(autoSaveTimer);
    autoSaveCurrent(date);
}

function deleteCurrent() {
    const date = state.currentDate;
    if (!state.entries[date]) { statusText.textContent = '保存されていません'; return; }
    if (!confirm(`${formatDateLong(date)} の日記を削除しますか？`)) return;
    delete state.entries[date];
    persistEntries();
    loadIntoEditor(todayStr());
}

publishBtn.addEventListener('click', () => {
    state.draftPublished = !state.draftPublished;
    renderPublish();
    const saved = saveCurrent({ silent: true });
    statusText.textContent = saved
        ? (state.draftPublished
            ? `公開しました — ${formatDateLong(state.currentDate)}`
            : `下書きに戻しました — ${formatDateLong(state.currentDate)}`)
        : `公開設定: ${state.draftPublished ? '公開中' : '下書き'}`;
});

likeBtn.addEventListener('click', () => {
    if (state.draftLiked) {
        state.draftLiked = false;
        state.draftLikes = Math.max(0, state.draftLikes - 1);
    } else {
        state.draftLiked = true;
        state.draftLikes += 1;
    }
    renderLike();
    scheduleAutoSave();
});

tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const v = tagInput.value.trim().replace(/^#/, '');
        if (v && !state.draftTags.includes(v)) {
            state.draftTags.push(v);
            renderTags();
            scheduleAutoSave();
        }
        tagInput.value = '';
    } else if (e.key === 'Backspace' && !tagInput.value && state.draftTags.length) {
        state.draftTags.pop();
        renderTags();
        scheduleAutoSave();
    }
});

titleInput.addEventListener('input', scheduleAutoSave);
entryInput.addEventListener('input', () => {
    updateCharCount();
    scheduleAutoSave();
});
dateInput.addEventListener('change', () => {
    flushAutoSave(state.currentDate);
    loadIntoEditor(dateInput.value, { flush: false });
});
saveBtn.addEventListener('click', saveCurrent);
deleteBtn.addEventListener('click', deleteCurrent);
newBtn.addEventListener('click', () => loadIntoEditor(todayStr()));
entryInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        saveCurrent();
    }
});
window.addEventListener('beforeunload', () => flushAutoSave());
document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushAutoSave();
});

/* ===== Search ===== */
searchInput.addEventListener('input', () => {
    state.searchQuery = searchInput.value.trim().toLowerCase();
    renderEntries();
});

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
        const left = document.createElement('span');
        left.style.display = 'inline-flex';
        left.style.alignItems = 'center';
        left.style.gap = '6px';
        const dateSpan = document.createElement('span');
        dateSpan.textContent = formatDateShort(date);
        left.appendChild(dateSpan);
        if (entry.published) {
            const pub = document.createElement('span');
            pub.className = 'entry-item-pub';
            pub.textContent = '公開';
            left.appendChild(pub);
        }
        dateRow.appendChild(left);
        if (entry.liked) {
            const heart = document.createElement('span');
            heart.className = 'entry-item-like';
            heart.textContent = `♥ ${entry.likes || 1}`;
            dateRow.appendChild(heart);
        }
        li.appendChild(dateRow);
        if (entry.title) {
            const titleDiv = document.createElement('div');
            titleDiv.className = 'entry-item-title';
            titleDiv.textContent = entry.title;
            li.appendChild(titleDiv);
        }
        const preview = document.createElement('div');
        preview.className = 'entry-item-preview';
        preview.textContent = entry.content || (entry.title ? '' : '(本文なし)');
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
    ['日', '月', '火', '水', '木', '金', '土'].forEach(h => {
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

/* ===== Images ===== */
const addImageBtn = document.getElementById('addImageBtn');
const imageInput = document.getElementById('imageInput');
const imageStrip = document.getElementById('imageStrip');

function renderImages() {
    imageStrip.querySelectorAll('.image-thumb').forEach(el => el.remove());
    state.draftImages.forEach((src, idx) => {
        const wrap = document.createElement('div');
        wrap.className = 'image-thumb';
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        const rm = document.createElement('button');
        rm.className = 'image-thumb-remove';
        rm.type = 'button';
        rm.textContent = '×';
        rm.title = '削除';
        rm.onclick = (e) => {
            e.stopPropagation();
            state.draftImages.splice(idx, 1);
            renderImages();
            scheduleAutoSave();
        };
        wrap.appendChild(img);
        wrap.appendChild(rm);
        imageStrip.appendChild(wrap);
    });
}

function compressImage(file, maxDim = 1200, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
                const w = Math.round(img.width * scale);
                const h = Math.round(img.height * scale);
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = ev.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

addImageBtn.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    statusText.textContent = `画像を処理中... (${files.length})`;
    for (const file of files) {
        try {
            const dataUrl = await compressImage(file);
            state.draftImages.push(dataUrl);
        } catch (err) {
            console.error('image error', err);
        }
    }
    renderImages();
    scheduleAutoSave();
    imageInput.value = '';
});

/* ===== Emoji picker ===== */
const emojiBtn = document.getElementById('emojiBtn');
const emojiPicker = document.getElementById('emojiPicker');

function buildEmojiPicker() {
    EMOJI_LIST.forEach(e => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = e;
        b.onclick = (ev) => {
            ev.preventDefault();
            insertAtCursor(entryInput, e);
            scheduleAutoSave();
            emojiPicker.hidden = true;
        };
        emojiPicker.appendChild(b);
    });
}

function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    textarea.value = before + text + after;
    textarea.focus();
    const pos = start + text.length;
    textarea.selectionStart = textarea.selectionEnd = pos;
    updateCharCount();
}

emojiBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    emojiPicker.hidden = !emojiPicker.hidden;
});
document.addEventListener('click', (e) => {
    if (!emojiPicker.hidden && !emojiPicker.contains(e.target) && e.target !== emojiBtn) {
        emojiPicker.hidden = true;
    }
});

/* ===== Export to data.json ===== */
const exportBtn = document.getElementById('exportBtn');
exportBtn.addEventListener('click', () => {
    const payload = {
        entries: state.entries,
        profile: state.profile,
        exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    statusText.textContent = 'data.json をダウンロードしました — リポジトリのルートに置いて push';
});

/* ===== Import / restore from data.json ===== */
const importBtn = document.getElementById('importBtn');

async function fetchDataJson() {
    const res = await fetch('data.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('data.json が見つかりません (' + res.status + ')');
    return res.json();
}

// Merge data.json into current state.
// overwrite=true : data.json wins on same date (local-only dates are kept).
// overwrite=false: local wins on same date (used for silent auto-seed).
// Returns the number of entries in data.json.
function mergeImported(data, { overwrite }) {
    const imported = (data && data.entries) || {};
    state.entries = overwrite
        ? { ...state.entries, ...imported }
        : { ...imported, ...state.entries };
    persistEntries();

    if (data && data.profile) {
        const p = state.profile;
        const localEmpty = !p.name && !p.intro && !p.photo
            && (!p.socials || Object.keys(p.socials).length === 0);
        if (overwrite || localEmpty) {
            state.profile = {
                name: '', intro: '', photo: '', socials: {},
                ...data.profile,
                socials: { ...(data.profile.socials || {}) },
            };
            persistProfile();
            renderProfile();
        }
    }
    return Object.keys(imported).length;
}

function refreshAfterImport() {
    loadIntoEditor(state.currentDate); // re-renders entries, calendar and editor
}

// Auto-seed when this browser has never stored any diary (fresh browser/origin).
// data.json (committed to the repo) is the source of truth in that case.
async function autoSeedIfEmpty() {
    const untouched = localStorage.getItem(STORAGE_KEY) === null
        && localStorage.getItem(LEGACY_KEY) === null;
    if (!untouched) return;
    try {
        const data = await fetchDataJson();
        const count = mergeImported(data, { overwrite: false });
        if (count > 0) {
            refreshAfterImport();
            statusText.textContent = `data.json から ${count} 件を復元しました`;
        }
    } catch (e) {
        // Silent: e.g. opened via file:// or data.json not served. Manual import still available.
        console.warn('auto-seed skipped:', e.message);
    }
}

importBtn.addEventListener('click', async () => {
    statusText.textContent = 'data.json を読み込み中...';
    try {
        const data = await fetchDataJson();
        const importedCount = data.entries ? Object.keys(data.entries).length : 0;
        const localCount = Object.keys(state.entries).length;
        if (localCount > 0) {
            const ok = confirm(
                `現在このブラウザに ${localCount} 件の日記があります。\n` +
                `data.json の ${importedCount} 件を取り込みます。\n` +
                `同じ日付は data.json の内容で上書きされます（ローカルだけの日付は残ります）。\n\n続けますか？`
            );
            if (!ok) { statusText.textContent = '取り込みをキャンセルしました'; return; }
        }
        const count = mergeImported(data, { overwrite: true });
        refreshAfterImport();
        statusText.textContent = `data.json から取り込みました（${count} 件）`;
    } catch (e) {
        statusText.textContent = '取り込み失敗: ' + e.message;
        console.error(e);
    }
});

/* ===== Init ===== */
state.entries = loadEntries();
state.profile = loadProfile();
buildEmojiPicker();
renderProfile();
loadIntoEditor(todayStr());
autoSeedIfEmpty();
