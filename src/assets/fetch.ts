interface FeatureProperties {
    messstelle: string;
    hzbnr: number;
    gewaesser: string;
    wert: string;
    zeitpunkt: string;
    gesamtcode: number;
    internet: string;
    lon: string;
    lat: string;
}

interface Feature {
    properties: FeatureProperties;
}

interface WaterLevelsJSON {
    features: Feature[];
}

interface GeoJSONFeature {
    type: "Feature";
    properties: {
        name: string;
        waterLevel: number;
        hzbnr: number;
        area: string;
        timeStamp: string;
        riskLevel: number;
        detailsLink: string;
    };
    geometry: {
        type: "Point";
        coordinates: [number, number]; // [longitude, latitude]
    };
}

interface GeoJSON {
    type: "FeatureCollection";
    features: GeoJSONFeature[];
}

async function loadWaterData(): Promise<GeoJSON> {
    const API_URL = 'https://gis.lfrz.gv.at/wmsgw/?key=a64a0c9c9a692ed7041482cb6f03a40a&request=GetFeature&service=WFS&version=2.0.0&outputFormat=json&typeNames=inspire:pegelaktuell';

    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`);
    }

    const waterLevelsJSON: WaterLevelsJSON = await response.json();

    const features = waterLevelsJSON.features;
    const geoJSON: GeoJSON = {
        type: "FeatureCollection",
        features: features
            .filter(feature => {
                // Ensure water level, latitude, and longitude are not null
                const lon = feature.properties.lon?.replace(',', '.');
                const lat = feature.properties.lat?.replace(',', '.');
                return (
                    feature.properties.wert !== null && // Non-null water level
                    lon !== null && lat !== null &&    // Non-null lon/lat
                    !isNaN(parseFloat(lon)) &&         // Valid number for lon
                    !isNaN(parseFloat(lat))            // Valid number for lat
                );
            })
            .map(feature => ({
                type: "Feature",
                properties: {
                    name: feature.properties.messstelle,         // Nearest Area/City
                    waterLevel: parseFloat(feature.properties.wert), // Water level as float
                    hzbnr: feature.properties.hzbnr,
                    area: feature.properties.gewaesser,          // Nearest body of water
                    timeStamp: feature.properties.zeitpunkt,     // Time when the data was collected
                    riskLevel: feature.properties.gesamtcode,    // Risk level as an integer
                    detailsLink: feature.properties.internet     // A link for more details
                },
                geometry: {
                    type: "Point",
                    coordinates: [
                        parseFloat(feature.properties.lon.replace(',', '.')), // Longitude as float
                        parseFloat(feature.properties.lat.replace(',', '.'))  // Latitude as float
                    ]
                }
            }))
    };

    return geoJSON;
}


export async function getWaterData(): Promise<GeoJSON.FeatureCollection> {
    try {
        // Load the water data as a GeoJSON object
        const waterData = await loadWaterData();

        // Return the stringified JSON
        return waterData;
    } catch (error) {
        console.error("Error loading water data:", error);
        throw error; // Rethrow the error so it can be handled by the caller
    }
}
