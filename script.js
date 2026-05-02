const STORAGE_KEY = 'diary_entries_v2';
const LEGACY_KEY = 'diary_entries';
const PROFILE_KEY = 'profile_info';

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

// Profile elements
const profilePhoto = document.getElementById('profilePhoto');
const photoInput = document.getElementById('photoInput');
const photoChangeBtn = document.getElementById('photoChangeBtn');
const profileName = document.getElementById('profileName');
const profileBio = document.getElementById('profileBio');
const twitterLink = document.getElementById('twitterLink');
const noteLink = document.getElementById('noteLink');
const facebookLink = document.getElementById('facebookLink');
const hpLink = document.getElementById('hpLink');
const serviceLink = document.getElementById('serviceLink');
const editProfileBtn = document.getElementById('editProfileBtn');

let state = {
    entries: {},
    currentDate: todayStr(),
    draftTags: [],
    draftLikes: 0,
    draftLiked: false,
    calendarMonth: new Date(),
    searchQuery: '',
    profile: {
        name: '',
        bio: '',
        photo: null,
        twitter: '',
        note: '',
        facebook: '',
        hp: '',
        service: '',
    },
    editingProfile: false,
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

/* ===== Profile Management ===== */
function loadProfile() {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
        state.profile = JSON.parse(raw);
    }
    renderProfile();
}

function saveProfile() {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile));
    state.editingProfile = false;
    editProfileBtn.textContent = 'プロフィール編集';
    profileName.readOnly = true;
    profileBio.readOnly = true;
    renderProfile();
}

function renderProfile() {
    profileName.value = state.profile.name || '';
    profileBio.value = state.profile.bio || '';

    if (state.profile.photo) {
        profilePhoto.src = state.profile.photo;
    }

    twitterLink.href = state.profile.twitter || '#';
    twitterLink.style.opacity = state.profile.twitter ? '1' : '0.3';
    twitterLink.style.pointerEvents = state.profile.twitter ? 'auto' : 'none';

    noteLink.href = state.profile.note || '#';
    noteLink.style.opacity = state.profile.note ? '1' : '0.3';
    noteLink.style.pointerEvents = state.profile.note ? 'auto' : 'none';

    facebookLink.href = state.profile.facebook || '#';
    facebookLink.style.opacity = state.profile.facebook ? '1' : '0.3';
    facebookLink.style.pointerEvents = state.profile.facebook ? 'auto' : 'none';

    hpLink.href = state.profile.hp || '#';
    hpLink.style.opacity = state.profile.hp ? '1' : '0.3';
    hpLink.style.pointerEvents = state.profile.hp ? 'auto' : 'none';

    serviceLink.href = state.profile.service || '#';
    serviceLink.style.opacity = state.profile.service ? '1' : '0.3';
    serviceLink.style.pointerEvents = state.profile.service ? 'auto' : 'none';
}

photoChangeBtn.addEventListener('click', () => {
    photoInput.click();
});

photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            state.profile.photo = event.target.result;
            profilePhoto.src = state.profile.photo;
            if (state.editingProfile) {
                saveProfile();
            }
        };
        reader.readAsDataURL(file);
    }
});

editProfileBtn.addEventListener('click', () => {
    state.editingProfile = !state.editingProfile;

    if (state.editingProfile) {
        editProfileBtn.textContent = '保存';
        profileName.readOnly = false;
        profileBio.readOnly = false;
        profileName.focus();
    } else {
        state.profile.name = profileName.value;
        state.profile.bio = profileBio.value;
        saveProfile();
    }
});

profileName.addEventListener('blur', () => {
    if (state.editingProfile) {
        state.profile.name = profileName.value;
    }
});

profileBio.addEventListener('blur', () => {
    if (state.editingProfile) {
        state.profile.bio = profileBio.value;
    }
});

// Create a modal for editing SNS links
const createProfileModal = () => {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:none;z-index:1000;';
    modal.id = 'profileModal';
    modal.innerHTML = `
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:30px;border-radius:10px;width:90%;max-width:400px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            <h3 style="margin-top:0;color:#2d5016;">SNSリンク編集</h3>
            <div style="margin-bottom:15px;">
                <label style="display:block;color:#558b2f;font-weight:500;margin-bottom:5px;">Twitter</label>
                <input type="url" id="modalTwitter" placeholder="https://twitter.com/username" style="width:100%;padding:8px;border:1px solid #c8e6c9;border-radius:4px;">
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block;color:#558b2f;font-weight:500;margin-bottom:5px;">note</label>
                <input type="url" id="modalNote" placeholder="https://note.com/username" style="width:100%;padding:8px;border:1px solid #c8e6c9;border-radius:4px;">
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block;color:#558b2f;font-weight:500;margin-bottom:5px;">Facebook</label>
                <input type="url" id="modalFacebook" placeholder="https://facebook.com/username" style="width:100%;padding:8px;border:1px solid #c8e6c9;border-radius:4px;">
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block;color:#558b2f;font-weight:500;margin-bottom:5px;">HP</label>
                <input type="url" id="modalHP" placeholder="https://example.com" style="width:100%;padding:8px;border:1px solid #c8e6c9;border-radius:4px;">
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block;color:#558b2f;font-weight:500;margin-bottom:5px;">サービスサイト</label>
                <input type="url" id="modalService" placeholder="https://service.com" style="width:100%;padding:8px;border:1px solid #c8e6c9;border-radius:4px;">
            </div>
            <div style="display:flex;gap:10px;margin-top:20px;">
                <button id="modalSave" style="flex:1;background:#66bb6a;color:white;border:none;padding:10px;border-radius:4px;cursor:pointer;">保存</button>
                <button id="modalCancel" style="flex:1;background:#999;color:white;border:none;padding:10px;border-radius:4px;cursor:pointer;">キャンセル</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('modalSave').addEventListener('click', () => {
        state.profile.twitter = document.getElementById('modalTwitter').value;
        state.profile.note = document.getElementById('modalNote').value;
        state.profile.facebook = document.getElementById('modalFacebook').value;
        state.profile.hp = document.getElementById('modalHP').value;
        state.profile.service = document.getElementById('modalService').value;
        saveProfile();
        modal.style.display = 'none';
    });

    document.getElementById('modalCancel').addEventListener('click', () => {
        modal.style.display = 'none';
    });
};

// Add SNS link editing on double-click
document.addEventListener('dblclick', (e) => {
    if (e.target.classList.contains('social-link')) {
        const modal = document.getElementById('profileModal');
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';

        document.getElementById('modalTwitter').value = state.profile.twitter || '';
        document.getElementById('modalNote').value = state.profile.note || '';
        document.getElementById('modalFacebook').value = state.profile.facebook || '';
        document.getElementById('modalHP').value = state.profile.hp || '';
        document.getElementById('modalService').value = state.profile.service || '';
    }
});

createProfileModal();

/* ===== Init ===== */
state.entries = loadEntries();
loadProfile();
loadIntoEditor(todayStr());
