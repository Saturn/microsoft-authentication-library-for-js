/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonClientCredentialRequest } from "@azure/msal-common/node";
import { ManagedIdentityRequestParams } from "./ManagedIdentityRequestParams.js";

/**
 * ManagedIdentityRequest
 * - clientCapabilities - an array of client capabilities to be sent to ESTS
 */
export type ManagedIdentityRequest = ManagedIdentityRequestParams &
    CommonClientCredentialRequest & {
        clientCapabilities?: Array<string>;
    };
