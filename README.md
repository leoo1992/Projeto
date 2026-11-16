# Projeto — demonstração web

Aplicação web estática de demonstração com páginas de login, clientes e endereços. Os arquivos HTML, CSS e JavaScript implementam a interface sem um backend de aplicação neste repositório.

## Stack
- HTML
- CSS
- JavaScript
- Docker para servir os arquivos estáticos

## Como executar
Abra `index.html` no navegador ou execute com Docker:

```bash
docker build -t projeto .
docker run --rm -p 8080:80 projeto
```
