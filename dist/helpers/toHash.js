"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHash = void 0;
const iso_1 = require("./iso");
/**
 * Returns hash digest of the given data, using the given algorithm when provided. Defaults to using
 * SHA-256.
 */
async function toHash(data, algorithm = -7) {
    if (typeof data === 'string') {
        data = iso_1.isoUint8Array.fromUTF8String(data);
    }
    const digest = iso_1.isoCrypto.digest(data, algorithm);
    return digest;
}
exports.toHash = toHash;
//# sourceMappingURL=toHash.js.map