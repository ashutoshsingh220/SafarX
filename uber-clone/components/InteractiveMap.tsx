import React, { useMemo, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from "react-native";
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
  style,
  zoom = 14,
}) => {
  const webViewRef = useRef<WebView>(null);

  const htmlContent = useMemo(() => {
    const allMarkers: any[] = [];

    if (userLatitude && userLongitude) {
      allMarkers.push({
        lat: userLatitude,
        lng: userLongitude,
        title: "Your Location",
        type: "user",
      });
    }

    if (destinationLatitude && destinationLongitude) {
      allMarkers.push({
        lat: destinationLatitude,
        lng: destinationLongitude,
        title: destinationTitle,
        type: "destination",
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
    const routeJson = JSON.stringify(routeCoordinates || []);

    const centerLat = destinationLatitude && !userLatitude ? destinationLatitude : userLatitude;
    const centerLng = destinationLongitude && !userLongitude ? destinationLongitude : userLongitude;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    body, html, #map {
      margin: 0; padding: 0; width: 100%; height: 100%; background: #e5e3df;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .user-pulse-container {
      position: relative; width: 24px; height: 24px;
      display: flex; align-items: center; justify-content: center;
    }
    .user-pulse-ring {
      position: absolute; width: 24px; height: 24px; border-radius: 50%;
      background: rgba(26, 115, 232, 0.25); animation: pulse 2s infinite ease-out;
    }
    .user-pulse-dot {
      position: absolute; width: 14px; height: 14px; border-radius: 50%;
      background: #1A73E8; border: 2.5px solid #FFFFFF;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    }
    @keyframes pulse {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .dest-pin {
      width: 26px; height: 26px; border-radius: 50% 50% 50% 0;
      background: #EA4335; transform: rotate(-45deg);
      border: 2px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
    }
    .dest-inner {
      width: 8px; height: 8px; border-radius: 50%; background: #FFFFFF;
      transform: rotate(45deg);
    }
    .cab-marker {
      width: 32px; height: 32px; background: #FFFFFF; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #F59E0B; box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      font-size: 16px;
    }
    .google-badge {
      position: absolute; bottom: 8px; left: 8px; z-index: 1000;
      background: rgba(255,255,255,0.92); padding: 2px 6px; border-radius: 4px;
      font-weight: 700; font-size: 11px; letter-spacing: -0.2px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.18); display: flex; align-items: center; gap: 3px;
    }
    .google-g { color: #4285F4; }
    .google-o1 { color: #EA4335; }
    .google-o2 { color: #FBBC05; }
    .google-l { color: #34A853; }
    .google-e { color: #EA4335; }
    .recenter-btn {
      position: absolute; top: 12px; right: 12px; z-index: 1000;
      width: 38px; height: 38px; background: #FFFFFF; border-radius: 50%;
      border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 18px; color: #5F6368;
    }
    .duration-badge {
      background: #1A73E8; color: #FFFFFF; padding: 4px 8px;
      border-radius: 12px; font-size: 11px; font-weight: 700;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1.5px solid #FFFFFF;
      white-space: nowrap;
    }
    .leaflet-bar { display: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="google-badge">
    <span class="google-g">G</span><span class="google-o1">o</span><span class="google-o2">o</span><span class="google-g">g</span><span class="google-l">l</span><span class="google-e">e</span>
  </div>
  <button class="recenter-btn" onclick="recenterToUser()" title="My Location">🎯</button>

  <script>
    var userLat = ${userLatitude};
    var userLng = ${userLongitude};

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${centerLat}, ${centerLng}], ${zoom});

    // Real Google Maps standard road tiles
    var googleTiles = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    // High reliability CartoDB fallback
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

    function recenterToUser() {
      if (userLat && userLng) {
        map.flyTo([userLat, userLng], 15, { duration: 0.8 });
      }
    }

    var markersData = ${markersJson};
    var bounds = [];

    markersData.forEach(function(item) {
      var icon;
      if (item.type === 'user') {
        icon = L.divIcon({
          className: '',
          html: '<div class="user-pulse-container"><div class="user-pulse-ring"></div><div class="user-pulse-dot"></div></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
      } else if (item.type === 'destination') {
        icon = L.divIcon({
          className: '',
          html: '<div class="dest-pin"><div class="dest-inner"></div></div>',
          iconSize: [26, 26],
          iconAnchor: [13, 26]
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
      bounds.push([item.lat, item.lng]);
    });

    var route = ${routeJson};
    if (route && route.length > 0) {
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

      map.fitBounds(activeRoute.getBounds(), { padding: [35, 35] });

      ${
        routeDuration
          ? `
      var midIdx = Math.floor(route.length / 2);
      var midPoint = route[midIdx];
      var badgeHtml = '<div class="duration-badge">🚗 ${routeDuration}${routeDistance ? ` (${routeDistance})` : ""}</div>';
      var badgeIcon = L.divIcon({
        className: '',
        html: badgeHtml,
        iconAnchor: [45, 12]
      });
      L.marker(midPoint, { icon: badgeIcon }).addTo(map);
      `
          : ""
      }
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [35, 35] });
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
