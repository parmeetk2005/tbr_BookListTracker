// ===== API HELPERS =====
const API = '/api';

async function fetchBooks() {
    const res = await fetch(`${API}/books`);
    return res.json();
}

async function addBook(data) {
    const res = await fetch(`${API}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
}

async function updateBook(id, data) {
    const res = await fetch(`${API}/books/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
}

async function deleteBook(id) {
    await fetch(`${API}/books/${id}`, { method: 'DELETE' });
}

async function fetchStats() {
    const res = await fetch(`${API}/stats`);
    return res.json();
}

// ===== STATE =====
let books = [];
let ratingBookId = null;
let selectedRating = 0;
let addSelectedRating = 0;

// ===== DOM REFS =====
const addModalOverlay = document.getElementById('add-modal-overlay');
const ratingModalOverlay = document.getElementById('rating-modal-overlay');
const addBookForm = document.getElementById('add-book-form');
const starRatingContainer = document.getElementById('star-rating');
const stars = starRatingContainer.querySelectorAll('.star');

// ===== RENDER =====
function renderBooks() {
    const groups = {
        want_to_read: [],
        reading: [],
        finished: []
    };

    books.forEach(book => {
        if (groups[book.status]) {
            groups[book.status].push(book);
        }
    });

    Object.keys(groups).forEach(status => {
        const listEl = document.getElementById(`list-${status.replace(/_/g, '-')}`);
        const countEl = document.getElementById(`count-${status.replace(/_/g, '-')}`);
        countEl.textContent = groups[status].length;

        if (groups[status].length === 0) {
            listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${status === 'want_to_read' ? '📋' : status === 'reading' ? '📖' : '✅'}</div>
          <p>${status === 'want_to_read' ? 'No books yet — add one!' : status === 'reading' ? 'Nothing in progress' : 'No finished books yet'}</p>
        </div>
      `;
            return;
        }

        listEl.innerHTML = groups[status].map(book => createBookCard(book)).join('');

        // Attach drag events
        listEl.querySelectorAll('.book-card').forEach(card => {
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
        });

        // Attach delete events
        listEl.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDelete);
        });
    });
}

function createBookCard(book) {
    const ratingStars = book.rating
        ? '★'.repeat(book.rating) + '☆'.repeat(5 - book.rating)
        : '';

    return `
    <div class="book-card" draggable="true" data-id="${book.id}" data-genre="${book.genre}">
      <div class="card-top">
        <div>
          <div class="book-title">${escapeHtml(book.title)}</div>
          <div class="book-author">by ${escapeHtml(book.author)}</div>
        </div>
        <button class="delete-btn" data-id="${book.id}" title="Remove book">✕</button>
      </div>
      <span class="book-genre-tag">${escapeHtml(book.genre)}</span>
      ${ratingStars ? `<div class="book-rating">${ratingStars}</div>` : ''}
      ${book.notes ? `<div class="book-notes">"${escapeHtml(book.notes)}"</div>` : ''}
    </div>
  `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== STATS =====
async function renderStats() {
    const stats = await fetchStats();
    document.getElementById('stat-finished').textContent = stats.finishedThisYear;
    document.getElementById('stat-avg-rating').textContent = stats.averageRating || '—';
    document.getElementById('stat-reading').textContent = stats.currentlyReading;

    const genresEl = document.getElementById('stat-genres');
    if (stats.topGenres.length > 0) {
        genresEl.textContent = stats.topGenres.map(g => `${g.genre} (${g.count})`).join(', ');
    } else {
        genresEl.textContent = '—';
    }
}

// ===== DRAG & DROP =====
let draggedId = null;

function handleDragStart(e) {
    draggedId = e.target.closest('.book-card').dataset.id;
    e.target.closest('.book-card').classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedId);
}

function handleDragEnd(e) {
    e.target.closest('.book-card')?.classList.remove('dragging');
    document.querySelectorAll('.column').forEach(col => col.classList.remove('drag-over'));
    draggedId = null;
}

document.querySelectorAll('.column').forEach(col => {
    col.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        col.classList.add('drag-over');
    });

    col.addEventListener('dragleave', (e) => {
        if (!col.contains(e.relatedTarget)) {
            col.classList.remove('drag-over');
        }
    });

    col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const bookId = e.dataTransfer.getData('text/plain');
        const newStatus = col.dataset.status;
        const book = books.find(b => b.id == bookId);

        if (!book || book.status === newStatus) return;

        if (newStatus === 'finished') {
            // Show rating modal
            ratingBookId = bookId;
            document.getElementById('rating-book-title').textContent = `"${book.title}" by ${book.author}`;
            selectedRating = 0;
            updateStarDisplay(0);
            document.getElementById('book-notes').value = '';
            openModal(ratingModalOverlay);
        } else {
            await updateBook(bookId, { status: newStatus });
            await refreshAll();
        }
    });
});

// ===== DELETE =====
async function handleDelete(e) {
    e.stopPropagation();
    const id = e.target.dataset.id;
    if (confirm('Remove this book from your shelf?')) {
        await deleteBook(id);
        await refreshAll();
    }
}

// ===== MODALS =====
function openModal(overlay) {
    overlay.classList.add('active');
}

function closeModal(overlay) {
    overlay.classList.remove('active');
}

document.getElementById('add-book-btn').addEventListener('click', () => {
    addBookForm.reset();
    addSelectedRating = 0;
    updateAddStarDisplay(0);
    hideAddFinishedFields();
    openModal(addModalOverlay);
    document.getElementById('book-title').focus();
});

document.getElementById('add-modal-close').addEventListener('click', () => closeModal(addModalOverlay));
document.getElementById('rating-modal-close').addEventListener('click', () => {
    closeModal(ratingModalOverlay);
    ratingBookId = null;
});

// Close modal on backdrop click
[addModalOverlay, ratingModalOverlay].forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal(overlay);
            ratingBookId = null;
        }
    });
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal(addModalOverlay);
        closeModal(ratingModalOverlay);
        ratingBookId = null;
    }
});

// ===== PROGRESS DROPDOWN =====
const progressSelect = document.getElementById('book-progress');
const addFinishedFields = document.getElementById('add-finished-fields');
const addStarContainer = document.getElementById('add-star-rating');
const addStars = addStarContainer.querySelectorAll('.star');

progressSelect.addEventListener('change', () => {
    if (progressSelect.value === 'finished') {
        showAddFinishedFields();
    } else {
        hideAddFinishedFields();
    }
});

function showAddFinishedFields() {
    addFinishedFields.classList.add('visible');
}

function hideAddFinishedFields() {
    addFinishedFields.classList.remove('visible');
    addSelectedRating = 0;
    updateAddStarDisplay(0);
    document.getElementById('add-book-notes').value = '';
}

// ===== ADD-MODAL STAR RATING =====
addStars.forEach(star => {
    star.addEventListener('mouseenter', () => {
        const val = parseInt(star.dataset.value);
        updateAddStarDisplay(val, true);
    });

    star.addEventListener('mouseleave', () => {
        updateAddStarDisplay(addSelectedRating);
    });

    star.addEventListener('click', () => {
        addSelectedRating = parseInt(star.dataset.value);
        updateAddStarDisplay(addSelectedRating);
    });
});

function updateAddStarDisplay(value, isHover = false) {
    addStars.forEach(star => {
        const v = parseInt(star.dataset.value);
        star.classList.remove('selected', 'hovered');
        if (v <= value) {
            star.classList.add(isHover ? 'hovered' : 'selected');
        }
    });
}

// ===== ADD BOOK FORM =====
addBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('book-title').value.trim();
    const author = document.getElementById('book-author').value.trim();
    const genre = document.getElementById('book-genre').value;
    const status = progressSelect.value;

    if (!title || !author || !status) return;

    const bookData = { title, author, genre, status };

    if (status === 'finished') {
        bookData.rating = addSelectedRating || null;
        const notes = document.getElementById('add-book-notes').value.trim();
        bookData.notes = notes || null;
    }

    await addBook(bookData);
    closeModal(addModalOverlay);
    await refreshAll();
});

// ===== STAR RATING =====
stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
        const val = parseInt(star.dataset.value);
        updateStarDisplay(val, true);
    });

    star.addEventListener('mouseleave', () => {
        updateStarDisplay(selectedRating);
    });

    star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.value);
        updateStarDisplay(selectedRating);
    });
});

function updateStarDisplay(value, isHover = false) {
    stars.forEach(star => {
        const v = parseInt(star.dataset.value);
        star.classList.remove('selected', 'hovered');
        if (v <= value) {
            star.classList.add(isHover ? 'hovered' : 'selected');
        }
    });
}

// ===== SAVE RATING =====
document.getElementById('save-rating-btn').addEventListener('click', async () => {
    if (!ratingBookId) return;

    const notes = document.getElementById('book-notes').value.trim();
    await updateBook(ratingBookId, {
        status: 'finished',
        rating: selectedRating || null,
        notes: notes || null
    });

    closeModal(ratingModalOverlay);
    ratingBookId = null;
    await refreshAll();
});

// ===== REFRESH =====
async function refreshAll() {
    books = await fetchBooks();
    renderBooks();
    await renderStats();
}

// ===== INIT =====
refreshAll();
