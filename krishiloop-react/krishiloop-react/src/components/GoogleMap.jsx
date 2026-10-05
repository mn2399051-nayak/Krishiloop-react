import { useEffect, useRef, useState } from "react";
import { useGoogleMaps, getStoredKey, setStoredKey } from "../hooks/useGoogleMaps.js";

/* --------------------------------------------------------------------------
   GoogleMap
   --------------------------------------------------------------------------
   Drop-in replacement for the old SVG <RouteGraphic>. Renders a real Google
   Map with numbered markers for each lot, a depot marker, and a dashed
   polyline showing the suggested collection order (depot → lots → depot).

   Falls back to a friendly "connect Google Maps" card when no API key has
   been saved yet, so the rest of the page keeps working.
   -------------------------------------------------------------------------- */

const DEFAULT_HEIGHT = 460;

const placeholderBaseStyle = {
  height: DEFAULT_HEIGHT,
};

export default function GoogleMap({
  lots = [],
  depot,
  height = DEFAULT_HEIGHT,
}) {
  const { status, google, error } = useGoogleMaps();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef({ markers: [], polyline: null, infoWindow: null });
  const [keyInput, setKeyInput] = useState(getStoredKey);
  const [editingKey, setEditingKey] = useState(false);

  // Initialise the map exactly once when the script becomes ready.
  useEffect(() => {
    if (status !== "ready" || !google || !containerRef.current) return;
    if (mapRef.current) return;
    mapRef.current = new google.Map(containerRef.current, {
      center: { lat: depot.lat, lng: depot.lng },
      zoom: 9,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      backgroundColor: "#f7f5f1",
    });
  }, [status, google, depot.lat, depot.lng]);

  // Re-draw markers + polyline whenever inputs change.
  useEffect(() => {
    if (status !== "ready" || !google || !mapRef.current) return;
    const { markers, polyline, infoWindow } = overlayRef.current;

    // Clear the previous overlay
    markers.forEach((m) => m.setMap(null));
    if (polyline) polyline.setMap(null);
    overlayRef.current.markers = [];
    overlayRef.current.polyline = null;

    const bounds = new google.LatLngBounds();
    bounds.extend({ lat: depot.lat, lng: depot.lng });

    // Lot markers (numbered, with clickable info windows)
    lots.forEach((lot, i) => {
      const coords = lot.coords || { lat: depot.lat, lng: depot.lng };
      const position = { lat: coords.lat || coords[0], lng: coords.lng || coords[1] };
      bounds.extend(position);

      const marker = new google.Marker({
        position,
        map: mapRef.current,
        title: `${lot.id || ""} · ${lot.farmer || ""} · ${lot.village || ""}`,
        label: {
          text: String(i + 1),
          color: "#ffffff",
          fontSize: "11px",
          fontWeight: "700",
        },
        icon: {
          path: google.SymbolPath.CIRCLE,
          fillColor: "#2d6e4a",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 12,
        },
        zIndex: 10,
      });

      const statusColor =
        lot.status === "Collected" ? "#41815d"
        : lot.status === "Processed" ? "#53775c"
        : lot.status === "Matched" ? "#4d7898"
        : lot.status === "Collection planned" ? "#667ca6"
        : "#8f6e28";

      const info = new google.InfoWindow({
        content: `
          <div style="font-family:inherit;min-width:200px;padding:2px 2px 4px;">
            <div style="font:700 11px 'Manrope',sans-serif;color:#2a3d30;letter-spacing:-.2px;">${lot.id || ""} · ${lot.farmer || ""}</div>
            <div style="margin-top:2px;color:#6e7f72;font-size:10px;">📍 ${lot.village || ""}, Punjab</div>
            <div style="margin-top:6px;color:#2a3d30;font-size:10px;">${lot.residue || "Paddy straw"} · <b>${lot.est ?? "?"} t</b></div>
            <div style="margin-top:6px;display:inline-block;padding:2px 8px;border-radius:10px;background:${statusColor}1a;color:${statusColor};font-size:9px;font-weight:700;">${lot.status || "Listed"}</div>
          </div>
        `,
      });

      marker.addListener("click", () => {
        if (overlayRef.current.infoWindow) overlayRef.current.infoWindow.close();
        info.open({ map: mapRef.current, anchor: marker });
        overlayRef.current.infoWindow = info;
      });

      overlayRef.current.markers.push(marker);
    });

    // Depot marker (square, distinct from farm stops)
    const depotMarker = new google.Marker({
      position: { lat: depot.lat, lng: depot.lng },
      map: mapRef.current,
      title: depot.name || "Depot",
      icon: {
        path: "M -9 -9 L 9 -9 L 9 9 L -9 9 z",
        fillColor: "#285f40",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        scale: 1,
      },
      zIndex: 5,
    });
    overlayRef.current.markers.push(depotMarker);

    // Dashed polyline: depot → each lot in order → depot
    if (lots.length) {
      const path = [
        { lat: depot.lat, lng: depot.lng },
        ...lots.map((lot) => {
          const c = lot.coords || { lat: depot.lat, lng: depot.lng };
          return { lat: c.lat || c[0], lng: c.lng || c[1] };
        }),
        { lat: depot.lat, lng: depot.lng },
      ];
      overlayRef.current.polyline = new google.Polyline({
        path,
        geodesic: true,
        strokeColor: "#7ca787",
        strokeOpacity: 0.75,
        strokeWeight: 3,
        icons: [
          {
            icon: { path: "M 0,-1 0,1", scale: 3, strokeOpacity: 1, strokeColor: "#7ca787" },
            offset: "0",
            repeat: "14px",
          },
        ],
        map: mapRef.current,
      });
    }

    mapRef.current.fitBounds(bounds, 64);
  }, [status, google, lots, depot]);

  if (status === "no-key" || (status === "error" && editingKey)) {
    return (
      <div className="kl-map-placeholder" style={{ ...placeholderBaseStyle, height }}>
        <span aria-hidden>🗺️</span>
        <b>Connect Google Maps</b>
        <p>Paste a Google Maps JavaScript API key to show the live cluster map. The key is stored only in this browser.</p>
        <form
          className="kl-map-key-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (keyInput.trim()) {
              setStoredKey(keyInput.trim());
              window.location.reload();
            }
          }}
        >
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="AIzaSy..."
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit" className="primary" disabled={!keyInput.trim()}>Save &amp; connect</button>
        </form>
        <small className="kl-map-foot">Tip: enable “Maps JavaScript API” in Google Cloud Console and restrict the key to your domain.</small>
        {status === "error" && <small className="kl-map-error">⚠ {error}</small>}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="kl-map-placeholder kl-map-error-state" style={{ ...placeholderBaseStyle, height }}>
        <span aria-hidden>⚠️</span>
        <b>Could not load Google Maps</b>
        <p>{error}</p>
        <button type="button" className="secondary" onClick={() => setEditingKey(true)}>Update API key</button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="kl-map-placeholder" style={{ ...placeholderBaseStyle, height }}>
        <span aria-hidden>🗺️</span>
        <b>Loading map…</b>
        <p>Connecting to Google Maps Platform.</p>
      </div>
    );
  }

  return <div ref={containerRef} className="kl-map" style={{ height }} aria-label="Suggested pickup route map" />;
}