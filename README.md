# nmsu-website — CSCI 1115G portfolio

Plain HTML/CSS portfolio for **https://nmsu.galvin.pro** — no framework, no
build step. Deployed through the homelab GitOps loop (GitLab → Komodo →
nginx container on nucleus → newt tunnel → Pangolin VPS) rather than a
drag-and-drop site builder, which satisfies the lab's "Advanced" option.

## Layout

```
public/
  index.html          Home — hero, contact links, About, Explore
  experience.html     Education / Skills / Interests / Career goals
  projects.html       Homelabbing, Gardening, Rest and Relaxation
  404.html            Custom not-found page (served by nginx error_page)
  assets/
    style.css         Whole site's styles, incl. light/dark theming
    avatar.jpg        Hero photo
    favicon/          Full icon set + site.webmanifest
    hl15-front-panel.svg, vegetable-garden.svg, maui-vacation.svg
    r-and-r.txt       Downloadable file linked from project 3
Dockerfile            Static nginx image (base tag pinned)
nginx.conf            Server config baked into the image
compose.yaml          Stack definition Komodo builds & runs
.dockerignore         Keeps dotfiles/CI/docs out of the image
.gitlab-ci.yml        HTML validation + pa11y accessibility check on push
.pa11yci.json         pa11y config (URL list + WCAG2AA standard)
```

The `public/` name is a leftover from GitLab's "Pages/Plain HTML" template.
We are **not** using GitLab Pages — Komodo builds this into a container.

## Local preview

No tooling required. From `public/`:

```bash
python3 -m http.server 8080
# then open http://127.0.0.1:8080/
```

Note the 404 page only takes effect behind nginx (`error_page`), not under
`http.server`. To exercise the real config, build the image instead:

```bash
docker build -t nmsu-site . && docker run --rm -p 8080:80 nmsu-site
```

## How it's deployed

1. Push to `main` on `git.galvin.pro`.
2. A GitLab webhook fires Komodo, whose periphery agent on **nucleus**
   runs `docker compose build` straight from the repo.
3. The container publishes host port **8095** on nucleus.
4. **newt** (on a separate VM) reaches `nucleus:8095` over the server VLAN
   and tunnels out to the Pangolin VPS.
5. Pangolin terminates TLS for `nmsu.galvin.pro` (Let's Encrypt) and
   passes upstream response headers through unchanged.

Public DNS is a CNAME to `galvin.pro`; internal DNS resolves the same name
to an internal proxy, so testing from inside the LAN does **not** exercise
the real external path. Force it with:

```bash
curl -sI --resolve nmsu.galvin.pro:443:<vps-public-ip> https://nmsu.galvin.pro
```

## Gotchas worth knowing before you edit

**The CSP pins a hash of the inline theme script.** Each page carries an
inline `<script>` that applies the saved theme before first paint. `nginx.conf`
allows it by `sha256` hash. **Edit that script and the theme toggle silently
stops working** until the hash is regenerated. The exact command is in a
comment above the policy in `nginx.conf`; the script must stay byte-identical
across all four pages.

**nginx does not inherit `add_header` into a location that sets its own.**
`location /assets/` sets `Cache-Control`, so it has to repeat the entire
security-header block. Add a header at server level and it will silently be
missing on every CSS/image/SVG response unless you add it there too.

**New files under `public/assets/` must be `git add`-ed explicitly.**
`git commit -a` only stages tracked files, so a new image will work locally
and 404 in production. Check before pushing:

```bash
git ls-files --others --exclude-standard   # empty == safe to push
```

## Theming

Dark mode follows the OS by default via `prefers-color-scheme`, with a
header toggle that overrides it and remembers the choice in `localStorage`.
Colour tokens live at the top of `style.css` and are split deliberately:
`--color-brand-fg` (crimson text, lightens in dark mode) versus
`--color-brand-strong` (crimson backgrounds carrying white text, identical
in both themes). Keep that separation — collapsing them breaks contrast in
one mode or the other.

## Security posture

Set in `nginx.conf`, verified live through Pangolin:

- `Content-Security-Policy` — `default-src 'self'`, `object-src 'none'`,
  no third-party origins; the one inline script allowed by hash
- `Strict-Transport-Security: max-age=86400` — raise to `31536000` once
  settled. No `includeSubDomains` (would break HTTP-only `*.galvin.pro`
  hosts) and no `preload`
- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `Cross-Origin-Opener-Policy`
- `server_tokens off`, dotfiles denied, no directory listing, unsafe HTTP
  methods rejected

The origin needs **no inbound port forward** — newt dials outbound, so
`nucleus:8095` is not reachable from the internet. Keep it that way.

## Accessibility & CI

Every push runs `.gitlab-ci.yml`: `html-validate` over all four pages
(a hard gate) and `pa11y-ci` at WCAG2AA (informational, `allow_failure:
true`). Run the validator locally the same way CI does:

```bash
docker run --rm -v "$PWD:/w" -w /w node:20-alpine \
  npx --yes html-validate public/*.html
```

The site ships a real heading hierarchy, `aria-current="page"` on the active
nav link, a skip-to-content link, alt text on every image, mint focus
outlines on the crimson header/footer/hero where the default crimson would
be invisible, and `prefers-reduced-motion` handling for the animations.
