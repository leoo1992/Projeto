FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY --chown=101:101 . /usr/share/nginx/html
USER 101
EXPOSE 8080
