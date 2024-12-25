function addOL_WFSPolygon(
  url,
  layerName,
  boundaryColor = 'black', // Default boundary color
  fillColor = 'rgba(255, 255, 255, 0.5)', // Default fill color
  opacity = 1.0, // Default opacity
  boundaryWidth = 1, // Default boundary width
  hoverStyles = {}, // Hover styles including cursor
  zoomOption = {},
  field = 'landuse', // Default field to classify by
  classify = {} // Default classify configuration
) {
  // Create the vector source for WFS (Web Feature Service)
  const vectorSource = new ol.source.Vector({
    url: url,
    format: new ol.format.GeoJSON(),
  });

  // Create the vector layer for WFS
  const vectorLayer = new ol.layer.Vector({
    source: vectorSource,
  });

  // Add layer to the map
  map.addLayer(vectorLayer);

  // Apply styles based on classify or default styles
  const styleFunction = function (feature) {
    let currentFillColor = fillColor; // Use the default fill color
    let currentBoundaryColor = boundaryColor; // Use the default boundary color

    // Get the value of the specified field from the feature
    const fieldValue = feature.get(field);

    // Apply styles based on the classify object if provided
    if (classify && classify[fieldValue]) {
      currentFillColor = classify[fieldValue].fillColor || currentFillColor;
      currentBoundaryColor = classify[fieldValue].boundaryColor || currentBoundaryColor;
    }

    // Return the style object for this feature
    return new ol.style.Style({
      fill: new ol.style.Fill({
        color: currentFillColor,
      }),
      stroke: new ol.style.Stroke({
        color: currentBoundaryColor,
        width: boundaryWidth,
      }),
    });
  };

  // Set the style for the vector layer
  vectorLayer.setStyle(styleFunction);

  // Handle hover effect (highlighting features when mouse moves over them)
  if (hoverStyles) {
    let highlightedFeature = null;

    map.on('pointermove', function (event) {
      const feature = map.forEachFeatureAtPixel(event.pixel, function (feature) {
        return feature;
      });

      // If a feature is highlighted and mouse moves to a new feature, restore original style
      if (feature !== highlightedFeature) {
        if (highlightedFeature) {
          // Restore original style
          highlightedFeature.setStyle(styleFunction(highlightedFeature));
        }
        highlightedFeature = feature;

        if (highlightedFeature) {
          // Apply hover style
          const hoverStyle = new ol.style.Style({
            fill: new ol.style.Fill({
              color: hoverStyles.hoverFillColor || 'rgba(255, 255, 0, 0.5)', // Default hover fill color
            }),
            stroke: new ol.style.Stroke({
              color: hoverStyles.hoverBoundaryColor || 'green', // Default hover boundary color
              width: 3,
            }),
          });
          highlightedFeature.setStyle(hoverStyle);
        }
      }
    });

    // Reset the style when the mouse leaves the feature
    map.on('pointerout', function () {
      if (highlightedFeature) {
        highlightedFeature.setStyle(styleFunction(highlightedFeature));
        highlightedFeature = null;
      }
    });
  }

  // Handle the cursor style when hovering over the polygons
  map.on('pointermove', function (event) {
    const feature = map.forEachFeatureAtPixel(event.pixel, function (feature) {
      return feature;
    });

    if (feature && hoverStyles.cursor) {
      // Set the cursor to the style defined in hoverStyles.cursor
      map.getTargetElement().style.cursor = hoverStyles.cursor;
    } else {
      // Set the cursor to default when not hovering over any feature
      map.getTargetElement().style.cursor = 'default';
    }
  });

  // Handle zoom options
  if (zoomOption) {
    // Zoom to the full extent of the layer if `zoomToLayer` is true
    if (zoomOption.zoomToLayer) {
      vectorSource.once('change', function () {
        if (vectorSource.getState() === 'ready') {
          const extent = vectorSource.getExtent();
          map.getView().fit(extent, { duration: 1000, maxZoom: zoomOption.zoomLevel || 15 });
        }
      });
    }

    // Zoom to the clicked feature if `zoomToFeature` is true
    if (zoomOption.zoomToFeature) {
      map.on('singleclick', function (event) {
        const feature = map.forEachFeatureAtPixel(event.pixel, function (feature) {
          return feature;
        });

        if (feature) {
          const geometry = feature.getGeometry();
          const extent = geometry.getExtent();

          // Zoom to the feature's extent with animation
          map.getView().fit(extent, { duration: 1000 });
        }
      });
    }
  }
}


// addOL_WFSPolygon(
//   'http://localhost:8080/geoserver/CBD/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=CBD:plots&outputFormat=application/json',
//   'Plots Layer',
//   'black', // Boundary color
//   'rgba(255, 255, 255, 0.5)', // Fill color
//   0.8, // Opacity
//   2, // Boundary width
//   { hoverBoundaryColor: 'green', hoverFillColor: 'rgba(255, 255, 0, 0.5)', hoverOpacity: 0.7, cursor: 'cursur' }, // default, pointer, crosshair, move, text, wait, not-allowed, help, zoom-in, zoom-out, e-resize, n-resize, ne-resize, grab, grabbing, all-scroll
//   {
//     zoomToLayer: true,
//     zoomLevel: 16,
//     zoomToFeature: true,
//   },
//   'landuse', // Field to classify by
//   {
//     "RESIDENTIAL": { fillColor: 'rgba(0, 255, 0, 0.5)', boundaryColor: 'green' },
//     "COMMERCIAL": { fillColor: 'rgba(255, 0, 0, 0.5)', boundaryColor: 'red' },
//     "OFFICE_BLOCK": { fillColor: 'rgba(0, 0, 255, 0.5)', boundaryColor: 'blue' },
//     "Open Spaces": { fillColor: 'rgb(60, 255, 0)', boundaryColor: 'white' },
//     "Plots Inner Boundary": { fillColor: 'rgb(245, 23, 234)', boundaryColor: 'white' }
//   }
// );
 
  
  


// ------------------------------------

// Function to add popup to polygons with existing styles
function addPopupToPolygon(
  layer, // Existing layer added via addOL_WFSPolygon
  popupOptions = {
      popupField: ['Zone', 'id'], // Fields to display in the popup
      popupTemplate: (feature) => {
          const fields = popupOptions.popupField.map(
              (field) => `<p><strong>${field}:</strong> ${feature.get(field)}</p>`
          ).join('');
          return `<div class="popup-content">${fields}</div>`;
      },
      trigger: 'click', // Options: 'click' or 'hover'
  }
) {
  // Overlay for the popup
  const popupOverlay = new ol.Overlay({
      element: document.getElementById('popup'),
      autoPan: false,
      autoPanAnimation: { duration: 250 },
  });

  // Add overlay to the map
  map.addOverlay(popupOverlay);

  // Show popup on click or hover
  map.on(popupOptions.trigger === 'hover' ? 'pointermove' : 'singleclick', function (event) {
      const feature = map.forEachFeatureAtPixel(event.pixel, function (feature) {
          return feature;
      });

      const popupElement = popupOverlay.getElement();

      if (feature) {
          const coordinate = event.coordinate;

          // Generate popup content using the provided template
          const popupContent = popupOptions.popupTemplate(feature);

          // Update popup content and position
          popupElement.innerHTML = popupContent;
          popupOverlay.setPosition(coordinate);

          // Show the popup
          popupElement.style.display = 'block';
      } else {
          // Hide the popup
          popupElement.style.display = 'none';
      }
  });
}



{/* <div id="popup" class="popup"></div> */}

// .popup {
//     position: absolute;
//     color:aliceblue;
//     background-color: rgb(86, 82, 82);
//     border: 1px solid rgb(241, 234, 234);
//     border-radius: 5px;
//     padding: 10px;
//     box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
//     white-space: nowrap; /* Prevent text wrapping */
// }

// .popup-content p {
//     margin: 0;
//     font-size: 14px;
//     line-height: 1.5; /* Adjust line spacing for better readability */
// }

// .popup-content strong {
//     font-weight: bold;
// }

// addPopupToPolygon(
//   'http://localhost:8080/geoserver/CBD/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=CBD:plots&outputFormat=application/json',
//   {
//       popupField: ['landuse', 'id'], // Fields to display in the popup
//       popupTemplate: (feature) => {
//           return `
//               <div class="popup-content">
//                   <p><strong>landuse:</strong> ${feature.get('landuse')}</p>
//                   <p><strong>ID:</strong> ${feature.get('id')}</p>
//               </div>
//           `;
//       },
//       trigger: 'hover', // Trigger options: 'click' or 'hover'
//   }
// );


