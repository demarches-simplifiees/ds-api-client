# ds-api-client

To install dependencies:

```bash
bun install
# A hack around a bun limitation that will be fixed soon
bun sharp:install
```

Put your DS token in `GRAPHQL_TOKEN` env var or declare it in `.env` file.

To run:

```bash
bun ds dossier <dossierNumber> --json
bun ds dossiers <demarcheNumber>  --table
```
