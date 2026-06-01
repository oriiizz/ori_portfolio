# Portfolio

Static portfolio website built with HTML, CSS, and local project assets.

## Live site

[Open portfolio](https://oriiizz.github.io/ori_portfolio.github.io/)

## Project layout

All pages and assets live at the repository root:

```text
index.html
event-list.html
styles.css
assets/
  home/          # homepage images and Inter font files
  site/          # shared icons (social links)
  projects/      # project cover and detail images
scripts/
```

## Local preview

Preview from the project root so paths match GitHub Pages:

```bash
cd "/Users/zxn./Desktop/profolio"
python3 -m http.server 8080
```

Open:

- Home: `http://127.0.0.1:8080/index.html`
- Event list: `http://127.0.0.1:8080/event-list.html`

To stop the server, press `Control + C` in the terminal.

## Deployment

| Platform | Repo | Deploy directory | Build |
|----------|------|------------------|-------|
| GitHub Pages | `ori_portfolio.github.io` | repository root | none — push HTML/CSS/assets directly |
| Vercel | `ori_portfolio` | `dist/` | `npm run build` copies root files into `dist/` |

Local preview and GitHub Pages both serve the same root directory. Vercel runs `npm run build` first, then publishes `dist/`.

## Git push (both remotes)

Sync source into each publish clone, then commit:

```bash
SRC="/Users/zxn./Desktop/profolio"
rsync -av --delete \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='.publish-ori_portfolio' \
  --exclude='.publish-ori_portfolio_github_io' \
  "$SRC/" "$SRC/.publish-ori_portfolio/"
rsync -av --delete \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='.publish-ori_portfolio' \
  --exclude='.publish-ori_portfolio_github_io' \
  "$SRC/" "$SRC/.publish-ori_portfolio_github_io/"

cd "$SRC/.publish-ori_portfolio"
git add -A
git commit -m "你的提交说明"
git push origin main

cd "$SRC/.publish-ori_portfolio_github_io"
git add -A
git commit -m "你的提交说明"
git push origin main
```
