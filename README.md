# nmsu-website — CSCI 1115G Lab 3 portfolio

A plain HTML/CSS portfolio (no build tooling needed) meant to be deployed
through your existing homelab GitOps loop instead of a drag-and-drop site
builder. This satisfies the lab's "Advanced" option 4/5 (GitHub Pages or
"another website builder... that publishes a public website") — you're just
using your own infrastructure instead.

## What's in here

```
public/
  index.html         Home page (bio, contact links, nav)
  experience.html    Education / Skills / Interests / Career goals
  projects.html      1-3 project write-ups with images/files
  assets/            CSS + placeholder images/files
Dockerfile           Builds a static nginx image from public/
nginx.conf           Minimal server config baked into the image
docker-compose.yml   Stack definition Komodo will build & run
.gitlab-ci.yml       Optional: HTML validation + pa11y accessibility check on push
```

The `public/` folder name comes from GitLab's "Pages/Plain HTML" project
template — we're keeping that name for familiarity but **not** using
GitLab Pages itself; Komodo builds this into a container instead (see
below).

Every `[PLACEHOLDER]` and bracketed `[Your Name]` / `[Your Major]` needs to
be replaced with your real (or deliberately fictional, per the assignment's
privacy note) content before you submit the URL.

## 1. Merge this into your existing `nmsu-website` repo

Since you created the project from GitLab's template, it already has its
own starter `public/index.html`, `public/style.css`, `.gitlab-ci.yml`, and
`README.md`. Clone it, then overwrite those with the files here:

```bash
git clone git@git.galvin.pro:<your-namespace>/nmsu-website.git
cd nmsu-website

# copy everything from this scaffold in, overwriting the template's files
cp -r /path/to/nmsu-site/. .

# the template's own public/style.css is now dead weight — our CSS lives
# at public/assets/style.css instead, so remove the old one if it's there
rm -f public/style.css

git add -A
git commit -m "Lab 3: replace Pages template with Komodo-deployed portfolio"
git push
```

If you'd rather do it by hand instead of `cp -r`: keep the `public/`
folder, but replace its `index.html`/`style.css` with this scaffold's
`public/index.html` + `public/assets/`, add `public/experience.html` and
`public/projects.html`, and drop the `Dockerfile`, `nginx.conf`,
`docker-compose.yml` into the repo root alongside the existing
`.gitlab-ci.yml` (which you'll also replace — see the note in that file).

## 2. Create the Komodo stack (targeting nucleus)

1. In Komodo, create a new **Stack** named `nmsu-website`.
2. Point it at the `nmsu-website` GitLab repo (branch `main`), compose file
   path `docker-compose.yml`. Komodo's periphery agent runs
   `docker compose build` straight from the repo, so no separate CI build
   step is needed.
3. Assign the stack to **nucleus**'s periphery agent (the same node GitLab
   itself runs on).
4. Before deploying, confirm host port `8095` is actually free on nucleus
   (GitLab's own web/SSH ports are `gitlab.galvin.pro`/`git.galvin.pro`, so
   this shouldn't collide, but check `docker ps` / `ss -tlnp` on nucleus to
   be sure — pick a different port in `docker-compose.yml` if it's taken).
5. Deploy the stack once from Komodo's UI to confirm it builds and starts
   cleanly.
6. Add a webhook in GitLab (Settings → Webhooks on `nmsu-website`) pointing
   at the webhook URL Komodo shows for this stack, triggered on push events
   to `main` — so future edits auto-deploy the same way your other stacks
   do.

## 3. Expose it through Pangolin

The container listens on host port `8095` on nucleus. In the Pangolin
dashboard:

1. Add a new **Resource** for `nmsu.galvin.pro` pointing at
   `<nucleus-internal-ip>:8095`, using nucleus's existing newt tunnel client
   (the same one that already fronts `gitlab.galvin.pro`/other public
   sites on that node).
2. If your Pangolin setup has a "force HTTPS" toggle per Resource, turn it
   on here too.

If nucleus's newt client instead shares a docker network with its exposed
services rather than using host ports, swap the `ports:` line in
`docker-compose.yml` for the commented-out `networks:` block and join that
network instead.

## 4. DNS

Add a CNAME/A record for `nmsu.galvin.pro` pointing at whatever your other
`*.galvin.pro` Pangolin-fronted subdomains point at (same pattern as
`gitlab.galvin.pro`, just a new host).

## 5. Fill in your content

Replace the bracketed placeholders in all three HTML files under `public/`:

- **public/index.html** — real name, major, a genuine contact method, and
  your own ~100–200 word bio paragraph. Swap
  `public/assets/avatar-placeholder.svg` for a real photo/avatar if you
  want one (optional per the assignment).
- **public/experience.html** — Education / Skills / Interests / Career
  goals under each heading. The resume link is optional; if you add one,
  drop `resume.pdf` into `public/assets/` and uncomment the link — just
  don't put your home address in it, since this page gets crawled by bots.
- **public/projects.html** — 1 to 3 real projects. Each needs a name, a
  description, and at least one image, embedded video, embedded audio, or
  downloadable file (examples of all four are in the HTML comments).

## 6. Accessibility check

The lab asks you to verify headings, color contrast, alt text, and
navigation. This scaffold already has: a real heading hierarchy per page,
`aria-current="page"` on the active nav link, a skip-to-content link,
alt text on every image (update it to describe your *real* images once you
swap them in), and colors checked for 4.5:1+ contrast. If you push to
GitLab, the optional `.gitlab-ci.yml` pipeline will re-run an HTML validator
and a `pa11y` WCAG2AA check on every commit as a sanity check — it's
informational (`allow_failure: true`), not a deploy gate.

Before submitting, also do the assignment's manual check: view the live
site yourself (or have someone else look) and confirm you can identify who
you are, find the Experience and Projects pages, get back to Home, and read
everything comfortably.

## 7. Submit

Once `https://nmsu.galvin.pro` is live with real content on all three
pages, submit that URL for Lab 3.
