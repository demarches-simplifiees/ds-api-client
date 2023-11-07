import fs from 'node:fs';
import progress from 'cli-progress';
import * as R from 'remeda';
import type { Table } from 'console-table-printer';

import type {
  Attachment,
  Page,
  FeatureCollectionWithFileNumber,
} from './types';
import { attachmentsByteSize } from './attachment';
import { renderGeoJSON } from './geo-render';
import {
  formatTime,
  formatByteSize,
  formatDate,
  parseInt,
  filenameWithDossierNumber,
  rowColor,
  checksum,
  TIMEOUT,
} from './utils';

async function downloadAttachments(
  attachments: Attachment[],
  outdir: string,
  parallel: number,
  verbose = true
) {
  if (attachments.length > 0) {
    const start = performance.now();
    const byteSize = attachmentsByteSize(attachments);

    const bar = new progress.SingleBar({}, progress.Presets.shades_classic);
    bar.start(attachments.length, 0);

    const download = async (attachment: Attachment) => {
      const path = filenameWithDossierNumber(
        outdir,
        attachment.dossierNumber,
        attachment.filename
      );
      const existingBlob = Bun.file(path);
      const existingBlobOK = await checksum(existingBlob, attachment.checksum);

      if (!existingBlobOK) {
        const blob = await fetch(attachment.url)
          .then((response) => (response.ok ? response.blob() : null))
          .catch((error) => {
            console.error(error);
          });

        if (blob) {
          const blobOK = await checksum(blob, attachment.checksum);
          if (!blobOK) {
            throw new Error(
              `Checksum mismatch for ${attachment.url} (expected: ${attachment.checksum})`
            );
          }
          await Bun.write(path, blob);
        }
      }
      bar.increment();
    };

    if (parallel > 1) {
      for (const batch of R.chunk(attachments, parallel)) {
        await Promise.all(batch.map(download));
      }
    } else {
      for (const attachment of attachments) {
        await download(attachment);
      }
    }

    bar.stop();
    if (verbose) {
      const end = performance.now();
      console.log(
        `Downloaded ${formatByteSize(byteSize)} in ${formatTime(end - start)}`
      );
    }
  }
}

async function downloadFeatureCollection(
  featureCollection: FeatureCollectionWithFileNumber,
  outdir: string,
  verbose = true
) {
  if (featureCollection.features.length > 0) {
    const start = performance.now();
    const featuresByFileNumber = R.pipe(
      featureCollection.features,
      R.groupBy.strict((feature) => feature.properties.dossierNumber),
      R.toPairs
    );
    const bar = new progress.SingleBar({}, progress.Presets.shades_classic);
    bar.start(featuresByFileNumber.length, 0);
    for (const [dossierNumber, features] of featuresByFileNumber) {
      await renderGeoJSON(
        { type: 'FeatureCollection', features },
        filenameWithDossierNumber(outdir, parseInt(dossierNumber), 'geo.png')
      );
      bar.increment();
    }
    bar.stop();

    if (verbose) {
      const end = performance.now();
      console.log(
        `Downloaded ${
          featureCollection.features.length
        } Features in ${formatTime(end - start)}`
      );
    }
  }
}

export async function downloadPage(
  { dossiers, attachments, featureCollection }: Page,
  table: Table,
  options: {
    parallel: number;
    outdir: string;
    download?: boolean;
    geo?: boolean;
    table?: boolean;
    json?: boolean;
  }
): Promise<bigint> {
  const byteSize = attachmentsByteSize(attachments);

  if (options.download || options.geo) {
    dossiers
      .map(({ number }) => filenameWithDossierNumber(options.outdir, number))
      .forEach((directory) => {
        fs.mkdirSync(directory, { recursive: true });
      });

    if (options.download) {
      await downloadAttachments(
        attachments,
        options.outdir,
        options.parallel,
        !options.json
      );
    }
    if (options.geo) {
      await downloadFeatureCollection(
        featureCollection,
        options.outdir,
        !options.json
      );
    }
  }

  if (options.table) {
    for (const dossier of dossiers) {
      const dossierAttachments = attachments.filter(
        (file) => file.dossierNumber == dossier.number
      );
      const dossierFeatures = featureCollection.features.filter(
        ({ properties }) => properties.dossierNumber == dossier.number
      );
      const byteSize = attachmentsByteSize(dossierAttachments);
      const titalFiles = dossierAttachments.length - 2;
      const row = {
        number: dossier.number,
        state: dossier.state,
        updatedAt: formatDate(dossier.dateDerniereModification),
        files: titalFiles
          ? `${titalFiles} total size: ${formatByteSize(byteSize)}`
          : '',
        geo: dossierFeatures.length,
      };
      if (dossiers.length == 1) {
        Object.assign(row, {
          title: `${dossier.demarche.title} (${dossier.demarche.number})`,
        });
      }
      if (dossier.messages) {
        Object.assign(row, { messages: dossier.messages.length });
      }
      if (dossier.avis) {
        Object.assign(row, { avis: dossier.avis.length });
      }
      table.addRow(row, { color: rowColor(dossier.state) });
    }
  }

  return byteSize;
}
