import "mapbox-gl/dist/mapbox-gl.css"

import mapboxgl, { type GeoJSONSource, type LngLatBoundsLike } from "mapbox-gl"
import { AlertTriangle } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { GeoMetaCard } from "@/components/geo-meta-card"
import { LocationPrompt } from "@/components/location-prompt"
import { MapStepper } from "@/components/map-stepper"
import { useStoryStore } from "@/stores/use-story-store"

const USA_CENTER: [number, number] = [-98.5795, 39.8283]
const ACTIVE_SOURCE_ID = "active-course-source"
const ACTIVE_FILL_LAYER_ID = "active-course-fill"
const ACTIVE_LINE_LAYER_ID = "active-course-line"

function mapViewportForOverlays() {
  const card = document.querySelector<HTMLElement>("[data-map-card]")
  const cardRect = card?.getBoundingClientRect()
  const isMobile = window.innerWidth < 768

  if (isMobile) {
    return {
      offset: [0, -Math.ceil((cardRect?.height ?? 220) / 2)] as [
        number,
        number,
      ],
      padding: {
        bottom: Math.ceil((cardRect?.height ?? 220) + 112),
        left: 32,
        right: 32,
        top: 132,
      },
    }
  }

  const cardWidth = cardRect?.width ?? 448

  return {
    offset: [Math.ceil(cardWidth / 2 + 96), 0] as [number, number],
    padding: {
      bottom: 96,
      left: Math.ceil(cardWidth + 220),
      right: 140,
      top: 144,
    },
  }
}

function removeActiveCourse(map: mapboxgl.Map) {
  if (map.getLayer(ACTIVE_LINE_LAYER_ID)) {
    map.removeLayer(ACTIVE_LINE_LAYER_ID)
  }

  if (map.getLayer(ACTIVE_FILL_LAYER_ID)) {
    map.removeLayer(ACTIVE_FILL_LAYER_ID)
  }

  if (map.getSource(ACTIVE_SOURCE_ID)) {
    map.removeSource(ACTIVE_SOURCE_ID)
  }
}

export function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const hasLoadedStyleRef = useRef(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(() =>
    mapboxgl.supported()
      ? null
      : "Mapbox needs WebGL, but this browser does not support it.",
  )

  const steps = useStoryStore((state) => state.steps)
  const activeStepIndex = useStoryStore((state) => state.activeStepIndex)
  const userLocation = useStoryStore((state) => state.userLocation)
  const isStoryStarted = useStoryStore((state) => state.isStoryStarted)
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
  const configuredAppUrl = import.meta.env.VITE_APP_URL as string | undefined
  const configuredOrigin = configuredAppUrl
    ? new URL(configuredAppUrl).origin
    : null
  const originWarning =
    import.meta.env.DEV && configuredOrigin
      ? configuredOrigin !== window.location.origin
      : false

  const activeStep = useMemo(() => {
    if (activeStepIndex === null) {
      return null
    }

    return steps[activeStepIndex] ?? null
  }, [activeStepIndex, steps])

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) {
      return
    }

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      attributionControl: false,
      center: USA_CENTER,
      container: containerRef.current,
      dragPan: false,
      dragRotate: false,
      doubleClickZoom: false,
      interactive: false,
      logoPosition: "bottom-left",
      pitchWithRotate: false,
      projection: "mercator",
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      touchPitch: false,
      touchZoomRotate: false,
      zoom: 3.7,
    })

    const resizeMap = () => map.resize()

    map.addControl(new mapboxgl.AttributionControl({ compact: true }))
    map.on("load", () => {
      hasLoadedStyleRef.current = true
      setMapError(null)
      setIsMapReady(true)
      resizeMap()
      window.requestAnimationFrame(resizeMap)
    })
    map.on("error", (event) => {
      const error = event.error
      const message =
        error && "message" in error
          ? error.message
          : "Check your Mapbox token, token URL restrictions, and network access."

      if (!hasLoadedStyleRef.current) {
        setMapError(`Mapbox could not load the base style. ${message}`)
      }
    })

    mapRef.current = map
    window.addEventListener("resize", resizeMap)
    window.requestAnimationFrame(resizeMap)

    return () => {
      window.removeEventListener("resize", resizeMap)
      userMarkerRef.current?.remove()
      map.remove()
      mapRef.current = null
      hasLoadedStyleRef.current = false
    }
  }, [token])

  useEffect(() => {
    const map = mapRef.current

    if (!map || !isMapReady || !userLocation) {
      return
    }

    userMarkerRef.current?.remove()
    userMarkerRef.current = new mapboxgl.Marker({ color: "#059669" })
      .setLngLat(userLocation)
      .addTo(map)

    map.easeTo({
      center: userLocation,
      duration: 1200,
      essential: true,
      zoom: 9,
    })
  }, [isMapReady, userLocation])

  useEffect(() => {
    const map = mapRef.current

    if (!map || !isMapReady) {
      return
    }

    if (!isStoryStarted || !activeStep) {
      removeActiveCourse(map)

      if (isStoryStarted) {
        map.stop()
        map.easeTo({
          center: userLocation ?? USA_CENTER,
          duration: 1200,
          essential: true,
          zoom: userLocation ? 9 : 3.7,
        })
      }

      return
    }

    const source = map.getSource(ACTIVE_SOURCE_ID) as GeoJSONSource | undefined

    if (source) {
      source.setData(activeStep.feature)
    } else {
      map.addSource(ACTIVE_SOURCE_ID, {
        data: activeStep.feature,
        type: "geojson",
      })
      map.addLayer({
        id: ACTIVE_FILL_LAYER_ID,
        paint: {
          "fill-color": "#34d399",
          "fill-opacity": 0.32,
        },
        source: ACTIVE_SOURCE_ID,
        type: "fill",
      })
      map.addLayer({
        id: ACTIVE_LINE_LAYER_ID,
        paint: {
          "line-color": "#ecfdf5",
          "line-opacity": 0.95,
          "line-width": 3,
        },
        source: ACTIVE_SOURCE_ID,
        type: "line",
      })
    }

    const flyToActiveStep = () => {
      const viewport = mapViewportForOverlays()
      const camera = map.cameraForBounds(activeStep.bounds as LngLatBoundsLike, {
        maxZoom: 14.75,
        padding: viewport.padding,
      })

      if (!camera) {
        return
      }

      map.stop()
      map.flyTo({
        bearing: 0,
        center: camera.center,
        curve: 1.45,
        duration: 2200,
        essential: true,
        offset: viewport.offset,
        pitch: 0,
        zoom: camera.zoom,
      })
    }

    const frame = window.setTimeout(flyToActiveStep, 80)

    return () => window.clearTimeout(frame)
  }, [activeStep, isMapReady, isStoryStarted])

  if (!token) {
    return (
      <section className="grid h-full min-h-[calc(100svh-4rem)] place-items-center bg-emerald-950 px-4 text-white">
        <div className="max-w-md border border-white/15 bg-white/10 p-6 backdrop-blur-xl">
          <AlertTriangle className="size-6 text-emerald-200" aria-hidden="true" />
          <h1 className="mt-4 font-serif text-3xl leading-none">
            Mapbox token missing.
          </h1>
          <p className="mt-4 text-sm leading-6 text-emerald-50/80">
            Add <code>VITE_MAPBOX_TOKEN</code> to <code>.env.local</code> and
            restart the Vite dev server.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative h-full min-h-[calc(100svh-4rem)] overflow-hidden bg-emerald-950">
      <div
        ref={containerRef}
        aria-label="Map"
        className="absolute inset-0 size-full [&_.mapboxgl-canvas]:!h-full [&_.mapboxgl-canvas]:!w-full"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-emerald-950/35 to-transparent" />

      {!isMapReady || mapError ? (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center px-4">
          <div className="max-w-md border border-white/15 bg-emerald-950/85 p-5 text-white shadow-2xl backdrop-blur-xl">
            <p className="font-serif text-2xl leading-none">
              {mapError ?? "Loading the map..."}
            </p>
          </div>
        </div>
      ) : null}

      {originWarning ? (
        <div className="pointer-events-none absolute right-4 top-4 z-30 hidden max-w-sm border border-amber-500/30 bg-amber-50/95 p-3 text-xs leading-5 text-amber-950 shadow-xl backdrop-blur-xl lg:block">
          Mapbox tiles may be blocked on this origin. Open{" "}
          <span className="font-semibold">{configuredOrigin}</span>{" "}
          or add <span className="font-semibold">{window.location.origin}</span>{" "}
          to the token's allowed URLs.
        </div>
      ) : null}

      {isStoryStarted ? <MapStepper /> : null}

      {!isStoryStarted && !activeStep ? (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center px-4">
          <div className="pointer-events-none absolute inset-0 bg-emerald-950/10 backdrop-blur-[1px]" />
          <LocationPrompt />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 z-30 flex justify-center px-4 md:inset-y-0 md:left-5 md:right-auto md:items-center md:justify-start">
          {activeStep ? <GeoMetaCard step={activeStep} /> : <LocationPrompt />}
        </div>
      )}
    </section>
  )
}
