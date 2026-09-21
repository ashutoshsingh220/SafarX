import React, { useMemo } from "react";
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
  style?: any;
  zoom?: number;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  userLatitude = 18.5204,
  userLongitude = 73.8567,
  destinationLatitude,
  destinationLongitude,
  destinationTitle = "Destination",
  markers = [],
  routeCoordinates,
  style,
  zoom = 13,
}) => {
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
        title: m.title || "Marker",
        type: m.type || "driver",
      });
    });

    const markersJson = JSON.stringify(allMarkers);
    const routeJson = JSON.stringify(routeCoordinates || []);

    const centerLat = destinationLatitude ?? userLatitude;
    const centerLng = destinationLongitude ?? userLongitude;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map {
      margin: 0; padding: 0; width: 100%; height: 100%; background: #f3f4f6;
    }
    .user-pulse {
      width: 18px; height: 18px; border-radius: 50%; background: #0286FF;
      border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(2, 134, 255, 0.6);
    }
    .dest-pin {
      background: #EF4444; width: 22px; height: 22px; border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg); border: 2px solid #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .cab-pin {
      background: #F59E0B; width: 22px; height: 22px; border-radius: 50%;
      border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center;
      font-size: 11px; box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }
    .leaflet-bar { border-radius: 10px; overflow: hidden; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([${centerLat}, ${centerLng}], ${zoom});

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    var markersData = ${markersJson};
    var bounds = [];

    markersData.forEach(function(item) {
      var icon;
      if (item.type === 'user') {
        icon = L.divIcon({
          className: 'custom-user-icon',
          html: '<div class="user-pulse"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
      } else if (item.type === 'destination') {
        icon = L.divIcon({
          className: 'custom-dest-icon',
          html: '<div class="dest-pin"></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 22]
        });
      } else {
        icon = L.divIcon({
          className: 'custom-cab-icon',
          html: '<div class="cab-pin">🚕</div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
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
      var polyline = L.polyline(route, {
        color: '#0286FF',
        weight: 5,
        opacity: 0.85,
        smoothFactor: 1
      }).addTo(map);
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
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
    zoom,
  ]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color="#0286FF" />
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
    backgroundColor: "#e5e7eb",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
});

export default InteractiveMap;
