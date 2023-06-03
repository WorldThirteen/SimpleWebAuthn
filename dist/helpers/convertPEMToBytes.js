"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertPEMToBytes = void 0;
const iso_1 = require("./iso");
/**
 * Take a certificate in PEM format and convert it to bytes
 */
function convertPEMToBytes(pem) {
    const certBase64 = pem
        .replace('-----BEGIN CERTIFICATE-----', '')
        .replace('-----END CERTIFICATE-----', '')
        .replace(/\n| /g, '');
    return iso_1.isoBase64URL.toBuffer(certBase64, 'base64');
}
exports.convertPEMToBytes = convertPEMToBytes;
//# sourceMappingURL=convertPEMToBytes.js.map