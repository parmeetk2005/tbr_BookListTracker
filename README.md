# 📚 ToBeRead

A minimal and structured web application that helps users manage and organize books into different reading stages.
The application allows users to track reading progress, rate books, write reviews, and view reading statistics through a clean dashboard interface.

---

## Overview ##

**ToBeRead** is a browser-based reading tracker designed to demonstrate practical full-stack web development using a simple and maintainable architecture.

The application allows users to organize books into different reading stages while storing their ratings and personal notes.

Features include:

* Book management system
* Reading shelf organization
* Rating and review tracking
* Reading statistics dashboard
* Simple and maintainable backend API
* Persistent data storage using SQLite

---

## 🚀 Features ##

### 📖 Book Management ###

Users can add books with the following details:

* Title
* Author
* Genre
* Reading Status
* Rating
* Notes / Review

---

### 📚 Reading Shelves ###

Books are automatically categorized into three reading stages:

* **Want to Read** → Books planned to read
* **Reading** → Books currently being read
* **Finished** → Completed books

---

### ⭐ Rating & Reviews ###

Users can:

* Assign star ratings to books
* Write personal reviews
* Track their average rating across books

---

### 📊 Reading Statistics ###

The dashboard provides quick insights such as:

* Books finished this year
* Average rating
* Currently reading
* Most read genres

---

## 🛠 Technology Stack ##

This project uses the following technologies:

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* MySQL

### Package Manager

* npm

---

## 📂 Project Structure ##

| File / Folder     | Type   | Description                      |
| ----------------- | ------ | -------------------------------- |
| public/           | Folder | Contains all frontend assets     |
| public/css/       | Folder | Stylesheets                      |
| public/js/        | Folder | Client-side JavaScript           |
| public/index.html | File   | Main UI page                     |
| server.js         | File   | Express backend server           |
| package.json      | File   | Project dependencies and scripts |
| package-lock.json | File   | Dependency lock file             |
| .gitignore        | File   | Specifies ignored files for Git  |
| README.md         | File   | Project documentation            |

---

## ⚙️ Installation ##

### 1️⃣ Clone the Repository ###

```bash
git clone https://github.com/parmeetk2005/tbr_BookListTracker.git
```

---

### 2️⃣ Navigate to the Project Directory ###

```bash
cd ToBeRead list
```

---

### 3️⃣ Install Dependencies ###

```bash
npm install
```

---

### 4️⃣ Run the Server ###

```bash
node server.js
```

---

### 5️⃣ Open in Browser ###

```bash
http://localhost:3000
```

---

## 🖥 Usage ##

1. Click **Add Book**
2. Enter the book details
3. Select a genre
4. Choose the reading status
5. Add rating and notes (optional)
6. Click **Add to Shelf**

The book will automatically appear in the appropriate reading shelf.

---

## 🔮 Future Improvements ##

Planned enhancements for the project include:

* User authentication system
* Cloud database integration
* Book cover image support
* Search and filtering functionality
* Drag-and-drop shelf management
* Integration with Google Books API

