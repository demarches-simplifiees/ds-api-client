import { GeoJSON2SVG } from 'geojson2svg';
import proj4 from 'proj4';
import type { GeoJSON, FeatureCollection, BBox } from 'geojson';
//  @ts-ignore
import { bbox, square, bboxPolygon, buffer } from '@turf/turf';

export async function renderGeoSVG(
  featureCollection: FeatureCollection,
  outfile: string
) {
  for (const feature of featureCollection.features) {
    feature.properties ||= {};
    feature.properties.fill = 'blue';
    feature.properties.opacity = 0.5;
  }

  //bbox extent in minX, minY, maxX, maxY order
  const bbox = getSquareBBox(featureCollection);
  const size = 1000;
  const svg = convertGeoJSONtoSVG(featureCollection, bbox, size);
  await Bun.write(outfile, svg);
}

function convertGeoJSONtoSVG(geoJSON: GeoJSON, bbox: BBox, size: number) {
  const converter = new GeoJSON2SVG({
    mapExtent: {
      left: bbox[0],
      bottom: bbox[1],
      right: bbox[2],
      top: bbox[3],
    },
    viewportSize: { width: size, height: size },
    //  @ts-ignore
    coordinateConverter: forward,
    attributes: [
      { type: 'dynamic', property: 'properties.fill', key: 'fill' },
      { type: 'dynamic', property: 'properties.opacity', key: 'opacity' },
    ],
    r: 5,
    pointAsCircle: true,
  });
  const svg = converter.convert(geoJSON).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${svg}</svg>`;
}

const { forward } = proj4('EPSG:3857', 'EPSG:4326');

function getSquareBBox(featureCollection: FeatureCollection): BBox {
  const polygon = bboxPolygon(square(bbox(featureCollection)));
  const buffered = buffer(polygon, 30, { units: 'meters' });
  return square(bbox(buffered));
}
