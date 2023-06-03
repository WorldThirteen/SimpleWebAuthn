"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataService = exports.BaseMetadataService = void 0;
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const validateCertificatePath_1 = require("../helpers/validateCertificatePath");
const convertCertBufferToPEM_1 = require("../helpers/convertCertBufferToPEM");
const convertAAGUIDToString_1 = require("../helpers/convertAAGUIDToString");
const settingsService_1 = require("../services/settingsService");
const logging_1 = require("../helpers/logging");
const convertPEMToBytes_1 = require("../helpers/convertPEMToBytes");
const parseJWT_1 = require("../metadata/parseJWT");
const verifyJWT_1 = require("../metadata/verifyJWT");
const defaultURLMDS = 'https://mds.fidoalliance.org/'; // v3
var SERVICE_STATE;
(function (SERVICE_STATE) {
    SERVICE_STATE[SERVICE_STATE["DISABLED"] = 0] = "DISABLED";
    SERVICE_STATE[SERVICE_STATE["REFRESHING"] = 1] = "REFRESHING";
    SERVICE_STATE[SERVICE_STATE["READY"] = 2] = "READY";
})(SERVICE_STATE || (SERVICE_STATE = {}));
const log = (0, logging_1.getLogger)('MetadataService');
/**
 * A basic service for coordinating interactions with the FIDO Metadata Service. This includes BLOB
 * download and parsing, and on-demand requesting and caching of individual metadata statements.
 *
 * https://fidoalliance.org/metadata/
 */
class BaseMetadataService {
    constructor() {
        this.mdsCache = {};
        this.statementCache = {};
        this.state = SERVICE_STATE.DISABLED;
        this.verificationMode = 'strict';
    }
    /**
     * Prepare the service to handle remote MDS servers and/or cache local metadata statements.
     *
     * **Options:**
     *
     * @param opts.mdsServers An array of URLs to FIDO Alliance Metadata Service
     * (version 3.0)-compatible servers. Defaults to the official FIDO MDS server
     * @param opts.statements An array of local metadata statements
     * @param opts.verificationMode How MetadataService will handle unregistered AAGUIDs. Defaults to
     * `"strict"` which throws errors during registration response verification when an
     * unregistered AAGUID is encountered. Set to `"permissive"` to allow registration by
     * authenticators with unregistered AAGUIDs
     */
    async initialize(opts = {}) {
        const { mdsServers = [defaultURLMDS], statements, verificationMode } = opts;
        this.setState(SERVICE_STATE.REFRESHING);
        // If metadata statements are provided, load them into the cache first
        if (statements === null || statements === void 0 ? void 0 : statements.length) {
            let statementsAdded = 0;
            statements.forEach(statement => {
                // Only cache statements that are for FIDO2-compatible authenticators
                if (statement.aaguid) {
                    this.statementCache[statement.aaguid] = {
                        entry: {
                            metadataStatement: statement,
                            statusReports: [],
                            timeOfLastStatusChange: '1970-01-01',
                        },
                        url: '',
                    };
                    statementsAdded += 1;
                }
            });
            log(`Cached ${statementsAdded} local statements`);
        }
        // If MDS servers are provided, then process them and add their statements to the cache
        if (mdsServers === null || mdsServers === void 0 ? void 0 : mdsServers.length) {
            // Get a current count so we know how many new statements we've added from MDS servers
            const currentCacheCount = Object.keys(this.statementCache).length;
            let numServers = mdsServers.length;
            for (const url of mdsServers) {
                try {
                    await this.downloadBlob({
                        url,
                        no: 0,
                        nextUpdate: new Date(0),
                    });
                }
                catch (err) {
                    // Notify of the error and move on
                    log(`Could not download BLOB from ${url}:`, err);
                    numServers -= 1;
                }
            }
            // Calculate the difference to get the total number of new statements we successfully added
            const newCacheCount = Object.keys(this.statementCache).length;
            const cacheDiff = newCacheCount - currentCacheCount;
            log(`Cached ${cacheDiff} statements from ${numServers} metadata server(s)`);
        }
        if (verificationMode) {
            this.verificationMode = verificationMode;
        }
        this.setState(SERVICE_STATE.READY);
    }
    /**
     * Get a metadata statement for a given AAGUID.
     *
     * This method will coordinate updating the cache as per the `nextUpdate` property in the initial
     * BLOB download.
     */
    async getStatement(aaguid) {
        if (this.state === SERVICE_STATE.DISABLED) {
            return;
        }
        if (!aaguid) {
            return;
        }
        if (aaguid instanceof Uint8Array) {
            aaguid = (0, convertAAGUIDToString_1.convertAAGUIDToString)(aaguid);
        }
        // If a cache refresh is in progress then pause this until the service is ready
        await this.pauseUntilReady();
        // Try to grab a cached statement
        const cachedStatement = this.statementCache[aaguid];
        if (!cachedStatement) {
            if (this.verificationMode === 'strict') {
                // FIDO conformance requires RP's to only support registered AAGUID's
                throw new Error(`No metadata statement found for aaguid "${aaguid}"`);
            }
            // Allow registration verification to continue without using metadata
            return;
        }
        // If the statement points to an MDS API, check the MDS' nextUpdate to see if we need to refresh
        if (cachedStatement.url) {
            const mds = this.mdsCache[cachedStatement.url];
            const now = new Date();
            if (now > mds.nextUpdate) {
                try {
                    this.setState(SERVICE_STATE.REFRESHING);
                    await this.downloadBlob(mds);
                }
                finally {
                    this.setState(SERVICE_STATE.READY);
                }
            }
        }
        const { entry } = cachedStatement;
        // Check to see if the this aaguid has a status report with a "compromised" status
        for (const report of entry.statusReports) {
            const { status } = report;
            if (status === 'USER_VERIFICATION_BYPASS' ||
                status === 'ATTESTATION_KEY_COMPROMISE' ||
                status === 'USER_KEY_REMOTE_COMPROMISE' ||
                status === 'USER_KEY_PHYSICAL_COMPROMISE') {
                throw new Error(`Detected compromised aaguid "${aaguid}"`);
            }
        }
        return entry.metadataStatement;
    }
    /**
     * Download and process the latest BLOB from MDS
     */
    async downloadBlob(mds) {
        const { url, no } = mds;
        // Get latest "BLOB" (FIDO's terminology, not mine)
        const resp = await (0, cross_fetch_1.default)(url);
        const data = await resp.text();
        // Parse the JWT
        const parsedJWT = (0, parseJWT_1.parseJWT)(data);
        const header = parsedJWT[0];
        const payload = parsedJWT[1];
        if (payload.no <= no) {
            // From FIDO MDS docs: "also ignore the file if its number (no) is less or equal to the
            // number of the last BLOB cached locally."
            throw new Error(`Latest BLOB no. "${payload.no}" is not greater than previous ${no}`);
        }
        const headerCertsPEM = header.x5c.map(convertCertBufferToPEM_1.convertCertBufferToPEM);
        try {
            // Validate the certificate chain
            const rootCerts = settingsService_1.SettingsService.getRootCertificates({ identifier: 'mds' });
            await (0, validateCertificatePath_1.validateCertificatePath)(headerCertsPEM, rootCerts);
        }
        catch (error) {
            const _error = error;
            // From FIDO MDS docs: "ignore the file if the chain cannot be verified or if one of the
            // chain certificates is revoked"
            throw new Error(`BLOB certificate path could not be validated: ${_error.message}`);
        }
        // Verify the BLOB JWT signature
        const leafCert = headerCertsPEM[0];
        const verified = await (0, verifyJWT_1.verifyJWT)(data, (0, convertPEMToBytes_1.convertPEMToBytes)(leafCert));
        if (!verified) {
            // From FIDO MDS docs: "The FIDO Server SHOULD ignore the file if the signature is invalid."
            throw new Error('BLOB signature could not be verified');
        }
        // Cache statements for FIDO2 devices
        for (const entry of payload.entries) {
            // Only cache entries with an `aaguid`
            if (entry.aaguid) {
                this.statementCache[entry.aaguid] = { entry, url };
            }
        }
        // Remember info about the server so we can refresh later
        const [year, month, day] = payload.nextUpdate.split('-');
        this.mdsCache[url] = {
            ...mds,
            // Store the payload `no` to make sure we're getting the next BLOB in the sequence
            no: payload.no,
            // Convert the nextUpdate property into a Date so we can determine when to re-download
            nextUpdate: new Date(parseInt(year, 10), 
            // Months need to be zero-indexed
            parseInt(month, 10) - 1, parseInt(day, 10)),
        };
    }
    /**
     * A helper method to pause execution until the service is ready
     */
    async pauseUntilReady() {
        if (this.state === SERVICE_STATE.READY) {
            return;
        }
        // State isn't ready, so set up polling
        const readyPromise = new Promise((resolve, reject) => {
            const totalTimeoutMS = 70000;
            const intervalMS = 100;
            let iterations = totalTimeoutMS / intervalMS;
            // Check service state every `intervalMS` milliseconds
            const intervalID = globalThis.setInterval(() => {
                if (iterations < 1) {
                    clearInterval(intervalID);
                    reject(`State did not become ready in ${totalTimeoutMS / 1000} seconds`);
                }
                else if (this.state === SERVICE_STATE.READY) {
                    clearInterval(intervalID);
                    resolve();
                }
                iterations -= 1;
            }, intervalMS);
        });
        return readyPromise;
    }
    /**
     * Report service status on change
     */
    setState(newState) {
        this.state = newState;
        if (newState === SERVICE_STATE.DISABLED) {
            log('MetadataService is DISABLED');
        }
        else if (newState === SERVICE_STATE.REFRESHING) {
            log('MetadataService is REFRESHING');
        }
        else if (newState === SERVICE_STATE.READY) {
            log('MetadataService is READY');
        }
    }
}
exports.BaseMetadataService = BaseMetadataService;
// Export a service singleton
exports.MetadataService = new BaseMetadataService();
//# sourceMappingURL=metadataService.js.map