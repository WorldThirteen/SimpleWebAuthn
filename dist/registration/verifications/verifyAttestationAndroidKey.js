"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAttestationAndroidKey = void 0;
const asn1_schema_1 = require("@peculiar/asn1-schema");
const asn1_x509_1 = require("@peculiar/asn1-x509");
const asn1_android_1 = require("@peculiar/asn1-android");
const convertCertBufferToPEM_1 = require("../../helpers/convertCertBufferToPEM");
const validateCertificatePath_1 = require("../../helpers/validateCertificatePath");
const verifySignature_1 = require("../../helpers/verifySignature");
const convertCOSEtoPKCS_1 = require("../../helpers/convertCOSEtoPKCS");
const cose_1 = require("../../helpers/cose");
const iso_1 = require("../../helpers/iso");
const metadataService_1 = require("../../services/metadataService");
const verifyAttestationWithMetadata_1 = require("../../metadata/verifyAttestationWithMetadata");
/**
 * Verify an attestation response with fmt 'android-key'
 */
async function verifyAttestationAndroidKey(options) {
    var _a;
    const { authData, clientDataHash, attStmt, credentialPublicKey, aaguid, rootCertificates } = options;
    const x5c = attStmt.get('x5c');
    const sig = attStmt.get('sig');
    const alg = attStmt.get('alg');
    if (!x5c) {
        throw new Error('No attestation certificate provided in attestation statement (AndroidKey)');
    }
    if (!sig) {
        throw new Error('No attestation signature provided in attestation statement (AndroidKey)');
    }
    if (!alg) {
        throw new Error(`Attestation statement did not contain alg (AndroidKey)`);
    }
    if (!(0, cose_1.isCOSEAlg)(alg)) {
        throw new Error(`Attestation statement contained invalid alg ${alg} (AndroidKey)`);
    }
    // Check that credentialPublicKey matches the public key in the attestation certificate
    // Find the public cert in the certificate as PKCS
    const parsedCert = asn1_schema_1.AsnParser.parse(x5c[0], asn1_x509_1.Certificate);
    const parsedCertPubKey = new Uint8Array(parsedCert.tbsCertificate.subjectPublicKeyInfo.subjectPublicKey);
    // Convert the credentialPublicKey to PKCS
    const credPubKeyPKCS = (0, convertCOSEtoPKCS_1.convertCOSEtoPKCS)(credentialPublicKey);
    if (!iso_1.isoUint8Array.areEqual(credPubKeyPKCS, parsedCertPubKey)) {
        throw new Error('Credential public key does not equal leaf cert public key (AndroidKey)');
    }
    // Find Android KeyStore Extension in certificate extensions
    const extKeyStore = (_a = parsedCert.tbsCertificate.extensions) === null || _a === void 0 ? void 0 : _a.find(ext => ext.extnID === asn1_android_1.id_ce_keyDescription);
    if (!extKeyStore) {
        throw new Error('Certificate did not contain extKeyStore (AndroidKey)');
    }
    const parsedExtKeyStore = asn1_schema_1.AsnParser.parse(extKeyStore.extnValue, asn1_android_1.KeyDescription);
    // Verify extKeyStore values
    const { attestationChallenge, teeEnforced, softwareEnforced } = parsedExtKeyStore;
    if (!iso_1.isoUint8Array.areEqual(new Uint8Array(attestationChallenge.buffer), clientDataHash)) {
        throw new Error('Attestation challenge was not equal to client data hash (AndroidKey)');
    }
    // Ensure that the key is strictly bound to the caller app identifier (shouldn't contain the
    // [600] tag)
    if (teeEnforced.allApplications !== undefined) {
        throw new Error('teeEnforced contained "allApplications [600]" tag (AndroidKey)');
    }
    if (softwareEnforced.allApplications !== undefined) {
        throw new Error('teeEnforced contained "allApplications [600]" tag (AndroidKey)');
    }
    const statement = await metadataService_1.MetadataService.getStatement(aaguid);
    if (statement) {
        try {
            await (0, verifyAttestationWithMetadata_1.verifyAttestationWithMetadata)({
                statement,
                credentialPublicKey,
                x5c,
                attestationStatementAlg: alg,
            });
        }
        catch (err) {
            const _err = err;
            throw new Error(`${_err.message} (AndroidKey)`);
        }
    }
    else {
        try {
            // Try validating the certificate path using the root certificates set via SettingsService
            await (0, validateCertificatePath_1.validateCertificatePath)(x5c.map(convertCertBufferToPEM_1.convertCertBufferToPEM), rootCertificates);
        }
        catch (err) {
            const _err = err;
            throw new Error(`${_err.message} (AndroidKey)`);
        }
    }
    const signatureBase = iso_1.isoUint8Array.concat([authData, clientDataHash]);
    return (0, verifySignature_1.verifySignature)({
        signature: sig,
        data: signatureBase,
        x509Certificate: x5c[0],
        hashAlgorithm: alg,
    });
}
exports.verifyAttestationAndroidKey = verifyAttestationAndroidKey;
//# sourceMappingURL=verifyAttestationAndroidKey.js.map