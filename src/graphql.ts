import type {
  GraphQLResultOne,
  GraphQLResultMany,
  GraphQLResultSchema,
  Page,
} from './types';
import { collectAttachments, collectGeoJSON } from './attachment';
import { formatTime } from './utils';

const GRAPHQL_ENDPOINT =
  process.env.GRAPHQL_ENDPOINT ??
  'https://www.demarches-simplifiees.fr/api/v2/graphql';
const GRAPHQL_TOKEN = process.env.GRAPHQL_TOKEN ?? '';

export async function fetchMany(
  demarcheNumber: number,
  page: number,
  options?: {
    first?: number;
    last?: number;
    after?: string;
    before?: string;
    updatedSince?: string;
    messages?: boolean;
    avis?: boolean;
    json?: boolean;
    token?: string;
  }
): Promise<Page> {
  const start = performance.now();
  const result = await fetch(GRAPHQL_ENDPOINT, {
    ...graphqlFetchOptions(options?.token),
    method: 'POST',
    body: JSON.stringify({
      queryId: 'ds-query-v2',
      variables: {
        demarcheNumber,
        first: options?.first,
        last: options?.last,
        after: options?.after,
        before: options?.before,
        updatedSince: options?.updatedSince,
        includeMessages: options?.messages,
        includeAvis: options?.avis,
        includeDossiers: true,
        includeGeometry: true,
        includeInstructeurs: false,
      },
      operationName: 'getDemarche',
    }),
  })
    .then((res) => res.json<GraphQLResultMany>())
    .catch((error: Error) => {
      return { errors: [error], data: null };
    });

  if (result.errors) {
    console.error(result.errors);
    return emptyPage;
  } else if (!result.data) {
    return emptyPage;
  }

  const { nodes, pageInfo } = result.data.demarche.dossiers;
  const attachments = collectAttachments(nodes);
  const featureCollection = collectGeoJSON(nodes);
  const end = performance.now();

  if (!options?.json) {
    console.log(
      `Page ${page}${
        options?.after ? ` (${options.after})` : ''
      } fetched in ${formatTime(end - start)}`
    );
  }

  return {
    dossiers: nodes,
    attachments,
    featureCollection,
    pageInfo,
  };
}

export async function fetchOne(
  dossierNumber: number,
  options?: {
    messages?: boolean;
    avis?: boolean;
    json?: boolean;
    token?: string;
  }
): Promise<Page> {
  const start = performance.now();
  const result = await fetch(GRAPHQL_ENDPOINT, {
    ...graphqlFetchOptions(options?.token),
    body: JSON.stringify({
      queryId: 'ds-query-v2',
      variables: {
        dossierNumber,
        includeMessages: options?.messages,
        includeAvis: options?.avis,
        includeGeometry: true,
        includeInstructeurs: false,
      },
      operationName: 'getDossier',
    }),
  })
    .then((res) => res.json<GraphQLResultOne>())
    .catch((error: Error) => {
      return { errors: [error], data: null };
    });

  if (result.errors) {
    console.error(result.errors);
    return emptyPage;
  } else if (!result.data) {
    return emptyPage;
  }

  const node = result.data.dossier;
  const attachments = collectAttachments([node]);
  const featureCollection = collectGeoJSON([node]);
  const end = performance.now();

  if (!options?.json) {
    console.log(`Dossier fetched in ${formatTime(end - start)}`);
  }

  return {
    dossiers: [node],
    attachments,
    featureCollection,
    pageInfo: {
      hasPreviousPage: false,
      hasNextPage: false,
    },
  };
}

export async function fetchSchema(
  demarcheNumber: number,
  options?: {
    json?: boolean;
    token?: string;
  }
) {
  const start = performance.now();
  const result = await fetch(GRAPHQL_ENDPOINT, {
    ...graphqlFetchOptions(options?.token),
    body: JSON.stringify({
      queryId: 'ds-query-v2',
      variables: {
        demarche: { number: demarcheNumber },
        includeRevision: true,
        includeService: true,
      },
      operationName: 'getDemarcheDescriptor',
    }),
  })
    .then((res) => res.json<GraphQLResultSchema>())
    .catch((error: Error) => {
      return { errors: [error], data: null };
    });

  if (result.errors) {
    console.error(result.errors);
    return null;
  } else if (!result.data) {
    return null;
  }

  const end = performance.now();

  if (!options?.json) {
    console.log(`Demarche schema fetched in ${formatTime(end - start)}`);
  }

  return result.data.demarcheDescriptor;
}

const graphqlFetchOptions = (token?: string) => ({
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    authorization: `Bearer ${token ?? GRAPHQL_TOKEN}`,
  },
  timeout: true,
});

const emptyPage: Page = {
  dossiers: [],
  attachments: [],
  featureCollection: { type: 'FeatureCollection', features: [] },
  pageInfo: {
    hasPreviousPage: false,
    hasNextPage: false,
  },
};
