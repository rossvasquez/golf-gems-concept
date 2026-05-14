import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "mapbox-gl/dist/mapbox-gl.css";

import MapboxDraw from "@mapbox/mapbox-gl-draw";
import type { Feature, Polygon } from "geojson";
import { AlertTriangle } from "lucide-react";
import mapboxgl, { type LngLatBoundsLike } from "mapbox-gl";
import { useEffect, useRef } from "react";

import type { CourseGeometry } from "@/types/geo";

type AdminDrawMapProps = {
  geometry: CourseGeometry | null;
  onGeometryChange: (geometry: Polygon | null) => void;
};

const DEFAULT_CENTER: [number, number] = [-98.5795, 39.8283];

function polygonFromGeometry(geometry: CourseGeometry | null): Polygon | null {
  if (!geometry) {
    return null;
  }

  if (geometry.type === "Polygon") {
    return geometry;
  }

  return {
    type: "Polygon",
    coordinates: geometry.coordinates[0],
  };
}

function boundsForPolygon(polygon: Polygon): LngLatBoundsLike {
  const coordinates = polygon.coordinates.flat();
  const lngs = coordinates.map(([lng]) => lng);
  const lats = coordinates.map(([, lat]) => lat);

  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

export function AdminDrawMap({
  geometry,
  onGeometryChange,
}: AdminDrawMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const geometryRef = useRef<CourseGeometry | null>(geometry);
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  useEffect(() => {
    geometryRef.current = geometry;
  }, [geometry]);

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      attributionControl: false,
      center: DEFAULT_CENTER,
      container: containerRef.current,
      logoPosition: "bottom-left",
      projection: "mercator",
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      zoom: 3.2,
    });
    const draw = new MapboxDraw({
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: "draw_polygon",
      displayControlsDefault: false,
    });
    const syncDrawnPolygon = () => {
      const data = draw.getAll();
      const polygonFeatures = data.features.filter(
        (feature): feature is Feature<Polygon> =>
          feature.geometry.type === "Polygon",
      );
      const latest = polygonFeatures[polygonFeatures.length - 1];

      for (const feature of data.features) {
        if (feature.id !== latest?.id && feature.id !== undefined) {
          draw.delete(String(feature.id));
        }
      }

      onGeometryChange(latest?.geometry ?? null);
    };
    const loadInitialGeometry = () => {
      const polygon = polygonFromGeometry(geometryRef.current);

      if (!polygon) {
        return;
      }

      draw.add({
        type: "Feature",
        properties: {},
        geometry: polygon,
      });
      map.fitBounds(boundsForPolygon(polygon), {
        duration: 0,
        maxZoom: 15,
        padding: 48,
      });
      draw.changeMode("simple_select");
    };

    map.addControl(new mapboxgl.AttributionControl({ compact: true }));
    map.addControl(draw);
    map.on("draw.create", syncDrawnPolygon);
    map.on("draw.update", syncDrawnPolygon);
    map.on("draw.delete", syncDrawnPolygon);
    map.on("load", loadInitialGeometry);

    mapRef.current = map;
    drawRef.current = draw;

    return () => {
      map.off("draw.create", syncDrawnPolygon);
      map.off("draw.update", syncDrawnPolygon);
      map.off("draw.delete", syncDrawnPolygon);
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
    };
  }, [onGeometryChange, token]);

  if (!token) {
    return (
      <div className="grid min-h-80 place-items-center border border-emerald-950/15 bg-emerald-950 p-6 text-white">
        <div className="max-w-sm">
          <AlertTriangle
            className="size-5 text-emerald-200"
            aria-hidden="true"
          />
          <p className="mt-3 font-serif text-2xl leading-none">
            Mapbox token missing.
          </p>
          <p className="mt-3 text-sm leading-6 text-emerald-50/80">
            Add <code>VITE_MAPBOX_TOKEN</code> to draw course polygons.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-140 overflow-hidden border border-emerald-950/15 bg-emerald-950 [&_.mapboxgl-ctrl-group]:!rounded-none"
    />
  );
}
