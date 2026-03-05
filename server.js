const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new Database(path.join(__dirname, 'books.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT DEFAULT 'General',
    status TEXT NOT NULL DEFAULT 'want_to_read',
    rating INTEGER,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    finished_at TEXT
  )
`);

// GET all books
app.get('/api/books', (req, res) => {
    const books = db.prepare('SELECT * FROM books ORDER BY created_at DESC').all();
    res.json(books);
});

// POST a new book
app.post('/api/books', (req, res) => {
    const { title, author, genre, status, rating, notes } = req.body;
    if (!title || !author) {
        return res.status(400).json({ error: 'Title and author are required' });
    }
    const bookStatus = status || 'want_to_read';
    const finishedAt = bookStatus === 'finished' ? new Date().toISOString() : null;
    const stmt = db.prepare(
        'INSERT INTO books (title, author, genre, status, rating, notes, finished_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
        title, author, genre || 'General', bookStatus,
        rating || null, notes || null, finishedAt
    );
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(book);
});

// PATCH update a book (status, rating, notes)
app.patch('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const { status, rating, notes } = req.body;

    const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    if (!existing) {
        return res.status(404).json({ error: 'Book not found' });
    }

    const newStatus = status || existing.status;
    const newRating = rating !== undefined ? rating : existing.rating;
    const newNotes = notes !== undefined ? notes : existing.notes;
    const finishedAt = (newStatus === 'finished' && existing.status !== 'finished')
        ? new Date().toISOString()
        : existing.finished_at;

    db.prepare(
        'UPDATE books SET status = ?, rating = ?, notes = ?, finished_at = ? WHERE id = ?'
    ).run(newStatus, newRating, newNotes, finishedAt, id);

    const updated = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    res.json(updated);
});

// DELETE a book
app.delete('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    if (!existing) {
        return res.status(404).json({ error: 'Book not found' });
    }
    db.prepare('DELETE FROM books WHERE id = ?').run(id);
    res.json({ success: true });
});

// GET reading stats
app.get('/api/stats', (req, res) => {
    const currentYear = new Date().getFullYear();

    const finishedThisYear = db.prepare(
        `SELECT COUNT(*) as count FROM books
     WHERE status = 'finished'
     AND finished_at IS NOT NULL
     AND CAST(strftime('%Y', finished_at) AS INTEGER) = ?`
    ).get(currentYear);

    const avgRating = db.prepare(
        `SELECT AVG(rating) as avg FROM books
     WHERE status = 'finished' AND rating IS NOT NULL`
    ).get();

    const topGenres = db.prepare(
        `SELECT genre, COUNT(*) as count FROM books
     WHERE status = 'finished'
     GROUP BY genre
     ORDER BY count DESC
     LIMIT 5`
    ).all();

    const totalBooks = db.prepare('SELECT COUNT(*) as count FROM books').get();
    const currentlyReading = db.prepare(
        `SELECT COUNT(*) as count FROM books WHERE status = 'reading'`
    ).get();

    res.json({
        finishedThisYear: finishedThisYear.count,
        averageRating: avgRating.avg ? Math.round(avgRating.avg * 10) / 10 : 0,
        topGenres,
        totalBooks: totalBooks.count,
        currentlyReading: currentlyReading.count
    });
});

app.listen(PORT, () => {
    console.log(`📚 Book Tracker running at http://localhost:${PORT}`);
});
