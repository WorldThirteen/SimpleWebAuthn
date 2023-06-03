import type { AttestationConveyancePreference, AuthenticationExtensionsClientInputs, AuthenticatorSelectionCriteria, COSEAlgorithmIdentifier, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialDescriptorFuture } from '@simplewebauthn/typescript-types';
export type GenerateRegistrationOptionsOpts = {
    rpName: string;
    rpID: string;
    userID: string;
    userName: string;
    challenge?: string | Uint8Array;
    userDisplayName?: string;
    timeout?: number;
    attestationType?: AttestationConveyancePreference;
    excludeCredentials?: PublicKeyCredentialDescriptorFuture[];
    authenticatorSelection?: AuthenticatorSelectionCriteria;
    extensions?: AuthenticationExtensionsClientInputs;
    supportedAlgorithmIDs?: COSEAlgorithmIdentifier[];
};
/**
 * Supported crypto algo identifiers
 * See https://w3c.github.io/webauthn/#sctn-alg-identifier
 * and https://www.iana.org/assignments/cose/cose.xhtml#algorithms
 */
export declare const supportedCOSEAlgorithmIdentifiers: COSEAlgorithmIdentifier[];
/**
 * Prepare a value to pass into navigator.credentials.create(...) for authenticator "registration"
 *
 * **Options:**
 *
 * @param rpName User-visible, "friendly" website/service name
 * @param rpID Valid domain name (after `https://`)
 * @param userID User's website-specific unique ID
 * @param userName User's website-specific username (email, etc...)
 * @param challenge Random value the authenticator needs to sign and pass back
 * @param userDisplayName User's actual name
 * @param timeout How long (in ms) the user can take to complete attestation
 * @param attestationType Specific attestation statement
 * @param excludeCredentials Authenticators registered by the user so the user can't register the
 * same credential multiple times
 * @param authenticatorSelection Advanced criteria for restricting the types of authenticators that
 * may be used
 * @param extensions Additional plugins the authenticator or browser should use during attestation
 * @param supportedAlgorithmIDs Array of numeric COSE algorithm identifiers supported for
 * attestation by this RP. See https://www.iana.org/assignments/cose/cose.xhtml#algorithms
 */
export declare function generateRegistrationOptions(options: GenerateRegistrationOptionsOpts): PublicKeyCredentialCreationOptionsJSON;
