# French Hunt Quest — Mobile-First PWA

This is a first mobile-first web/PWA conversion of the French Hunt Quest Android app.

## Included

- Intro flow using the existing Android intro artwork
- Storybook-style Adventure Home
- 7 built-in chapters
- Chapter story pages in French + English
- Treasure missions
- French pronunciation using the browser Speech Synthesis API
- Camera/photo capture on mobile
- Photo selection
- Touch drawing canvas
- Treasure Chest / saved memories
- Learn French vocabulary categories
- XP and progress stored in localStorage
- Custom adventure chapter creation
- PWA manifest and service worker
- iPhone Add to Home Screen guidance

## Run locally

Use a local web server (PWA service workers require HTTP/HTTPS):

```bash
python -m http.server 8000
```

Then open:

http://localhost:8000

## Deploy

The folder can be uploaded directly to a static web host. It does not require a backend for this prototype.

For `https://www.shinhwei.com/qubit-thinking/`-style hosting, place the files in a dedicated directory such as:

`/french-hunt-quest/`

## Important next steps

1. Replace/confirm the custom chapter editor behavior.
2. Add the remaining Android screens in detail (gallery, mission list, treasure found polish, etc.).
3. Improve iPhone Safari photo/drawing handling.
4. Add a proper offline storage layer such as IndexedDB for larger photo collections.
5. Add an iOS-specific install guide.
6. Test on real iPhone/iPad and Android devices.
7. Add analytics only after the core UX is stable.

The web version intentionally uses plain HTML/CSS/JavaScript so it stays free, lightweight, and easy to host.
