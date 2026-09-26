import React, { useMemo, useRef } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";

export interface MapMarker {
  id: string | number;
  latitude: number;
  longitude: number;
  title?: string;
  type?: "user" | "destination" | "driver";
}

interface InteractiveMapProps {
  userLatitude?: number;
  userLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  destinationTitle?: string;
  markers?: MapMarker[];
  routeCoordinates?: [number, number][]; // [lat, lng]
  routeDuration?: string | null;
  routeDistance?: string | null;
  recenterPosition?: "top-right" | "bottom-right";
  showRecenter?: boolean;
  style?: any;
  zoom?: number;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  userLatitude = 18.5412,
  userLongitude = 73.7275,
  destinationLatitude,
  destinationLongitude,
  destinationTitle = "Destination",
  markers = [],
  routeCoordinates,
  routeDuration,
  routeDistance,
  recenterPosition = "top-right",
  showRecenter = true,
  style,
  zoom,
}) => {
  const webViewRef = useRef<WebView>(null);

  const htmlContent = useMemo(() => {
    const allMarkers: any[] = [];

    // Destination is primary if specified
    const hasDestination =
      destinationLatitude !== undefined &&
      destinationLatitude !== null &&
      destinationLongitude !== undefined &&
      destinationLongitude !== null;

    if (hasDestination) {
      allMarkers.push({
        lat: destinationLatitude,
        lng: destinationLongitude,
        title: destinationTitle,
        type: "destination",
      });
    }

    if (userLatitude && userLongitude) {
      allMarkers.push({
        lat: userLatitude,
        lng: userLongitude,
        title: "Your Location",
        type: "user",
      });
    }

    markers.forEach((m) => {
      allMarkers.push({
        lat: m.latitude,
        lng: m.longitude,
        title: m.title || "Cab",
        type: m.type || "driver",
      });
    });

    const markersJson = JSON.stringify(allMarkers);
    const hasRoute = routeCoordinates && routeCoordinates.length > 0;
    const routeJson = JSON.stringify(routeCoordinates || []);

    // Primary center: If exploring a destination, focus ON THAT DESTINATION!
    // If on home/current location, focus on user location.
    const centerLat = hasDestination ? destinationLatitude : userLatitude;
    const centerLng = hasDestination ? destinationLongitude : userLongitude;
    const initialZoom = zoom ?? (hasDestination ? 13 : 15);

    const recenterTopStyle =
      recenterPosition === "bottom-right"
        ? "bottom: 16px; right: 16px;"
        : "top: 14px; right: 14px;";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body, html, #map {
      margin: 0; padding: 0; width: 100%; height: 100%; background: #e5e3df;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
    }
    .user-pulse-container {
      position: relative; width: 26px; height: 26px;
      display: flex; align-items: center; justify-content: center;
    }
    .user-pulse-ring {
      position: absolute; width: 26px; height: 26px; border-radius: 50%;
      background: rgba(26, 115, 232, 0.28); animation: pulse 2.2s infinite ease-out;
    }
    .user-pulse-dot {
      position: absolute; width: 14px; height: 14px; border-radius: 50%;
      background: #1A73E8; border: 2.5px solid #FFFFFF;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    }
    @keyframes pulse {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(1.7); opacity: 0; }
    }
    .dest-pin-wrapper {
      position: relative; width: 32px; height: 42px;
      display: flex; flex-direction: column; align-items: center;
    }
    .dest-pin-head {
      width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
      background: #EA4335; transform: rotate(-45deg);
      border: 2px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
    }
    .dest-pin-dot {
      width: 9px; height: 9px; border-radius: 50%; background: #FFFFFF;
      transform: rotate(45deg);
    }
    .dest-pin-shadow {
      position: absolute; bottom: 0; width: 12px; height: 4px;
      background: rgba(0,0,0,0.25); border-radius: 50%;
    }
    .cab-marker {
      width: 32px; height: 32px; background: #FFFFFF; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #F59E0B; box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      font-size: 16px;
    }
    .google-badge {
      position: absolute; bottom: 10px; left: 10px; z-index: 1000;
      background: rgba(255,255,255,0.92); padding: 3px 7px; border-radius: 4px;
      font-weight: 700; font-size: 11px; letter-spacing: -0.2px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.18); display: flex; align-items: center; gap: 3px;
      pointer-events: none;
    }
    .google-g { color: #4285F4; }
    .google-o1 { color: #EA4335; }
    .google-o2 { color: #FBBC05; }
    .google-l { color: #34A853; }
    .google-e { color: #EA4335; }
    .google-recenter-fab {
      position: absolute; ${recenterTopStyle} z-index: 1000;
      width: 44px; height: 44px; background: #FFFFFF; border-radius: 50%;
      border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: background-color 0.15s, transform 0.1s;
      outline: none;
    }
    .google-recenter-fab:active {
      background-color: #F1F3F4;
      transform: scale(0.95);
    }
    .duration-badge {
      background: #1A73E8; color: #FFFFFF; padding: 5px 10px;
      border-radius: 14px; font-size: 12px; font-weight: 700;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35); border: 2px solid #FFFFFF;
      white-space: nowrap;
    }
    .leaflet-bar { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="google-badge">
    <span class="google-g">G</span><span class="google-o1">o</span><span class="google-o2">o</span><span class="google-g">g</span><span class="google-l">l</span><span class="google-e">e</span>
  </div>
  
  ${
    showRecenter
      ? `
  <!-- Authentic Google Maps "My Location" precision crosshair button -->
  <button class="google-recenter-fab" onclick="recenterMap()" aria-label="My Location">
    <svg id="crosshair-icon" width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" fill="#5F6368"/>
    </svg>
  </button>
  `
      : ""
  }

  <script>
    var userLat = ${userLatitude};
    var userLng = ${userLongitude};
    var destLat = ${destinationLatitude ?? "null"};
    var destLng = ${destinationLongitude ?? "null"};
    var hasRoute = ${hasRoute ? "true" : "false"};

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      tap: true
    }).setView([${centerLat}, ${centerLng}], ${initialZoom});

    // Real Google Maps standard road tiles
    var googleTiles = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    // High reliability CartoDB fallback layer
    var fallbackTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    });

    googleTiles.on('tileerror', function() {
      if (!map.hasLayer(fallbackTiles)) {
        fallbackTiles.addTo(map);
      }
    });

    googleTiles.addTo(map);

    // Invalidate size once container renders
    setTimeout(function() { map.invalidateSize(); }, 150);
    setTimeout(function() { map.invalidateSize(); }, 400);

    function recenterMap() {
      var icon = document.querySelector('#crosshair-icon path');
      if (icon) icon.setAttribute('fill', '#1A73E8');
      
      // If user has location, fly to user location
      if (userLat && userLng) {
        map.flyTo([userLat, userLng], 15, { duration: 0.9 });
      } else if (destLat && destLng) {
        map.flyTo([destLat, destLng], 14, { duration: 0.9 });
      }
      
      setTimeout(function() {
        if (icon) icon.setAttribute('fill', '#5F6368');
      }, 1500);
    }

    var markersData = ${markersJson};
    markersData.forEach(function(item) {
      var icon;
      if (item.type === 'user') {
        icon = L.divIcon({
          className: '',
          html: '<div class="user-pulse-container"><div class="user-pulse-ring"></div><div class="user-pulse-dot"></div></div>',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });
      } else if (item.type === 'destination') {
        icon = L.divIcon({
          className: '',
          html: '<div class="dest-pin-wrapper"><div class="dest-pin-head"><div class="dest-pin-dot"></div></div><div class="dest-pin-shadow"></div></div>',
          iconSize: [32, 42],
          iconAnchor: [16, 40]
        });
      } else {
        icon = L.divIcon({
          className: '',
          html: '<div class="cab-marker">🚗</div>',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
      }

      var m = L.marker([item.lat, item.lng], { icon: icon }).addTo(map);
      if (item.title) {
        m.bindPopup("<b>" + item.title + "</b>");
      }
    });

    var route = ${routeJson};
    if (hasRoute && route.length > 0) {
      // Outer border for 3D depth matching Google Maps
      L.polyline(route, {
        color: '#1557B0',
        weight: 7,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Inner vibrant Google blue path
      var activeRoute = L.polyline(route, {
        color: '#4285F4',
        weight: 5,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      map.fitBounds(activeRoute.getBounds(), { padding: [40, 40] });

      ${
        routeDuration
          ? `
      var midIdx = Math.floor(route.length / 2);
      var midPoint = route[midIdx];
      var badgeHtml = '<div class="duration-badge">🚗 ${routeDuration}${routeDistance ? ` (${routeDistance})` : ""}</div>';
      var badgeIcon = L.divIcon({
        className: '',
        html: badgeHtml,
        iconAnchor: [50, 14]
      });
      L.marker(midPoint, { icon: badgeIcon }).addTo(map);
      `
          : ""
      }
    }
  </script>
</body>
</html>
    `;
  }, [
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
    destinationTitle,
    markers,
    routeCoordinates,
    routeDuration,
    routeDistance,
    recenterPosition,
    zoom,
  ]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color="#1A73E8" />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#e5e3df",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f3f4",
  },
});

export default InteractiveMap;
