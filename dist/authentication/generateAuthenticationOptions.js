"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAuthenticationOptions = void 0;
const iso_1 = require("../helpers/iso");
const generateChallenge_1 = require("../helpers/generateChallenge");
/**
 * Prepare a value to pass into navigator.credentials.get(...) for authenticator "login"
 *
 * @param allowCredentials Authenticators previously registered by the user, if any. If undefined
 * the client will ask the user which credential they want to use
 * @param challenge Random value the authenticator needs to sign and pass back
 * user for authentication
 * @param timeout How long (in ms) the user can take to complete authentication
 * @param userVerification Set to `'discouraged'` when asserting as part of a 2FA flow, otherwise
 * set to `'preferred'` or `'required'` as desired.
 * @param extensions Additional plugins the authenticator or browser should use during authentication
 * @param rpID Valid domain name (after `https://`)
 */
function generateAuthenticationOptions(options = {}) {
    const { allowCredentials, challenge = (0, generateChallenge_1.generateChallenge)(), timeout = 60000, userVerification = 'preferred', extensions, rpID, } = options;
    /**
     * Preserve ability to specify `string` values for challenges
     */
    let _challenge = challenge;
    if (typeof _challenge === 'string') {
        _challenge = iso_1.isoUint8Array.fromUTF8String(_challenge);
    }
    return {
        challenge: iso_1.isoBase64URL.fromBuffer(_challenge),
        allowCredentials: allowCredentials === null || allowCredentials === void 0 ? void 0 : allowCredentials.map(cred => ({
            ...cred,
            id: iso_1.isoBase64URL.fromBuffer(cred.id),
        })),
        timeout,
        userVerification,
        extensions,
        rpId: rpID,
    };
}
exports.generateAuthenticationOptions = generateAuthenticationOptions;
//# sourceMappingURL=generateAuthenticationOptions.js.map