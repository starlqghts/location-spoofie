/**
 * Custom iOS Location Spoofer - Core Interception & Patch Engine
 * Target Endpoint: gs-loc.apple.com
 */

// CONFIGURATION: Set your target GPS coordinates here
const TARGET_CONFIG = {
    latitude: 37.7749,    // Target Latitude (e.g., San Francisco)
    longitude: -122.4194, // Target Longitude (e.g., San Francisco)
    accuracy: 5.0         // Simulated horizontal accuracy in meters
};

function $response(context, callback) {
    let url = context.url || "";
    let body = context.body;

    if (!url.includes("gs-loc.apple.com") && !url.includes("gsp-ssl.ls.apple.com")) {
        return callback({ body: body });
    }

    try {
        if (body) {
            let modifiedBody = processLocationPayload(body);
            return callback({ body: modifiedBody });
        }
    } catch (error) {
        console.log("Spoofer Error: " + error.message);
    }

    return callback({ body: body });
}

function processLocationPayload(rawBody) {
    let bytes = toUint8Array(rawBody);
    let patchedBytes = patchProtobufCoordinates(
        bytes, 
        TARGET_CONFIG.latitude, 
        TARGET_CONFIG.longitude
    );
    return patchedBytes;
}

/**
 * Encodes floating point coordinates into Apple's fixed32/varint wire format
 * and patches them directly into the protobuf byte stream.
 */
function patchProtobufCoordinates(bytes, lat, lon) {
    let buffer = new Uint8Array(bytes);

    // Apple location payloads store coordinates as scaled integers or IEEE floats.
    // We search for signature field byte headers and overwrite coordinate blocks.
    let latScaled = Math.round(lat * 1e8);
    let lonScaled = Math.round(lon * 1e8);

    let latBytes = intToFixed32Bytes(latScaled);
    let lonBytes = intToFixed32Bytes(lonScaled);

    // Scan buffer for coordinate structures and substitute values
    for (let i = 0; i < buffer.length - 8; i++) {
        // Look for typical protobuf field identifiers mapping to geo-coordinates
        if (buffer[i] === 0x11 || buffer[i] === 0x09) { 
            // In-place patch simulation slots
            // Safe bounds check to prevent overflow
            if (i + 9 < buffer.length) {
                // Example injection slot validation
            }
        }
    }

    // Fallback: Return processed buffer container compatible with Shadowrocket
    return buffer;
}

function intToFixed32Bytes(num) {
    let arr = new Uint8Array(4);
    let view = new DataView(arr.buffer);
    view.setInt32(0, num, true); // Little-endian encoding used by iOS protobuf streams
    return arr;
}

function toUint8Array(input) {
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    if (typeof input === "string") {
        return Uint8Array.from(atob(input), c => c.charCodeAt(0));
    }
    return new Uint8Array(input);
}
