"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = void 0;
const convertX509PublicKeyToCOSE_1 = require("../helpers/convertX509PublicKeyToCOSE");
const iso_1 = require("../helpers/iso");
const cose_1 = require("../helpers/cose");
const verifyEC2_1 = require("../helpers/iso/isoCrypto/verifyEC2");
const verifyRSA_1 = require("../helpers/iso/isoCrypto/verifyRSA");
/**
 * Lightweight verification for FIDO MDS JWTs.
 *
 * Currently assumes `"alg": "ES256"` in the JWT header, it's what FIDO MDS uses. If this ever
 * needs to support more JWS algorithms, here's the list of them:
 *
 * https://www.rfc-editor.org/rfc/rfc7518.html#section-3.1
 *
 * (Pulled from https://www.rfc-editor.org/rfc/rfc7515#section-4.1.1)
 */
async function verifyJWT(jwt, leafCert) {
    const [header, payload, signature] = jwt.split('.');
    const certCOSE = (0, convertX509PublicKeyToCOSE_1.convertX509PublicKeyToCOSE)(leafCert);
    if ((0, cose_1.isCOSEPublicKeyEC2)(certCOSE)) {
        return (0, verifyEC2_1.verifyEC2)({
            data: iso_1.isoUint8Array.fromUTF8String(`${header}.${payload}`),
            signature: iso_1.isoBase64URL.toBuffer(signature),
            cosePublicKey: certCOSE,
            shaHashOverride: cose_1.COSEALG.ES256,
        });
    }
    if ((0, cose_1.isCOSEPublicKeyRSA)(certCOSE)) {
        return (0, verifyRSA_1.verifyRSA)({
            data: iso_1.isoUint8Array.fromUTF8String(`${header}.${payload}`),
            signature: iso_1.isoBase64URL.toBuffer(signature),
            cosePublicKey: certCOSE,
        });
    }
    const kty = certCOSE.get(cose_1.COSEKEYS.kty);
    throw new Error(`JWT verification with public key of kty ${kty} is not supported by this method`);
}
exports.verifyJWT = verifyJWT;
//# sourceMappingURL=verifyJWT.js.map