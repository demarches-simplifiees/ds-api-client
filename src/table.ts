import { Table } from 'console-table-printer';

export function createTable(options: {
  messages?: boolean;
  avis?: boolean;
  title?: boolean;
}) {
  return new Table({
    columns: [
      { name: 'number', title: 'Number', color: 'white' },
      { name: 'state', title: 'State' },
      ...(options.title
        ? [{ name: 'title', title: 'Title', color: 'white' }]
        : []),
      {
        name: 'updatedAt',
        title: 'Updated Date',
        color: 'white',
      },
      ...(options.messages
        ? [{ name: 'messages', title: 'Messages', color: 'white' }]
        : []),
      ...(options.avis
        ? [{ name: 'avis', title: 'Avis', color: 'white' }]
        : []),
      { name: 'files', title: 'Files', color: 'white' },
      { name: 'geo', title: 'Geo', color: 'white' },
    ],
  });
}
