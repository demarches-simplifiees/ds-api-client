# ds-api-client

<p align="left">
	<a aria-label="Bun" href="https://bun.sh/">
		<img alt="Bun" src="https://img.shields.io/badge/Built_For-Bun-%23f9f1e1?style=for-the-badge&logo=bun&logoColor=%23f9f1e1">
	</a>
	<a aria-label="License" href="https://github.com/demarches-simplifiees/ds-api-client/blob/main/LICENSE">
		<img alt="Static Badge" src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge">
	</a>
</p>

## Step 1: Install Bun
Install Bun by following their installation guide, which can be found [here](https://bun.sh/docs/installation).

## Step 2: Install dependencies
```bash
bun install
# A hack around a bun limitation that will be fixed soon
bun sharp:install
```

# Step 2.1 (optional) : Rebuild for your chip architecture
If you are running this script on m2 chip (with arm64 instruction set), you might need to :
```bash
npm install --platform=darwin --arch=x64 sharp
npm rebuild --platform=darwin --arch=arm64 sharp
```

## Step 3: Provide DS token
```bash
echo "GRAPHQL_TOKEN=<TOKEN>" >> .env
```

## Step 4: Run
```bash
bun ds dossier <dossierNumber> --json
bun ds dossiers <demarcheNumber>  --table
```
