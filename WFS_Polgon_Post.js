function fetchWFSGeoJSON(wfsUrl, params, onSuccess, onError) {
  fetch(wfsUrl, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
  })
      .then((response) => response.json())
      .then((data) => {
          if (data.error) {
              console.error('Error fetching WFS data:', data.error);
              if (onError) onError(data.error);
          } else {
              console.log('Fetched WFS GeoJSON Data:', data);
              if (onSuccess) onSuccess(data);
          }
      })
      .catch((error) => {
          console.error('Error fetching WFS data:', error);
          if (onError) onError(error);
      });
}

function addWFSLayer(
  map,
  geojsonData,
  {
      layerName = '',
      boundaryColor = 'blue',
      fillColor = 'rgba(60, 114, 229, 0.5)',
      opacity = 0.8,
      width = 2,
      hoverBoundaryColor = 'yellow',
      hoverFillColor = 'rgba(255, 255, 0, 0.5)',
      hoverOpacity = 0.7,
      zoomToLayer = false,
      zoomTime = 2000,
      zoomToFeature = false,
      cursor = 'pointer',
      popupFields = [],
      popupTemplate = (feature) => {
          return popupFields.map((field) => {
              return `<p><strong>${field.charAt(0).toUpperCase() + field.slice(1)}:</strong> ${feature.get(field)}</p>`;
          }).join('');
      },
      popupTrigger = 'hover',
      landuseColors = {}, // Default to an empty object
      landuseField = '' // User-defined field for land use classification
  }
) {
  const vectorSource = new ol.source.Vector({
      features: new ol.format.GeoJSON({
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857',
      }).readFeatures(geojsonData),
  });

  const getFeatureStyle = (feature, isHovered = false, isClicked = false) => {
      let colors = { fillColor, boundaryColor };

      if (landuseColors && landuseField) {
          const landuse = feature.get(landuseField);
          colors = landuseColors[landuse] || { fillColor, boundaryColor };
      }

      return new ol.style.Style({
          stroke: new ol.style.Stroke({
              color: isClicked ? hoverBoundaryColor : isHovered ? hoverBoundaryColor : colors.boundaryColor,
              width: width,
          }),
          fill: new ol.style.Fill({
              color: isClicked ? hoverFillColor : isHovered ? hoverFillColor : colors.fillColor,
              opacity: isClicked || isHovered ? hoverOpacity : opacity,
          }),
      });
  };

  const vectorLayer = new ol.layer.Vector({
      source: vectorSource,
      style: (feature) => getFeatureStyle(feature),
      properties: { layerName },
  });

  let previousFeature = null;
  let clickedFeature = null;

  map.on('pointermove', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feat) => feat);

      if (popupTrigger === 'hover' && feature) {
          map.getTargetElement().style.cursor = cursor;
          if (popupFields.length > 0) {
              const popupContent = popupTemplate(feature);
              document.getElementById('popup').innerHTML = popupContent;
              document.getElementById('popup').style.display = 'block';
              document.getElementById('popup').style.left = `${event.pixel[0] + 15}px`;
              document.getElementById('popup').style.top = `${event.pixel[1] + 15}px`;
          }
      } else if (popupTrigger === 'hover') {
          map.getTargetElement().style.cursor = 'default';
          document.getElementById('popup').style.display = 'none';
      }

      if (feature !== previousFeature) {
          if (previousFeature && previousFeature !== clickedFeature) {
              previousFeature.setStyle(getFeatureStyle(previousFeature, false, false));
          }
          if (feature && feature !== clickedFeature) {
              feature.setStyle(getFeatureStyle(feature, true, false));
          }
          previousFeature = feature;
      }
  });

  if (popupTrigger === 'click') {
      map.on('singleclick', (event) => {
          const clicked = map.forEachFeatureAtPixel(event.pixel, (feat) => feat);

          if (clickedFeature && clickedFeature !== clicked) {
              clickedFeature.setStyle(getFeatureStyle(clickedFeature, false, false));
          }

          if (!clicked) {
              clickedFeature = null;
              document.getElementById('popup').style.display = 'none';

              vectorSource.forEachFeature((feature) => {
                  feature.setStyle(getFeatureStyle(feature, false, false));
              });
          } else {
              clicked.setStyle(getFeatureStyle(clicked, false, true));
              clickedFeature = clicked;

              if (popupFields.length > 0) {
                  const popupContent = popupTemplate(clicked);
                  document.getElementById('popup').innerHTML = popupContent;
                  document.getElementById('popup').style.display = 'block';
                  document.getElementById('popup').style.left = `${event.pixel[0] + 15}px`;
                  document.getElementById('popup').style.top = `${event.pixel[1] + 15}px`;
              }
          }
      });
  }

  map.addLayer(vectorLayer);

  if (zoomToLayer) {
      const extent = vectorSource.getExtent();
      map.getView().fit(extent, { duration: zoomTime });
  }

  if (zoomToFeature) {
      map.on('singleclick', (event) => {
          const feature = map.forEachFeatureAtPixel(event.pixel, (feat) => feat);
          if (feature) {
              const featureExtent = feature.getGeometry().getExtent();
              map.getView().fit(featureExtent, { duration: zoomTime });
          }
      });
  }
}

//---------------------------------------------------------------------------
//write a .php

// <?php

// header("Access-Control-Allow-Origin: *"); remove corss issue
// header("Access-Control-Allow-Methods: POST, OPTIONS"); declare method
// header("Access-Control-Allow-Headers: Content-Type");

// if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
//     exit(0); 
// }

// $validToken = '12345'; //assign a token

// $data = json_decode(file_get_contents('php://input'), true);
// $token = $data['token'] ?? '';

// if ($token !== $validToken) {
//     echo json_encode(['error' => 'Access denied: Invalid token']);
//     exit();
// }
// //wfs url
// $wfsUrl = 'url';

// $response = file_get_contents($wfsUrl);

// if ($response === false) {
//     echo json_encode(['error' => 'Failed to fetch WFS data']);
//     exit();
// }

// header('Content-Type: application/json');
// echo $response;
// ?>
//-----------------------------------------------------------------------------------------------------------
//write index.html
// <div id="map"></div>
//   <div id="popup" class="popup"></div>
//-----------------------------------------------------------------------------------------------------------
//wtite style.css
// body {
//     margin: 0;
//     padding: 0; 
//   }
  
//   #map {
//     width: 100vw;
//     height: 100vh;
//   }
  

//   .popup {
//     position: absolute;
//     color: rgb(30, 29, 29);
//     background-color: rgb(254, 243, 243);
//     border: 1px solid rgb(126, 123, 123);
//     border-radius: 5px;
//     padding: 5px; /* Reduced padding */
//     box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2); 
//     white-space: nowrap; 
//     max-width: 250px; 
//     transform: translate(2px, 2px); 
//   }
  
//   .popup-content h4 {
//     font-size: 16px; 
//     margin: 0 0 5px 0; 
//   }
  
//   .popup-content p {
//     margin: 0;
//     font-size: 15px;
//     line-height: 1.2; 
//   }
  
//   .popup-content strong {
//     font-weight: bold;
//     font-size: 10px;
//     font-size: 15px;
//   }
  
//   ul.popup-list {
//     list-style: none;
//     padding: 0; 
//     margin: 0; 
//     display: flex;
//     flex-direction: column;
//   }
  
//   ul.popup-list li {
//     display: flex;
//     justify-content: space-between; 
//     padding: 3px 5px; 
//     font-size: 15px; 
//   }
  
//   ul.popup-list li:nth-child(odd) {
//     background-color: white;
//   }
  
//   ul.popup-list li:nth-child(even) {
//     background-color: rgb(226, 217, 217); 
//   }
  
//   ul.popup-list li span.popup-value {
//     margin-left: 5px; 
//   }
  
//   ul.popup-list li:nth-child(even):hover {
//     background-color: rgb(114, 114, 186);
//   }
  
//   ul.popup-list li:nth-child(odd):hover {
//     background-color: rgb(114, 114, 186);
//   }
//----------------------------------------------------------------------------------------------------------------
//write js
// WFS layer url body
// const wfsParams = {
//   service: 'WFS',
//   version: '1.0.0',
//   request: 'GetFeature',
//   typeName: 'test:plots', 
//   outputFormat: 'application/json',
//   token: '12345', 
// };

// // Define the WFS proxy URL
// const wfsUrl = 'http://localhost/WFS/wfs_proxy.php'; // path of php
//---------------------------------------------------------------------------------------------------------------------
//lets also create a map
//---------------------------------------------------------------------------------------------------------------------
// catagorized layer
// const landuseColors = {
//   "RESIDENTIAL": { fillColor: 'rgba(0, 255, 0, 0.5)', boundaryColor: 'green' },
//   "COMMERCIAL": { fillColor: 'rgba(255, 0, 0, 0.5)', boundaryColor: 'red' },
//   "OFFICE_BLOCK": { fillColor: 'rgba(0, 0, 255, 0.5)', boundaryColor: 'blue' },
//   "Open Spaces": { fillColor: 'rgb(60, 255, 0)', boundaryColor: 'green' },
//   "Plots Inner Boundary": { fillColor: 'rgb(245, 23, 234)', boundaryColor: 'white' },
// };
//-----------------------------------------------------------------------------------------------------------------------
//Arguments

// fetchWFSGeoJSON(wfsUrl, wfsParams, (geojsonData) => {
//   addWFSLayer(map, geojsonData, {
//       layerName: 'plots', //layer name
//       boundaryColor: 'blue', //edge color default
//       fillColor: 'rgba(19, 231, 247, 0.5)', //fillcolor default
//       landuseColors: landuseColors, //catagorized layer
//       landuseField: 'landuse', // field for symbology
//       opacity: 0.6, // default opacity
//       width: 2, //edges width
//       hoverBoundaryColor: 'red', //hover edge olor
//       hoverFillColor: 'rgb(255, 255, 73)', //hover fill color
//       hoverOpacity: 0.7, //hover opacity
//       zoomToLayer: true, // zoom to this layer true or false
//       zoomTime: 500, // zoom to layer animation time
//       zoomToFeature: true, // onclick feature zoom to layer true or false
//       cursor: 'pointer', // on hover cusrur behavior
//       popupFields: ['id', 'landuse', 'phase'], // select popup fields
//       popupTemplate: (feature) => {
//           return `
//               <div class="popup-content">
//                   <h4 style="text-align: center;color: rgb(35, 21, 21)"><strong>${feature.get('landuse')}</strong></h4>
//                   <ul class="popup-list">
//                       <li><strong>Landuse:</strong><span class="popup-value">${feature.get('landuse')}</span></li>
//                       <li><strong>ID:</strong><span class="popup-value">${feature.get('id')}</span></li>
//                       <li><strong>Phase:</strong><span class="popup-value">${feature.get('phase')}</span></li>
//                   </ul>
//               </div>
//           `;
//       },
//       popupTrigger: 'hover', //popup trigger behaviour click or hover
//   });
// });
