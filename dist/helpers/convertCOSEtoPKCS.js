"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertCOSEtoPKCS = void 0;
const iso_1 = require("./iso");
const cose_1 = require("./cose");
/**
 * Takes COSE-encoded public key and converts it to PKCS key
 */
function convertCOSEtoPKCS(cosePublicKey) {
    // This is a little sloppy, I'm using COSEPublicKeyEC2 since it could have both x and y, but when
    // there's no y it means it's probably better typed as COSEPublicKeyOKP. I'll leave this for now
    // and revisit it later if it ever becomes an actual problem.
    const struct = iso_1.isoCBOR.decodeFirst(cosePublicKey);
    const tag = Uint8Array.from([0x04]);
    const x = struct.get(cose_1.COSEKEYS.x);
    const y = struct.get(cose_1.COSEKEYS.y);
    if (!x) {
        throw new Error('COSE public key was missing x');
    }
    if (y) {
        return iso_1.isoUint8Array.concat([tag, x, y]);
    }
    return iso_1.isoUint8Array.concat([tag, x]);
}
exports.convertCOSEtoPKCS = convertCOSEtoPKCS;
//# sourceMappingURL=convertCOSEtoPKCS.js.map