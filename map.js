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
    label: "Average Accessible Transit",
    domain: [0, 20],
    invert: false,
    format: v => v.toFixed(2)
  },
  avg_sidewalks: {
    label: "Sidewalk Frequency",
    domain: [0, 20],
    invert: false,
    format: v => v.toFixed(2)
  },
  avg_crossings: {
    label: "Crossing Count",
    domain: [0, 10],
    invert: false,
    format: v => v.toFixed(2)
  },
  curbramp_rate: {
    label: "Curb Ramp Coverage (%)",
    domain: [0, 100],
    invert: false,
    format: v => `${v.toFixed(1)}%`
  },
  avg_cost: {
    label: "Average Travel Cost",
    domain: [0, 1000],
    invert: true, // IMPORTANT
    format: v => v.toFixed(0)
  }
};


let activeMetric = "avg_pois";

// Color scale
function getColor(value, domain, invert = false) {
  if (value === null || value === undefined) return "#e0e0e0";

  let t = (value - domain[0]) / (domain[1] - domain[0]);
  t = Math.max(0, Math.min(1, t));

  if (invert) t = 1 - t;

  // Red → Yellow → Green
  const r = t < 0.5 ? 255 : Math.round(255 - 510 * (t - 0.5));
  const g = t < 0.5 ? Math.round(510 * t) : 255;
  const b = 80;

  return `rgb(${r}, ${g}, ${b})`;
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
    fillColor: getColor(
      p[activeMetric],
      metric.domain,
      metric.invert
    ),
    weight: 0.6,
    color: "#444",
    fillOpacity: 0.85
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
  updateLegend(div);
  return div;
};

function updateLegend(div) {
  const metric = metrics[activeMetric];

  div.innerHTML = `
    <strong>${metric.label}</strong>
    <div class="legend-bar"></div>
    <div class="legend-labels">
      <span>${metric.invert ? "High" : "Low"}</span>
      <span>${metric.invert ? "Low" : "High"}</span>
    </div>
    <div class="legend-nodata">
      <i></i> No data
    </div>
  `;

  const bar = div.querySelector(".legend-bar");

  bar.style.background = `
    linear-gradient(to right,
      ${getColor(metric.domain[0], metric.domain, metric.invert)},
      ${getColor(
        (metric.domain[0] + metric.domain[1]) / 2,
        metric.domain,
        metric.invert
      )},
      ${getColor(metric.domain[1], metric.domain, metric.invert)}
    )
  `;
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
