import { InvalidArgumentError } from '@commander-js/extra-typings';
import { z } from 'zod';
import * as chrono from 'chrono-node';
import type { Table } from 'console-table-printer';

export const DEFAULT_PARALLEL_DOWNLOADS = 20;
export const DEFAULT_OUTPUT_DIRECTORY = './data';

const byteValueNumberFormatter = Intl.NumberFormat('en-GB', {
  notation: 'compact',
  style: 'unit',
  unit: 'byte',
  unitDisplay: 'narrow',
});

const timeNumberFormatter = Intl.NumberFormat('en-GB', {
  notation: 'compact',
  style: 'unit',
  unit: 'second',
  unitDisplay: 'narrow',
});

const dateFormater = Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatTime(time: number) {
  return timeNumberFormatter.format(time / 1000);
}

export function formatDate(date: string | Date) {
  return dateFormater.format(new Date(date));
}

export function formatByteSize(byteSize: bigint) {
  return byteValueNumberFormatter.format(byteSize).replace('BB', 'GB');
}

export function parseInt(value: string) {
  const result = z.coerce.number().int().safeParse(value);
  if (result.success) {
    return result.data;
  }
  throw new InvalidArgumentError('Invalid Integer');
}

export function parseDate(value: string) {
  const result = chrono.parseDate(value);
  if (result) {
    return result;
  }
  throw new InvalidArgumentError('Invalid Date');
}

export function filenameWithDossierNumber(
  outdir: string,
  dossierNumber: number,
  filename?: string
) {
  return `${outdir}/dossier-${dossierNumber}${filename ? `/${filename}` : ''}`;
}

export function rowColor(state: string) {
  switch (state) {
    case 'en_construction':
      return 'cyan';
    case 'en_instruction':
      return 'blue';
    case 'sans_suite':
      return 'yellow';
    case 'accepte':
      return 'green';
    case 'refuse':
      return 'red';
  }
}

async function md5(blob: Blob) {
  const hasher = new Bun.CryptoHasher('md5');
  const buffer = await blob.arrayBuffer();
  hasher.update(buffer);
  return hasher.digest('base64');
}

export function checksum(blob: Blob, expected: string) {
  if (blob.size == 0) {
    return false;
  }
  if (!expected) {
    return true;
  }
  return md5(blob).then((checksum) => checksum === expected);
}

export function finalizeOutput(
  start: number,
  pageNumber: number,
  totalByteSize: bigint,
  table?: Table
) {
  const end = performance.now();
  const totalTime = formatTime(end - start);

  table?.printTable();

  if (pageNumber > 1) {
    console.log(`Total time fething ${pageNumber} pages: ${totalTime}`);
  } else {
    console.log(`Total time: ${totalTime}`);
  }
  if (totalByteSize > 0) {
    console.log(`Total download byte size: ${formatByteSize(totalByteSize)}`);
  }
}
