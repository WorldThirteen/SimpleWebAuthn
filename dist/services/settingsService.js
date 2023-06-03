"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const convertCertBufferToPEM_1 = require("../helpers/convertCertBufferToPEM");
const android_safetynet_1 = require("./defaultRootCerts/android-safetynet");
const android_key_1 = require("./defaultRootCerts/android-key");
const apple_1 = require("./defaultRootCerts/apple");
const mds_1 = require("./defaultRootCerts/mds");
class BaseSettingsService {
    constructor() {
        this.pemCertificates = new Map();
    }
    /**
     * Set potential root certificates for attestation formats that use them. Root certs will be tried
     * one-by-one when validating a certificate path.
     *
     * Certificates can be specified as a raw `Buffer`, or as a PEM-formatted string. If a
     * `Buffer` is passed in it will be converted to PEM format.
     */
    setRootCertificates(opts) {
        const { identifier, certificates } = opts;
        const newCertificates = [];
        for (const cert of certificates) {
            if (cert instanceof Uint8Array) {
                newCertificates.push((0, convertCertBufferToPEM_1.convertCertBufferToPEM)(cert));
            }
            else {
                newCertificates.push(cert);
            }
        }
        this.pemCertificates.set(identifier, newCertificates);
    }
    /**
     * Get any registered root certificates for the specified attestation format
     */
    getRootCertificates(opts) {
        var _a;
        const { identifier } = opts;
        return (_a = this.pemCertificates.get(identifier)) !== null && _a !== void 0 ? _a : [];
    }
}
exports.SettingsService = new BaseSettingsService();
// Initialize default certificates
exports.SettingsService.setRootCertificates({
    identifier: 'android-key',
    certificates: [android_key_1.Google_Hardware_Attestation_Root_1, android_key_1.Google_Hardware_Attestation_Root_2],
});
exports.SettingsService.setRootCertificates({
    identifier: 'android-safetynet',
    certificates: [android_safetynet_1.GlobalSign_Root_CA],
});
exports.SettingsService.setRootCertificates({
    identifier: 'apple',
    certificates: [apple_1.Apple_WebAuthn_Root_CA],
});
exports.SettingsService.setRootCertificates({
    identifier: 'mds',
    certificates: [mds_1.GlobalSign_Root_CA_R3],
});
//# sourceMappingURL=settingsService.js.map