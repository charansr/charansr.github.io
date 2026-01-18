// Initialize map
const map = L.map("map").setView([47.61, -122.33], 11);

// Basemap
L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  {
    attribution: "© OpenStreetMap © CARTO",
    subdomains: "abcd",
    maxZoom: 19
  }
).addTo(map);

// Simple color ramp (no D3)
function getColor(pois) {
  if (pois == null) return "#cccccc";
  if (pois > 8) return "#08306b";
  if (pois > 6) return "#2171b5";
  if (pois > 4) return "#4292c6";
  if (pois > 2) return "#6baed6";
  if (pois > 1) return "#9ecae1";
  return "#c6dbef";
}

function style(feature) {
  const props = feature.properties || {};
  return {
    fillColor: props.success ? getColor(props.avg_pois) : "#cccccc",
    weight: 0.7,
    color: "#444",
    fillOpacity: 0.75
  };
}

function tooltipContent(props) {
  if (!props || !props.success) {
    return "<strong>No data available</strong>";
  }

  return `
    <strong>Census Tract ${props.geoid}</strong><br/>
    Avg POIs: ${props.avg_pois.toFixed(2)}<br/>
    Avg Cost: ${props.avg_cost.toFixed(1)}<br/>
    Sidewalks: ${props.avg_sidewalks.toFixed(2)}<br/>
    Crossings: ${props.avg_crossings.toFixed(2)}<br/>
    Curb Ramp Rate: ${props.curbramp_rate.toFixed(1)}%
  `;
}

// Load GeoJSON
fetch("./data/seattle_accessibility.geojson")
  .then(res => {
    if (!res.ok) {
      throw new Error("GeoJSON failed to load");
    }
    return res.json();
  })
  .then(data => {
    console.log("GeoJSON loaded:", data.features.length, "features");

    const geojsonLayer = L.geoJSON(data, {
      style,
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: e => {
            e.target.setStyle({ weight: 2 });
            e.target.bindTooltip(
              tooltipContent(feature.properties),
              { sticky: true }
            ).openTooltip();
          },
          mouseout: e => {
            geojsonLayer.resetStyle(e.target);
          }
        });
      }
    }).addTo(map);

    // 🔑 THIS IS CRITICAL
    map.fitBounds(geojsonLayer.getBounds(), { padding: [20, 20] });
  })
  .catch(err => {
    console.error("Map failed:", err);
  });
