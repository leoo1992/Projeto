# Projeto

Aplicação web estática de demonstração com páginas para login, clientes e endereços.

## Qualidade e entrega

O projeto possui teste automatizado de integridade com Node.js, lint com ESLint, GitHub Actions, Docker, exemplo de ambiente e licença MIT. O deploy contínuo é realizado pela integração do GitHub com a Vercel.

## Executar

Abra `index.html` diretamente ou utilize Docker:

```bash
docker build -t projeto .
docker run --rm -p 8080:80 projeto
```
