import * as R from 'remeda';
import type { Polygon, LineString, Point } from 'geojson';

import type {
  Attachment,
  DossierNode,
  FeatureCollectionWithFileNumber,
} from './types';

type FileNode = {
  __typename: 'File';
  url: string;
  filename: string;
  byteSize: string;
  checksum: string;
};

type GeometryNode = {
  __typename: 'SelectionUtilisateur';
  geometry: Polygon | LineString | Point;
  description?: string;
};

type TreeNode = FileNode | Record<string, unknown>;
type Tree = TreeNode | TreeNode[];

function isFileNode(node: TreeNode): node is FileNode {
  return '__typename' in node && node.__typename == 'File';
}

function isDossierNode(node: TreeNode): node is DossierNode {
  return '__typename' in node && node.__typename == 'Dossier';
}

function isGeometryNode(node: TreeNode): node is GeometryNode {
  return 'geometry' in node;
}

export function attachmentsByteSize(attachments: Attachment[]) {
  return attachments.reduce(
    (acc, attachment) => attachment.byteSize + acc,
    BigInt(0)
  );
}

export function collectAttachments(
  tree: Tree,
  attachments: Attachment[] = [],
  dossierNumber?: number
): Attachment[] {
  if (Array.isArray(tree)) {
    for (const node of tree) {
      collectAttachments(node, attachments, dossierNumber);
    }
  } else if (R.isObject(tree)) {
    if (isFileNode(tree)) {
      if (dossierNumber) {
        attachments.push({
          dossierNumber,
          url: tree.url,
          filename: tree.filename,
          byteSize: BigInt(tree.byteSize),
          checksum: tree.checksum,
        });
      }
    } else {
      if (isDossierNode(tree) && R.isNumber(tree.number)) {
        dossierNumber = tree.number;
        const json = Buffer.from(JSON.stringify(tree, null, 2)).toString(
          'base64'
        );
        attachments.push({
          dossierNumber,
          url: `data:text/plain;base64,${json}`,
          filename: 'dossier.json',
          byteSize: BigInt(0),
          checksum: '',
        });
      }
      for (const node of Object.values(tree)) {
        collectAttachments(node as TreeNode, attachments, dossierNumber);
      }
    }
  }

  return attachments;
}

export function collectGeoJSON(
  tree: Tree,
  featureCollection: FeatureCollectionWithFileNumber = {
    type: 'FeatureCollection',
    features: [],
  },
  dossierNumber?: number
): FeatureCollectionWithFileNumber {
  if (Array.isArray(tree)) {
    for (const node of tree) {
      collectGeoJSON(node, featureCollection, dossierNumber);
    }
  } else if (R.isObject(tree)) {
    if (isGeometryNode(tree)) {
      if (dossierNumber) {
        featureCollection.features.push({
          type: 'Feature',
          properties: { dossierNumber, description: tree.description },
          geometry: tree.geometry,
        });
      }
    } else {
      if (isDossierNode(tree) && R.isNumber(tree.number)) {
        dossierNumber = tree.number;
      }
      for (const node of Object.values(tree)) {
        collectGeoJSON(node as TreeNode, featureCollection, dossierNumber);
      }
    }
  }

  return featureCollection;
}
