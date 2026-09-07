# Minimal static-site image — just nginx serving the pre-built HTML/CSS/assets.
# No build step needed since this is plain HTML/CSS (no framework/bundler).
#
# Source files live under public/ because this repo was created from
# GitLab's "Pages/Plain HTML" project template — that folder name is just a
# GitLab Pages convention we're keeping for familiarity. We're NOT using
# GitLab Pages itself; this Dockerfile copies public/ straight into the
# nginx image instead.
FROM nginx:alpine

# Small hardening/config tweak: disable directory listing (default already off,
# but explicit here), and a basic cache policy for the static assets.
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY public/ /usr/share/nginx/html/

EXPOSE 80
