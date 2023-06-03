"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAttestationFIDOU2F = void 0;
const convertCOSEtoPKCS_1 = require("../../helpers/convertCOSEtoPKCS");
const convertCertBufferToPEM_1 = require("../../helpers/convertCertBufferToPEM");
const validateCertificatePath_1 = require("../../helpers/validateCertificatePath");
const verifySignature_1 = require("../../helpers/verifySignature");
const iso_1 = require("../../helpers/iso");
const cose_1 = require("../../helpers/cose");
/**
 * Verify an attestation response with fmt 'fido-u2f'
 */
async function verifyAttestationFIDOU2F(options) {
    const { attStmt, clientDataHash, rpIdHash, credentialID, credentialPublicKey, aaguid, rootCertificates, } = options;
    const reservedByte = Uint8Array.from([0x00]);
    const publicKey = (0, convertCOSEtoPKCS_1.convertCOSEtoPKCS)(credentialPublicKey);
    const signatureBase = iso_1.isoUint8Array.concat([
        reservedByte,
        rpIdHash,
        clientDataHash,
        credentialID,
        publicKey,
    ]);
    const sig = attStmt.get('sig');
    const x5c = attStmt.get('x5c');
    if (!x5c) {
        throw new Error('No attestation certificate provided in attestation statement (FIDOU2F)');
    }
    if (!sig) {
        throw new Error('No attestation signature provided in attestation statement (FIDOU2F)');
    }
    // FIDO spec says that aaguid _must_ equal 0x00 here to be legit
    const aaguidToHex = Number.parseInt(iso_1.isoUint8Array.toHex(aaguid), 16);
    if (aaguidToHex !== 0x00) {
        throw new Error(`AAGUID "${aaguidToHex}" was not expected value`);
    }
    try {
        // Try validating the certificate path using the root certificates set via SettingsService
        await (0, validateCertificatePath_1.validateCertificatePath)(x5c.map(convertCertBufferToPEM_1.convertCertBufferToPEM), rootCertificates);
    }
    catch (err) {
        const _err = err;
        throw new Error(`${_err.message} (FIDOU2F)`);
    }
    return (0, verifySignature_1.verifySignature)({
        signature: sig,
        data: signatureBase,
        x509Certificate: x5c[0],
        hashAlgorithm: cose_1.COSEALG.ES256,
    });
}
exports.verifyAttestationFIDOU2F = verifyAttestationFIDOU2F;
//# sourceMappingURL=verifyAttestationFIDOU2F.js.map