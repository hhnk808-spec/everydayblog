const dateInput = document.getElementById('dateInput');
const entryInput = document.getElementById('entryInput');
const saveBtn = document.getElementById('saveBtn');
const entriesList = document.getElementById('entriesList');

const STORAGE_KEY = 'diary_entries';

function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function loadEntries() {
    const entries = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return entries;
}

function saveEntry(date, content) {
    if (!date || !content.trim()) {
        alert('日付と内容を入力してください');
        return;
    }

    const entries = loadEntries();
    entries[date] = content;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));

    entryInput.value = '';
    dateInput.value = getTodayDate();
    renderEntries();
}

function deleteEntry(date) {
    if (confirm('この日記を削除しますか？')) {
        const entries = loadEntries();
        delete entries[date];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        renderEntries();
    }
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return date.toLocaleDateString('ja-JP', options);
}

function renderEntries() {
    const entries = loadEntries();
    const sortedDates = Object.keys(entries).sort().reverse();

    entriesList.innerHTML = '';

    if (sortedDates.length === 0) {
        return;
    }

    sortedDates.forEach(date => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'entry-item';

        const dateDiv = document.createElement('div');
        dateDiv.className = 'entry-date';
        dateDiv.textContent = formatDate(date);

        const textDiv = document.createElement('div');
        textDiv.className = 'entry-text';
        textDiv.textContent = entries[date];

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'entry-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '削除';
        deleteBtn.onclick = () => deleteEntry(date);

        actionsDiv.appendChild(deleteBtn);
        entryDiv.appendChild(dateDiv);
        entryDiv.appendChild(textDiv);
        entryDiv.appendChild(actionsDiv);
        entriesList.appendChild(entryDiv);
    });
}

saveBtn.addEventListener('click', () => {
    saveEntry(dateInput.value, entryInput.value);
});

entryInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        saveEntry(dateInput.value, entryInput.value);
    }
});

dateInput.value = getTodayDate();
renderEntries();
