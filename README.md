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
ds-api-client help dossier
```
```
Usage: ds-api-client dossier [options] <dossierNumber>

Display or download a dossier

Arguments:
  dossierNumber          Dossier number

Options:
  -d, --download         Download files
  -t, --table            Show dossier details
  -j, --json             Print dossier as JSON
  --no-color             No colors
  -P, --parallel <n>     Download in parallel <n> files (default: 20)
  -o, --outdir <outdir>  Output directory (default: "./data")
  -M, --messages         Download dossier messages
  -A, --avis             Download dossier avis
  -G, --geo              Download geo files
  --token <token>        API token
  -h, --help             display help for command
```

```bash
ds-api-client help dossiers
```
```
Usage: ds-api-client dossiers [options] <demarcheNumber>

List or download dossiers from a demarche

Arguments:
  demarcheNumber         Demarche number

Options:
  -f, --first <n>        Take first <n> dossiers
  -l, --last <n>         Take last <n> dossiers
  -a, --after <cursor>   After cursor
  -b, --before <cursor>  Before cursor
  -s, --since <date>     Dossiers updated since
  -d, --download         Download files
  -t, --table            Show dossier details
  -p, --paginate         Follow pagination
  -P, --parallel <n>     Download in parallel <n> files (default: 20)
  -o, --outdir <outdir>  Output directory (default: "./data")
  -c, --clean            Clean output directory
  -M, --messages         Download dossier messages
  -A, --avis             Download dossier avis
  -G, --geo              Download geo files
  --token <token>        API token
  -h, --help             display help for command
```

```bash
ds-api-client help demarche
```
```
Usage: ds-api-client demarche [options] <demarcheNumber>

Get demarche schema

Arguments:
  demarcheNumber   Demarche number

Options:
  --no-color       No colors
  -j, --json       Print schema as JSON
  --token <token>  API token
  -h, --help       display help for command
```
