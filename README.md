# ds-api-client

<p align="left">
	<a aria-label="Bun" href="https://bun.sh/">
		<img alt="Bun" src="https://img.shields.io/badge/Built_For-Bun-%23f9f1e1?style=for-the-badge&logo=bun&logoColor=%23f9f1e1">
	</a>
	<a aria-label="License" href="https://github.com/demarches-simplifiees/ds-api-client/blob/main/LICENSE">
		<img alt="Static Badge" src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge">
	</a>
</p>

## Step 1: Download (Linux or MacOS)

[download](https://github.com/demarches-simplifiees/ds-api-client/releases/latest)

## Step 2: Provide DS token
```bash
echo "GRAPHQL_TOKEN=<TOKEN>" >> .env
```

## Step 3: Run
```bash
ds-api-client dossier <dossierNumber> --json
ds-api-client dossiers <demarcheNumber>  --table
```
