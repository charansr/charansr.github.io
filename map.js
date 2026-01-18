const map = L.map("map").setView([47.61, -122.33], 11);

// Professional neutral basemap
L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  { attribution: "© OpenStreetMap © CARTO" }
).addTo(map);

// Color scale for avg POIs
const colorScale = d3.scaleSequential()
  .domain([0, 8])
  .interpolator(d3.interpolateBlues);

function style(feature) {
  if (!feature.properties.success) {
    return {
      fillColor: "#cccccc",
      weight: 0.5,
      color: "#999",
      fillOpacity: 0.6
    };
  }

  return {
    fillColor: colorScale(feature.properties.avg_pois),
    weight: 0.5,
    color: "#555",
    fillOpacity: 0.75
  };
}

function tooltipContent(props) {
  if (!props.success) {
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

fetch("data/seattle_accessibility.geojson")
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
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
            geojson.resetStyle(e.target);
          }
        });
      }
    }).addTo(map);
  });
