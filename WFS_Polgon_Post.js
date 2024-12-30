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
      clickFeature = false,
      cursor = 'pointer',
      popupFields = [], 
      popupTemplate = (feature) => { 
        return popupFields.map(field => {
          return `<p><strong>${field.charAt(0).toUpperCase() + field.slice(1)}:</strong> ${feature.get(field)}</p>`;
        }).join('');
      },
      popupTrigger = 'hover', 
      landuseColors = null, 
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
  
      if (landuseColors) {
        
        const landuse = feature.get('landuse');
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
  
      // Handle popup on hover
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
  
          // Reset style for all features
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