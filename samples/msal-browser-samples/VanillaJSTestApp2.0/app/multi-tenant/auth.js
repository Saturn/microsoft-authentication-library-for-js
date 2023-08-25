// Browser check variables
// If you support IE, our recommendation is that you sign-in using Redirect APIs
// If you as a developer are testing using Edge InPrivate mode, please add "isEdge" to the if check
const ua = window.navigator.userAgent;
const msie = ua.indexOf("MSIE ");
const msie11 = ua.indexOf("Trident/");
const msedge = ua.indexOf("Edge/");
const isIE = msie > 0 || msie11 > 0;
const isEdge = msedge > 0;

let signInType;
let accountId = "";

// Create the main myMSALObj instance
// configuration parameters are located at authConfig.js
const myMSALObj = new msal.PublicClientApplication(msalConfig);

// Redirect: once login is successful and redirects with tokens, call Graph API
myMSALObj.handleRedirectPromise().then(handleResponse).catch(err => {
    console.error(err);
});

function handleResponse() {
    // getAllAccounts returns all cached home and guest accounts
    const allAccounts = myMSALObj.getAllAccounts().filter((account) => {
        // Keep only home accounts since their tenant profiles are populated and guest accounts can be obatinined by getAccountByTenantProfile
        return account.homeAccountId.split(".")[0] === account.localAccountId;;
    });
    if (!allAccounts || allAccounts.length < 1) {
        return;
    } else if (allAccounts.length === 1) {
        // Get all accounts returns the homeAccount with tenantProfiles when multiTenantAccountsEnabled is set to true
        pickActiveAccountAndTenantProfile(allAccounts[0]);
    } else if (allAccounts.length > 1) {
            // Select account logic
    }
}

// Determines whether there is one or multiple tenant profiles to pick from and sets the active account based on the user selection if necessary.
async function pickActiveAccountAndTenantProfile(homeAccount) {
        // Set home tenant profile as default active account
        let activeAccount = myMSALObj.getActiveAccount();
        if (!activeAccount) {
            activeAccount = homeAccount;
            myMSALObj.setActiveAccount(activeAccount);
        }
        accountId = activeAccount.homeAccountId;
        showWelcomeMessage(homeAccount);
        let tenantProfileList = [];
        if (homeAccount.tenantProfiles) {
            // Tenant Profiles is a Map, so it will be flattened into an array
            homeAccount.tenantProfiles.forEach((profile) => {
                tenantProfileList.push(profile);
            });
        }
        showTenantProfilePicker(tenantProfileList, activeAccount);
}

async function setActiveAccount(tenantId) {
    // Sets the active account to the cached account object matching the tenant profile selected by the user.
    let activeAccount = myMSALObj.getActiveAccount();
    const tenantProfile = activeAccount.tenantProfiles.get(tenantId);
    const newActiveAccount = myMSALObj.getAccountByTenantProfile(tenantProfile);
    if (newActiveAccount) {
        myMSALObj.setActiveAccount(newActiveAccount);
        accountId = activeAccount.homeAccountId;
    }
    handleResponse();
}

async function signIn(method) {
    signInType = isIE ? "redirect" : method;
    if (signInType === "popup") {
        return myMSALObj.loginPopup(loginRequest).then(handleResponse).catch(function (error) {
            console.log(error);
        });
    } else if (signInType === "redirect") {
        return myMSALObj.loginRedirect(loginRequest)
    }
}

function signOut(interactionType) {
    const logoutRequest = {
        account: myMSALObj.getActiveAccount()
    };

    if (interactionType === "popup") {
        myMSALObj.logoutPopup(logoutRequest).then(() => {
            window.location.reload();
        });
    } else {
        myMSALObj.logoutRedirect(logoutRequest);
    }
}

async function requestGuestToken() {
    const currentAcc = myMSALObj.getAccountByHomeId(accountId);
    if (currentAcc) {
        const response = await getTokenRedirect(guestTenantRequest, currentAcc).catch(error => {
            console.log(error);
        });
        callMSGraph(graphConfig.graphMeEndpoint, response.accessToken, updateUI);
        guestProfileButton.style.display = 'none';
    }
}

// This function can be removed if you do not need to support IE
async function getTokenRedirect(request, account) {
    return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
        console.log("silent token acquisition fails.");
        if (error instanceof msal.InteractionRequiredAuthError) {
            // fallback to interaction when silent call fails
            console.log("acquiring token using redirect");
            myMSALObj.acquireTokenRedirect(request);
        } else {
            console.error(error);
        }
    });
}
