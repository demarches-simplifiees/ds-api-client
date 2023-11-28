import type { FeatureCollection, Polygon, Point, LineString } from 'geojson';

export type DossierNode = {
  number: number;
  state: string;
  dateDerniereModification: string;
  demarche: { number: number; title: string };
  messages?: { id: string }[];
  avis?: { id: string }[];
};

type PageInfo = {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startCursor?: string;
  endCursor?: string;
};

export type GraphQLResultMany = {
  data?: {
    demarche: {
      dossiers: {
        pageInfo: PageInfo;
        nodes: DossierNode[];
      };
    };
  };
  errors?: { message: string }[];
};

export type GraphQLResultOne = {
  data?: { dossier: DossierNode };
  errors?: { message: string }[];
};

export type GraphQLResultSchema = {
  data?: {
    demarcheDescriptor: {
      id: string;
      number: number;
      title: string;
      description: string;
      state: string;
    };
  };
  errors?: { message: string }[];
};

export type Attachment = {
  dossierNumber: number;
  url: string;
  filename: string;
  byteSize: bigint;
  checksum: string;
};

export type FeatureCollectionWithFileNumber = FeatureCollection<
  Polygon | LineString | Point,
  { dossierNumber: number; description?: string }
>;

export type Page = {
  dossiers: DossierNode[];
  attachments: Attachment[];
  featureCollection: FeatureCollectionWithFileNumber;
  pageInfo: PageInfo;
};
