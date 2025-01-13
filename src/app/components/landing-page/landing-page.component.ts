// src/app/components/landing-page/landing-page.component.ts

import { 
  Component, 
  OnInit, 
  AfterViewInit, 
  ViewChild, 
  ElementRef, 
  HostListener 
} from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { GeoJSON } from 'geojson';
import * as turf from '@turf/turf';
import { HttpClient } from '@angular/common/http';
import proj4 from "proj4";

// Sample fetch function for water data
import { getWaterData } from '../../../assets/fetch';
import { Observable, firstValueFrom } from 'rxjs';

interface FloodAlert {
  name: string;
  coords: [number, number]; // [lat, lng]
  level: string;
}

interface Measurement {
  year: number;
  value: number;
}

interface HistoricalData {
  [hzbnr: string]: {
    name: string;
    waterBody: string;
    catchmentArea: string;
    operatingAuthority: string;
    measurements: Measurement[];
  };
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: 'landing-page.component.html',
  styleUrls: ['landing-page.component.css']
})
export class LandingPageComponent implements OnInit, AfterViewInit {
  @ViewChild('mapSection') mapSection!: ElementRef;
  @ViewChild('welcomeSection') welcomeSection!: ElementRef;

  constructor(private http: HttpClient) {}

  private map!: L.Map;
  private waterLevelLayer!: L.GeoJSON<any>;
  private histWaterLevelLayer!: L.GeoJSON<any>;
  private floodAlertLayer!: L.LayerGroup<any>;
  private floodAlerts: FloodAlert[] = [];

  ngOnInit(): void {
    // Optional: any initialization logic
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.addLegends();
    this.addScaleControl();
    this.addMapClickListener();

    // Fetch data once
    this.fetchAndUpdateWaterData();

    // (Optional) Periodic refresh every 10 minutes
    this.setupPeriodicDataFetch();
  }

  // ----------------- KEYBOARD NAVIGATION -----------------
  /**
   * Listen for arrow key presses.
   * ArrowDown => scrollToWelcome()
   * ArrowUp   => scrollToMap()
   */
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      // If user presses down arrow, go to welcome section
      event.preventDefault();
      this.scrollToWelcome();
    } else if (event.key === 'ArrowUp') {
      // If user presses up arrow, go back to map section
      event.preventDefault();
      this.scrollToMap();
    }
  }

  // ----------------- ARROW CLICK HANDLERS -----------------
  /**
   * Scroll to the welcome section
   */
  scrollToWelcome(): void {
    this.welcomeSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Scroll back to the map section
   */
  scrollToMap(): void {
    this.mapSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  // ----------------- MAP INITIALIZATION -----------------
  private initMap(): void {
    const austriaBounds = L.latLngBounds(
      [46.372276, 9.530952],
      [49.017784, 17.160776]
    );

    this.map = L.map('landing-map', {
      center: [47.5162, 14.5501], // Center of Austria
      zoom: 7,
      minZoom: 6,
      maxZoom: 12,
      maxBounds: austriaBounds,
      maxBoundsViscosity: 0.7,
      zoomControl: false
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    });
    tiles.addTo(this.map);
  }

  private addScaleControl(): void {
    L.control.scale().addTo(this.map);
  }

  private addMapClickListener(): void {
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`Lat: ${e.latlng.lat.toFixed(5)}, Lng: ${e.latlng.lng.toFixed(5)}`)
        .openOn(this.map);
    });
  }

  // ----------------- LEGENDS -----------------
  private addLegends(): void {
    
    // Helper function to convert hex color to RGB
    const hexToRgb = (hex: string): { r: number, g: number, b: number } | null => {
      hex = hex.replace('#', '');
      if (hex.length !== 6) return null;
    
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
    
      return { r, g, b };
    }

    const getTextColorBasedOnBackground = (backgroundColor: string) => {
      const rgb = hexToRgb(backgroundColor);
      if (!rgb) return 'black';
      
      const brightness = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
      
      return brightness < 128 ? 'white' : 'black';
    }

    // 1) Water Level Legend
    class WaterLevelLegendControl extends L.Control {
      override onAdd(map: L.Map) {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.backgroundColor = 'white';
        div.style.padding = "6px 8px";
        div.style.font = "14px/16px Arial, Helvetica, sans-serif";
        div.style.borderRadius = "5px";
        div.style.boxShadow = "0 0 15px rgba(0, 0, 0, 0.2)";

        const grades = [0, 50, 300, 600, 900, 1200, 1500];
        div.innerHTML += '<strong>Water Level (m)</strong><br>';

        const getColor = (val: number) => {
          return val > 1500
            ? '#062C67'
            : val > 1200
            ? '#1B4F8A'
            : val > 900
            ? '#3473A6'
            : val > 600
            ? '#5A94C3'
            : val > 300
            ? '#86B4D4'
            : val > 50
            ? '#ABCDE5'
            : '#D3E7F8';
        };

        for (let i = 0; i < grades.length; i++) {
          let text_color = getTextColorBasedOnBackground(getColor(grades[i] + 1));
          div.innerHTML +=
            `<i style="display: inline-block; width:100%; padding: 2px; margin: 2px 0; color:${text_color}; background:${getColor(grades[i] + 1)}"> ${grades[i]}` +
            (grades[i + 1] ? `&ndash;${grades[i + 1]}</i><br>` : '+');
        }
        return div;
      }
    }

    // 2) Flood Alert Legend
    class FloodAlertLegendControl extends L.Control {
      override onAdd(map: L.Map) {
        const div = L.DomUtil.create('div', 'info legend flood-alert-legend');
        div.style.backgroundColor = 'white';
        div.style.padding = "6px 8px";
        div.style.font = "14px/16px Arial, Helvetica, sans-serif";
        div.style.borderRadius = "5px";
        div.style.boxShadow = "0 0 15px rgba(0, 0, 0, 0.2)";

        div.innerHTML = `<strong>Flood Alerts</strong><br>`;
        const alertLevels = ['High Alert','Medium Alert','Low Alert','Rising','Falling','Stale','No Data'];

        const getAlertColor = (level: string) => {
          switch (level) {
            case 'High Alert':    return '#FF0000';
            case 'Medium Alert':  return '#FFA500';
            case 'Low Alert':     return '#FFFF00';
            case 'Rising':  return '#FF6347';
            case 'Falling': return '#32CD32';
            case 'Stale':   return '#A9A9A9';
            case 'No Data': return '#808080';
            default:        return '#808080';
          }
        }

        for (const level of alertLevels) {
          const color = getAlertColor(level);
          let text_color = getTextColorBasedOnBackground(color);
          div.innerHTML += `<i style="display: inline-block; width:100%; padding: 2px; margin: 2px 0; color:${text_color}; background: ${color}">${level}</i><br>`;
        }

        return div;
      }
    }

    const waterLevelLegend = new WaterLevelLegendControl({ position: 'bottomright' });
    waterLevelLegend.addTo(this.map);

    const floodAlertLegend = new FloodAlertLegendControl({ position: 'bottomright' });
    // floodAlertLegend.addTo(this.map);


    this.map.on('baselayerchange', (event: L.LayersControlEvent) => {
      if (event.name === 'Water Levels') {
        waterLevelLegend.addTo(this.map);
        this.map.removeControl(floodAlertLegend);
      } else if (event.name === 'Flood Alerts') {
        floodAlertLegend.addTo(this.map);
        this.map.removeControl(waterLevelLegend);
      }
    });
  }

  // ----------------- DATA FETCHING -----------------
  private async fetchAndUpdateWaterData(): Promise<void> {
    try {
      const tempData = await this.loadWaterLevelData();
      const data = await this.fetchHistWaterData(tempData);
      // console.log(data);
      this.processWaterData(data);
    } catch (error) {
      console.error('Error fetching water level data:', error);
    }
  }

  private setupPeriodicDataFetch(): void {
    setInterval(async () => {
      try {
        const tempData = await this.loadWaterLevelData();
        const data = await this.fetchHistWaterData(tempData);
        this.processWaterData(data);
      } catch (error) {
        console.error('Error fetching water level data:', error);
      }
    }, 10 * 60 * 1000); // every 10 minutes
  }

  private loadWaterLevelData(): Promise<GeoJSON.FeatureCollection> {
    // Calls your fetch function. Adjust if needed.
    return getWaterData();
  }

  private async fetchHistWaterData(data: any): Promise<GeoJSON.FeatureCollection> {
    // Load the historical water data
    const monatsmaximaData = await firstValueFrom(this.http.get<HistoricalData>("../../../assets/monatsmaxima.json"));
    const monatsminimaData = await firstValueFrom(this.http.get<HistoricalData>("../../../assets/monatsminima.json"));
    const tagesmittelData = await firstValueFrom(this.http.get<HistoricalData>("../../../assets/tagesmittel.json"));

    // Process features
    data.features.forEach((feature: any) => {
      const hzbnr = feature.properties.hzbnr;

      if (hzbnr && monatsmaximaData[hzbnr]) {
        feature.properties.monatsmaxima = feature.properties.monatsmaxima || {};
        feature.properties.monatsmaxima.name = monatsmaximaData[hzbnr].name??NaN;
        feature.properties.monatsmaxima.waterBody = monatsmaximaData[hzbnr].waterBody??NaN;
        feature.properties.monatsmaxima.catchmentArea = monatsmaximaData[hzbnr].catchmentArea??NaN;
        feature.properties.monatsmaxima.operatingAuthority = monatsmaximaData[hzbnr].operatingAuthority??NaN;
        feature.properties.monatsmaxima.measurements = monatsmaximaData[hzbnr].measurements.reduce((acc: any, curr: Measurement) => {
          acc[curr.year] = curr.value;
          return acc;
        }, {});
      } else if (hzbnr) {
        feature.properties.monatsmaxima = [];
      }

      if (hzbnr && monatsminimaData[hzbnr]) {
        feature.properties.monatsminima = feature.properties.monatsminima || {};
        feature.properties.monatsminima.name = monatsminimaData[hzbnr].name;
        feature.properties.monatsminima.waterBody = monatsminimaData[hzbnr].waterBody;
        feature.properties.monatsminima.catchmentArea = monatsminimaData[hzbnr].catchmentArea;
        feature.properties.monatsminima.operatingAuthority = monatsminimaData[hzbnr].operatingAuthority;
        feature.properties.monatsminima.measurements = monatsminimaData[hzbnr].measurements.reduce((acc: any, curr: Measurement) => {
          acc[curr.year] = curr.value;
          return acc;
        }, {});
      } else if (hzbnr) {
        feature.properties.monatsminima = [];
      }

      if (hzbnr && tagesmittelData[hzbnr]) {
        feature.properties.tagesmittel = feature.properties.tagesmittel || {};
        feature.properties.tagesmittel.name = tagesmittelData[hzbnr].name;
        feature.properties.tagesmittel.waterBody = tagesmittelData[hzbnr].waterBody;
        feature.properties.tagesmittel.catchmentArea = tagesmittelData[hzbnr].catchmentArea;
        feature.properties.tagesmittel.operatingAuthority = tagesmittelData[hzbnr].operatingAuthority;
        feature.properties.tagesmittel.measurements = tagesmittelData[hzbnr].measurements.reduce((acc: any, curr: Measurement) => {
          acc[curr.year] = curr.value;
          return acc;
        }, {});
      } else if (hzbnr) {
        feature.properties.tagesmittel = [];
      }
    });
    return data;
  }

  private processWaterData(data: GeoJSON.FeatureCollection): void {
    // Remove existing layer if it exists
    if (this.waterLevelLayer) {
      this.map.removeLayer(this.waterLevelLayer);
    }

    // Create new water level layer
    this.waterLevelLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: 8,
          fillColor: this.getColor(feature.properties.waterLevel),
          color: '#000',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        });
      },
      onEachFeature: (feature: any, layer: L.Layer) => {
        if (feature.properties?.name) {
          const alert = this.createFloodAlertObject(feature);
          if (alert) this.floodAlerts.push(alert);

          layer.bindPopup(`
            <strong>${feature.properties.name}</strong><br>
            Water Level: ${feature.properties.waterLevel}m<br>
            Closest body of water: ${feature.properties.area}<br>
            Last available data: ${feature.properties.timeStamp}<br>
            More details <a href='${feature.properties.detailsLink}' target='_blank'>here</a><br>
            ${feature.properties.hzbnr ? `
            <a href="#" class="historical-data-link" 
                data-maxima='${JSON.stringify(feature.properties.monatsmaxima)}'
                data-minima='${JSON.stringify(feature.properties.monatsminima)}'
                data-mittel='${JSON.stringify(feature.properties.tagesmittel)}'>
              Click here to see the historical water data
            </a>` : ''}
          `);
        }
      }
    }).addTo(this.map);

    // Event delegation for historical data links
    document.body.addEventListener('click', (event) => {
      const link = event.target as HTMLAnchorElement;
      if (link && link.classList.contains('historical-data-link')) {
        event.preventDefault();  // Prevent the default action (link navigation)
        
        // Retrieve data from the clicked link's attributes
        const monatsmaxima = JSON.parse(link.getAttribute('data-maxima')!);
        const monatsminima = JSON.parse(link.getAttribute('data-minima')!);
        const tagesmittel = JSON.parse(link.getAttribute('data-mittel')!);
        
        // Call showHistoricalData with the data
        this.showHistoricalData(monatsmaxima, monatsminima, tagesmittel);
      }
    });

    this.updateFloodAlerts();

    this.addLayerControl();
  }

  showHistoricalData(monatsmaxima: any, monatsminima: any, tagesmittel: any): void {
    if (( 
      Array.isArray(monatsmaxima) && monatsmaxima.length === 0 &&
      Array.isArray(monatsminima) && monatsminima.length === 0 &&
      Array.isArray(tagesmittel) && tagesmittel.length === 0
    ) || (
      Array.isArray(monatsmaxima.measurements) && monatsmaxima.length === 0 &&
      Array.isArray(monatsminima.measurements) && monatsminima.length === 0 &&
      Array.isArray(tagesmittel.measurements) && tagesmittel.length === 0
    )) {
        const win = window.open("", "Historical Data", "width=800,height=600");
        if (win) {
            win.document.write(`
                <html>
                    <head>
                        <title>Historical Water Data</title>
                        <style>
                          body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            background-color: #f3f8fc;
                            margin: 20px;
                          }
                          h1, p {
                            color: #2c3e50;
                          }
                          p {
                            font-size: 16px;
                          }
                        </style>
                    </head>
                    <body>
                        <h1>Historical Water Data</h1>
                        <p>No data is available at this time.</p>
                    </body>
                </html>
            `);
            win.document.close();
        }
    } else {
        const win = window.open("", "Historical Data", "width=800,height=1000");
        if (win) {
            win.document.write(`
                <html>
                    <head>
                        <title>Historical Water Data</title>
                        <style>
                          body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            background-color: #f3f8fc;
                            margin: 20px;
                            color: #34495e;
                          }
                          h1 {
                            color: #2c3e50;
                            text-align: center;
                            margin-bottom: 20px;
                          }
                          .information-box {
                            background-color: #eaf4fc;
                            padding: 15px;
                            border-radius: 8px;
                            margin-bottom: 20px;
                            border: 1px solid #d0e6f8;
                          }
                          .information-box p {
                            margin: 5px 0;
                          }
                          table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                          }
                          table th, table td {
                            padding: 12px;
                            text-align: center;
                            border: 1px solid #dfe6ed;
                          }
                          table th {
                            background-color: #d6eaf8;
                            color: #2c3e50;
                            font-weight: bold;
                          }
                          table tr:nth-child(even) {
                            background-color: #f4faff;
                          }
                          table tr:hover {
                            background-color: #e8f5ff;
                          }
                        </style>
                    </head>
                    <body>
                        <h1>Historical Water Data for ${monatsmaxima.name}</h1>
                        <div class="information-box">
                            <p><strong>Body of Water:</strong> ${monatsmaxima.waterBody}</p>
                            <p><strong>Catchment Area:</strong> ${monatsmaxima.catchmentArea}</p>
                            <p><strong>Operating Authority:</strong> ${monatsmaxima.operatingAuthority}</p>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Year</th>
                                    <th>Monatsmaxima</th>
                                    <th>Monatsminima</th>
                                    <th>Tagesmittel</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.keys(monatsmaxima.measurements).map(year => `
                                    <tr>
                                        <td>${year}</td>
                                        <td>${monatsmaxima.measurements[year] ?? "N/A"}</td>
                                        <td>${monatsminima.measurements[year] ?? "N/A"}</td>
                                        <td>${tagesmittel.measurements[year] ?? "N/A"}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </body>
                </html>
            `);
            win.document.close();
        }
    }
  }




  // ----------------- FLOOD ALERTS -----------------
  private createFloodAlertObject(feature: any): FloodAlert | null {
    const riskCode = feature.properties.riskLevel?.toString();
    if (!riskCode || riskCode.length !== 3) return null;

    const waterLevelNum = parseInt(riskCode.charAt(0), 10);
    const trend = parseInt(riskCode.charAt(1), 10);
    const freshness = parseInt(riskCode.charAt(2), 10);

    let riskLevel = 'Normal';
    if (waterLevelNum === 1) riskLevel = 'Low';
    else if (waterLevelNum === 2 || waterLevelNum === 3) riskLevel = 'Medium';
    else if (waterLevelNum >= 4 && waterLevelNum <= 6) riskLevel = 'High';
    else if (waterLevelNum === 9) riskLevel = 'No Data';

    if (trend === 1) riskLevel = 'Rising';
    else if (trend === 2) riskLevel = 'Falling';

    if (freshness === 1) riskLevel = 'Stale';

    return {
      name: feature.properties.name,
      coords: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
      level: riskLevel
    };
  }

  private updateFloodAlerts(): void {
    if (this.floodAlertLayer) {
      this.map.removeLayer(this.floodAlertLayer);
    }
    this.floodAlertLayer = L.layerGroup();

    this.floodAlerts.forEach((alert) => {
      if (alert.coords[0] && alert.coords[1]) {
        const marker = L.circleMarker(alert.coords, {
          radius: 8,
          fillColor: this.getAlertColor(alert.level),
          color: '#000',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        });
        marker.bindPopup(`
          <strong>${alert.name}</strong><br>
          Risk Level: ${alert.level}
        `);
        this.floodAlertLayer.addLayer(marker);
      }
    });

    this.floodAlertLayer.addTo(this.map);
  }

  // ----------------- LAYER CONTROL -----------------
  private addLayerControl(): void {
    const waterLevelsGroup = L.layerGroup([this.waterLevelLayer]);
    const floodAlertsGroup = L.layerGroup([this.floodAlertLayer]);

    // Add the groups to the map as base layers
    const baseLayers = {
      'Water Levels': waterLevelsGroup,
      'Flood Alerts': floodAlertsGroup
    };

    // Start with a clean slate 🧹🧹
    Object.values([this.waterLevelLayer, this.floodAlertLayer]).forEach((layer) => {
      this.map.removeLayer(layer);
    });

    // Current water levels should be the first group displayed
    this.map.addLayer(waterLevelsGroup);

    // Creating layer control
    const layerControl = L.control.layers(baseLayers, {}).addTo(this.map);

    this.map.addControl(layerControl);
  }

  // ----------------- COLOR HELPERS -----------------
  private getColor(waterLevel: number): string {
    if (waterLevel > 1500) return '#062C67';
    if (waterLevel > 1200) return '#1B4F8A';
    if (waterLevel > 900)  return '#3473A6';
    if (waterLevel > 600)  return '#5A94C3';
    if (waterLevel > 300)  return '#86B4D4';
    if (waterLevel > 50)   return '#ABCDE5';
    return '#D3E7F8';
  }

  private getAlertColor(level: string): string {
    switch (level) {
      case 'High':    return '#FF0000';
      case 'Medium':  return '#FFA500';
      case 'Low':     return '#FFFF00';
      case 'Rising':  return '#FF6347';
      case 'Falling': return '#32CD32';
      case 'Stale':   return '#A9A9A9';
      case 'No Data': return '#808080';
      default:        return '#00FF00';
    }
  }
}
