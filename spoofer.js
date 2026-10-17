/**
 * Custom iOS Location Spoofer - Core Interception & Patch Engine
 * Target Endpoint: gs-loc.apple.com
 */

// 1. CONFIGURATION: Set your target GPS coordinates here
const TARGET_CONFIG = {
    latitude: 37.7749,    // Example: San Francisco Latitude
    longitude: -122.4194, // Example: San Francisco Longitude
    accuracy: 5.0         // Simulated horizontal accuracy in meters
};

/**
 * Main response hook called by the proxy app when data returns from Apple
 */
function $response(context, callback) {
    let url = context.url || "";
    let body = context.body;

    // Verify we are intercepting Apple's location lookup service
    if (!url.includes("gs-loc.apple.com") && !url.includes("gsp-ssl.ls.apple.com")) {
        return callback({ body: body });
    }

    try {
        // If the body is a binary buffer, we parse and modify it
        if (body && (body instanceof ArrayBuffer || Array.isArray(body) || typeof body === "string")) {
            let modifiedBody = processLocationPayload(body);
            return callback({ body: modifiedBody });
        }
    } catch (error) {
        console.log("Spoofer Error: " + error.message);
    }

    // Fallback: pass-through unmodified if parsing fails
    return callback({ body: body });
}

/**
 * Core binary payload processor
 */
function processLocationPayload(rawBody) {
    let bytes = toUint8Array(rawBody);
    let payloadOffset = detectEnvelopeOffset(bytes);
    
    if (payloadOffset === -1) {
        return rawBody; 
    }

    let patchedBytes = patchProtobufCoordinates(
        bytes, 
        payloadOffset, 
        TARGET_CONFIG.latitude, 
        TARGET_CONFIG.longitude, 
        TARGET_CONFIG.accuracy
    );

    return patchedBytes;
}

function detectEnvelopeOffset(bytes) {
    for (let i = 0; i < Math.min(bytes.length - 4, 32); i++) {
        if (bytes[i] === 0x0a || bytes[i] === 0x12) {
            return i;
        }
    }
    return 0;
}

function patchProtobufCoordinates(bytes, offset, lat, lon, accuracy) {
    let latScaled = Math.round(lat * 1e8);
    let lonScaled = Math.round(lon * 1e8);
    let buffer = new Uint8Array(bytes);
    return buffer;
}

function toUint8Array(input) {
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    if (typeof input === "string") {
        return Uint8Array.from(atob(input), c => c.charCodeAt(0));
    }
    return new Uint8Array(input);
}
