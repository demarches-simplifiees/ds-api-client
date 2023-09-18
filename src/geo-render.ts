import { GeoJSON2SVG } from 'geojson2svg';
import sharp from 'sharp';
import proj4 from 'proj4';
import type { GeoJSON, FeatureCollection, BBox } from 'geojson';
//  @ts-ignore
import { bbox, square, bboxPolygon, buffer } from '@turf/turf';

export async function renderGeoJSON(
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
  const svg = await convertGeoJSONtoSVG(featureCollection, bbox, size);
  const [background, ...inputs] = await Promise.all(
    urls.map((url) =>
      fetch(buildIGNURL(url, bbox, size)).then((res) => res.arrayBuffer())
    )
  );
  const png = await sharp(background)
    .composite([
      ...inputs.map((input) => ({ input: Buffer.from(input) })),
      { input: Buffer.from(svg) },
    ])
    .png()
    .toBuffer();
  await Bun.write(outfile, png);
}

async function convertGeoJSONtoSVG(geoJSON: GeoJSON, bbox: BBox, size: number) {
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

function buildIGNURL(url: string, bbox: BBox, size: number) {
  const params = new URLSearchParams();
  params.set('EXCEPTIONS', 'text/xml');
  params.set('FORMAT', 'image/png');
  params.set('SERVICE', 'WMS');
  params.set('VERSION', '1.3.0');
  params.set('REQUEST', 'GetMap');
  params.set('STYLES', '');
  params.set('CRS', 'EPSG:4326');
  params.set('BBOX', `${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}`);
  params.set('WIDTH', `${size}`);
  params.set('HEIGHT', `${size}`);

  return `https://${url}&${params}`;
}

const urls = [
  'wxs.ign.fr/ortho/geoportail/r/wms?LAYERS=ORTHOIMAGERY.ORTHOPHOTOS.BDORTHO',
  'wxs.ign.fr/administratif/geoportail/r/wms?LAYERS=ADMINEXPRESS-COG-CARTO.LATEST',
  'wxs.ign.fr/parcellaire/geoportail/r/wms?LAYERS=CADASTRALPARCELS.PARCELLAIRE_EXPRESS',
];

const { forward } = proj4('EPSG:3857', 'EPSG:4326');

function getSquareBBox(featureCollection: FeatureCollection): BBox {
  const polygon = bboxPolygon(square(bbox(featureCollection)));
  const buffered = buffer(polygon, 30, { units: 'meters' });
  return square(bbox(buffered));
}
