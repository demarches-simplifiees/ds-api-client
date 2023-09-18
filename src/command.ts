import { Command } from '@commander-js/extra-typings';
import fs from 'node:fs';

import {
  formatDate,
  parseInt,
  parseDate,
  finalizeOutput,
  DEFAULT_OUTPUT_DIRECTORY,
  DEFAULT_PARALLEL_DOWNLOADS,
} from './utils';
import { fetchOne, fetchMany } from './graphql';
import { downloadPage } from './download';
import { createTable } from './table';

const program = new Command()
  .name('ds-api-client')
  .description('API client for use with demarches-simplifiees.fr service')
  .version('0.1.0');

program
  .command('clean')
  .description('Clean output directory')
  .option('-o, --outdir <outdir>', 'Output directory', DEFAULT_OUTPUT_DIRECTORY)
  .action((options) => {
    fs.rmdirSync(options.outdir, { recursive: true });
  });

program
  .command('dossiers')
  .description('List or download dossiers from a demarche')
  .argument('<demarcheNumber>', 'Demarche number', parseInt)
  .option('-f, --first <n>', 'Take first <n> dossiers', parseInt)
  .option('-l, --last <n>', 'Take last <n> dossiers', parseInt)
  .option('-a, --after <cursor>', 'After cursor')
  .option('-b, --before <cursor>', 'Before cursor')
  .option('-s, --since <date>', 'Dossiers updated since', parseDate)
  .option('-d, --download', 'Download files')
  .option('-t, --table', 'Show dossier details')
  .option('-p, --paginate', 'Follow pagination')
  .option(
    '-P, --parallel <n>',
    'Download in parallel <n> files',
    parseInt,
    DEFAULT_PARALLEL_DOWNLOADS
  )
  .option('-o, --outdir <outdir>', 'Output directory', DEFAULT_OUTPUT_DIRECTORY)
  .option('-c, --clean', 'Clean output directory')
  .option('-M, --messages', 'Download dossier messages')
  .option('-A, --avis', 'Download dossier avis')
  .option('-G, --geo', 'Download geo files')
  .option('--token <token>', 'API token')
  .action(async (demarcheNumber, options) => {
    let after = options.after;
    let before = options.before;

    let next = true;
    let pageNumber = 1;
    let totalByteSize = BigInt(0);

    const start = performance.now();
    const table = createTable(options);

    if (options.since) {
      console.log(
        `Fetching dossiers updated since ${formatDate(options.since)}`
      );
    }

    if (options.clean) {
      fs.rmdirSync(options.outdir, { recursive: true });
    }

    while (next) {
      const page = await fetchMany(demarcheNumber, pageNumber, {
        after,
        before,
        first: options.first,
        last: options.last,
        updatedSince: options.since?.toISOString(),
        messages: options.messages,
        avis: options.avis,
        token: options.token,
      });
      totalByteSize += await downloadPage(page, table, options);

      if (!options.paginate) {
        next = false;
      } else if (options.last) {
        before = page.pageInfo.startCursor;
        next = page.pageInfo.hasPreviousPage;
      } else {
        after = page.pageInfo.endCursor;
        next = page.pageInfo.hasNextPage;
      }

      if (next) {
        pageNumber++;
      }
    }

    finalizeOutput(
      start,
      pageNumber,
      totalByteSize,
      options.table ? table : undefined
    );
  });

program
  .command('dossier')
  .description('Display or download a dossier')
  .argument('<dossierNumber>', 'Dossier number', parseInt)
  .option('-d, --download', 'Download files')
  .option('-t, --table', 'Show dossier details')
  .option('-j, --json', 'Print dossier as JSON')
  .option('--no-color', 'No colors')
  .option(
    '-P, --parallel <n>',
    'Download in parallel <n> files',
    parseInt,
    DEFAULT_PARALLEL_DOWNLOADS
  )
  .option('-o, --outdir <outdir>', 'Output directory', DEFAULT_OUTPUT_DIRECTORY)
  .option('-M, --messages', 'Download dossier messages')
  .option('-A, --avis', 'Download dossier avis')
  .option('-G, --geo', 'Download geo files')
  .option('--token <token>', 'API token')
  .action(async (dossierNumber, options) => {
    let totalByteSize = BigInt(0);

    const start = performance.now();
    const table = createTable({ ...options, title: true });

    const page = await fetchOne(dossierNumber, {
      messages: options.messages,
      avis: options.avis,
      json: options.json,
      token: options.token,
    });
    totalByteSize += await downloadPage(page, table, options);

    if (options.json) {
      if (options.color) {
        console.dir(page.dossiers[0]);
      } else {
        console.log(JSON.stringify(page.dossiers[0], null, 2));
      }
    } else {
      finalizeOutput(
        start,
        1,
        totalByteSize,
        options.table ? table : undefined
      );
    }
  });

program.parse();
