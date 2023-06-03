"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAuthenticatorData = void 0;
const decodeAuthenticatorExtensions_1 = require("./decodeAuthenticatorExtensions");
const iso_1 = require("./iso");
/**
 * Make sense of the authData buffer contained in an Attestation
 */
function parseAuthenticatorData(authData) {
    if (authData.byteLength < 37) {
        throw new Error(`Authenticator data was ${authData.byteLength} bytes, expected at least 37 bytes`);
    }
    let pointer = 0;
    const dataView = iso_1.isoUint8Array.toDataView(authData);
    const rpIdHash = authData.slice(pointer, (pointer += 32));
    const flagsBuf = authData.slice(pointer, (pointer += 1));
    const flagsInt = flagsBuf[0];
    // Bit positions can be referenced here:
    // https://www.w3.org/TR/webauthn-2/#flags
    const flags = {
        up: !!(flagsInt & (1 << 0)),
        uv: !!(flagsInt & (1 << 2)),
        be: !!(flagsInt & (1 << 3)),
        bs: !!(flagsInt & (1 << 4)),
        at: !!(flagsInt & (1 << 6)),
        ed: !!(flagsInt & (1 << 7)),
        flagsInt,
    };
    const counterBuf = authData.slice(pointer, pointer + 4);
    const counter = dataView.getUint32(pointer, false);
    pointer += 4;
    let aaguid = undefined;
    let credentialID = undefined;
    let credentialPublicKey = undefined;
    if (flags.at) {
        aaguid = authData.slice(pointer, (pointer += 16));
        const credIDLen = dataView.getUint16(pointer);
        pointer += 2;
        credentialID = authData.slice(pointer, (pointer += credIDLen));
        // Decode the next CBOR item in the buffer, then re-encode it back to a Buffer
        const firstDecoded = iso_1.isoCBOR.decodeFirst(authData.slice(pointer));
        const firstEncoded = Uint8Array.from(iso_1.isoCBOR.encode(firstDecoded));
        credentialPublicKey = firstEncoded;
        pointer += firstEncoded.byteLength;
    }
    let extensionsData = undefined;
    let extensionsDataBuffer = undefined;
    if (flags.ed) {
        const firstDecoded = iso_1.isoCBOR.decodeFirst(authData.slice(pointer));
        extensionsDataBuffer = Uint8Array.from(iso_1.isoCBOR.encode(firstDecoded));
        extensionsData = (0, decodeAuthenticatorExtensions_1.decodeAuthenticatorExtensions)(extensionsDataBuffer);
        pointer += extensionsDataBuffer.byteLength;
    }
    // Pointer should be at the end of the authenticator data, otherwise too much data was sent
    if (authData.byteLength > pointer) {
        throw new Error('Leftover bytes detected while parsing authenticator data');
    }
    return {
        rpIdHash,
        flagsBuf,
        flags,
        counter,
        counterBuf,
        aaguid,
        credentialID,
        credentialPublicKey,
        extensionsData,
        extensionsDataBuffer,
    };
}
exports.parseAuthenticatorData = parseAuthenticatorData;
//# sourceMappingURL=parseAuthenticatorData.js.map