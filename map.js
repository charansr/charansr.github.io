const map = L.map("map").setView([47.61, -122.33], 11);

// Base map
L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  { attribution: "© OpenStreetMap © CARTO" }
).addTo(map);

// ==========================
// Metric configuration
// ==========================
const metrics = {
  avg_pois: {
    label: "Average Accessible POIs",
    domain: [0, 20],
    format: v => v.toFixed(2)
  },
  avg_sidewalks: {
    label: "Sidewalk Quality Score",
    domain: [0, 20],
    format: v => v.toFixed(2)
  },
  avg_crossings: {
    label: "Crossing Accessibility",
    domain: [0, 10],
    format: v => v.toFixed(2)
  },
  curbramp_rate: {
    label: "Curb Ramp Coverage (%)",
    domain: [0, 100],
    format: v => `${v.toFixed(1)}%`
  },
  avg_cost: {
    label: "Average Travel Cost",
    domain: [0, 1000],
    format: v => v.toFixed(0)
  }
};

let activeMetric = "avg_pois";

// Color scale
function getColor(value, domain) {
  if (value === null || value === undefined) return "#cccccc";

  const t = Math.max(
    0,
    Math.min(1, (value - domain[0]) / (domain[1] - domain[0]))
  );

  // perceptually smooth blue → purple
  return `rgb(${50 + 120 * t}, ${120 - 40 * t}, ${200 - 80 * t})`;
}

// ==========================
// Styling
// ==========================
function style(feature) {
  const p = feature.properties;

  if (!p.success) {
    return {
      fillColor: "#e0e0e0",
      weight: 0.5,
      color: "#999",
      fillOpacity: 0.6
    };
  }

  const metric = metrics[activeMetric];
  return {
    fillColor: getColor(p[activeMetric], metric.domain),
    weight: 0.6,
    color: "#444",
    fillOpacity: 0.8
  };
}

// ==========================
// Tooltip
// ==========================
function tooltipContent(p) {
  if (!p.success) {
    return "<strong>No accessibility data available</strong>";
  }

  return `
    <strong>Census Tract ${p.geoid}</strong><br/>
    ${metrics.avg_pois.label}: ${metrics.avg_pois.format(p.avg_pois)}<br/>
    Sidewalks: ${metrics.avg_sidewalks.format(p.avg_sidewalks)}<br/>
    Crossings: ${metrics.avg_crossings.format(p.avg_crossings)}<br/>
    Curb Ramp Rate: ${metrics.curbramp_rate.format(p.curbramp_rate)}<br/>
    Avg Cost: ${metrics.avg_cost.format(p.avg_cost)}
  `;
}

// ==========================
// Legend
// ==========================
const legend = L.control({ position: "bottomleft" });

legend.onAdd = function () {
  const div = L.DomUtil.create("div", "legend");
  div.innerHTML = `<strong>${metrics[activeMetric].label}</strong><br/>`;
  updateLegend(div);
  return div;
};

function updateLegend(div) {
  const { domain } = metrics[activeMetric];
  div.innerHTML = `<strong>${metrics[activeMetric].label}</strong><br/>`;

  for (let i = 0; i <= 5; i++) {
    const v = domain[0] + (i / 5) * (domain[1] - domain[0]);
    div.innerHTML += `
      <i style="background:${getColor(v, domain)}"></i>
      ${v.toFixed(1)}<br/>
    `;
  }

  div.innerHTML += `<i style="background:#e0e0e0"></i> No data`;
}

legend.addTo(map);

// ==========================
// Load data
// ==========================
let geojsonLayer;

fetch("data/seattle_accessibility.geojson")
  .then(res => res.json())
  .then(data => {
    geojsonLayer = L.geoJSON(data, {
      style,
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: e => {
            e.target.setStyle({ weight: 2 });
            layer.bindTooltip(
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
  });

// ==========================
// Metric selector
// ==========================
document.getElementById("metric-select").addEventListener("change", e => {
  activeMetric = e.target.value;
  geojsonLayer.setStyle(style);
  updateLegend(document.querySelector(".legend"));
});
