import { AuthenticationResponseJSON, AuthenticatorDevice, CredentialDeviceType, UserVerificationRequirement } from '@simplewebauthn/typescript-types';
import { AuthenticationExtensionsAuthenticatorOutputs } from '../helpers/decodeAuthenticatorExtensions';
export type VerifyAuthenticationResponseOpts = {
    response: AuthenticationResponseJSON;
    expectedChallenge: string | ((challenge: string) => boolean);
    expectedOrigin: string | string[];
    expectedRPID: string | string[];
    authenticator: AuthenticatorDevice;
    requireUserVerification?: boolean;
    advancedFIDOConfig?: {
        userVerification?: UserVerificationRequirement;
    };
};
/**
 * Verify that the user has legitimately completed the login process
 *
 * **Options:**
 *
 * @param response Response returned by **@simplewebauthn/browser**'s `startAssertion()`
 * @param expectedChallenge The base64url-encoded `options.challenge` returned by
 * `generateAuthenticationOptions()`
 * @param expectedOrigin Website URL (or array of URLs) that the registration should have occurred on
 * @param expectedRPID RP ID (or array of IDs) that was specified in the registration options
 * @param authenticator An internal {@link AuthenticatorDevice} matching the credential's ID
 * @param requireUserVerification (Optional) Enforce user verification by the authenticator
 * (via PIN, fingerprint, etc...)
 * @param advancedFIDOConfig (Optional) Options for satisfying more stringent FIDO RP feature
 * requirements
 * @param advancedFIDOConfig.userVerification (Optional) Enable alternative rules for evaluating the
 * User Presence and User Verified flags in authenticator data: UV (and UP) flags are optional
 * unless this value is `"required"`
 */
export declare function verifyAuthenticationResponse(options: VerifyAuthenticationResponseOpts): Promise<VerifiedAuthenticationResponse>;
/**
 * Result of authentication verification
 *
 * @param verified If the authentication response could be verified
 * @param authenticationInfo.credentialID The ID of the authenticator used during authentication.
 * Should be used to identify which DB authenticator entry needs its `counter` updated to the value
 * below
 * @param authenticationInfo.newCounter The number of times the authenticator identified above
 * reported it has been used. **Should be kept in a DB for later reference to help prevent replay
 * attacks!**
 * @param authenticationInfo.credentialDeviceType Whether this is a single-device or multi-device
 * credential. **Should be kept in a DB for later reference!**
 * @param authenticationInfo.credentialBackedUp Whether or not the multi-device credential has been
 * backed up. Always `false` for single-device credentials. **Should be kept in a DB for later
 * reference!**
 * @param authenticationInfo?.authenticatorExtensionResults The authenticator extensions returned
 * by the browser
 */
export type VerifiedAuthenticationResponse = {
    verified: boolean;
    authenticationInfo: {
        credentialID: Uint8Array;
        newCounter: number;
        userVerified: boolean;
        credentialDeviceType: CredentialDeviceType;
        credentialBackedUp: boolean;
        authenticatorExtensionResults?: AuthenticationExtensionsAuthenticatorOutputs;
    };
};
