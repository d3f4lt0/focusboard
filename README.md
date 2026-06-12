# focusboard

A calm productivity MVP for tracking tasks, focus sessions, and visible progress.

## live demo

- **demo:** https://d3f4lt0.github.io/focusboard/
- **repo:** https://github.com/d3f4lt0/focusboard

## overview

focusboard started as a static landing page concept.
It is now a lightweight functional MVP that keeps the same calm visual direction while adding real daily utility.

## features

- add tasks quickly
- mark tasks as completed
- delete tasks
- visible progress summary and progress bar
- 25-minute focus timer
- start / pause / reset timer controls
- localStorage persistence for tasks and timer state
- empty states, keyboard-friendly controls, and responsive layout

## project structure

- `index.html` — application structure and content
- `styles.css` — visual system, layout, transitions, responsive behavior
- `app.js` — task manager, timer logic, persistence, rendering
- `app-idea.md` — early product notes

## setup

No build step is required.

### option 1 — open directly

Open `index.html` in your browser.

### option 2 — serve locally

If you want a local server:

```bash
python3 -m http.server 8080
```

Then open:

```txt
http://localhost:8080
```

## usage

1. Add one or more tasks.
2. Mark them complete as you finish them.
3. Start a 25-minute focus session.
4. Reload the page and keep going — your state is restored automatically.

## screenshots

Screenshots can be added here once the UI is captured.

- `docs/screenshot-home.png`
- `docs/screenshot-active-session.png`

## design notes

The MVP keeps the original project philosophy:

- calm productivity
- minimal distractions
- visible progress
- simple, honest daily flow

## roadmap

- [x] convert landing concept into a functional MVP
- [x] add task management
- [x] add focus timer
- [x] persist state locally
- [x] publish live demo
- [ ] add session history
- [ ] add lightweight analytics
- [ ] support custom focus lengths
- [ ] add task categories without increasing clutter
