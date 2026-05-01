import crypto from "node:crypto";
import plist from "plist";

const MACOS_10_13_UNSUPPORTED_RESTRICTION_KEYS = new Set([
  "allowScreenShot",
  "allowCloudDesktopAndDocuments"
]);

function uuid() {
  return crypto.randomUUID();
}

function buildChromePayload(input = {}) {
  const payloadContent = {
    IncognitoModeAvailability: input.disableIncognito ? 1 : 0,
    DeveloperToolsAvailability: input.disableDevTools ? 2 : 1,
    SafeBrowsingProtectionLevel: input.forceSafeSearch ? 1 : 0,
    ExtensionInstallAllowlist: Array.isArray(input.extensionWhitelist) ? input.extensionWhitelist : []
  };

  return {
    PayloadType: "com.google.Chrome",
    PayloadVersion: 1,
    PayloadIdentifier: `com.pmdm.chrome.${uuid()}`,
    PayloadUUID: uuid(),
    PayloadDisplayName: "Chrome Policy",
    PayloadContent: payloadContent
  };
}

function buildRestrictionsPayload(input = {}, minOsVersion = "10.13") {
  const payloadContent = {
    allowAirDrop: !input.disableAirDrop,
    allowScreenRecording: !input.disableScreenRecording,
    allowAppInstallation: !input.disableInstallingApps
  };

  if (minOsVersion <= "10.13") {
    for (const key of MACOS_10_13_UNSUPPORTED_RESTRICTION_KEYS) {
      delete payloadContent[key];
    }
  }

  return {
    PayloadType: "com.apple.applicationaccess",
    PayloadVersion: 1,
    PayloadIdentifier: `com.pmdm.restrictions.${uuid()}`,
    PayloadUUID: uuid(),
    PayloadDisplayName: "Restrictions",
    PayloadContent: payloadContent
  };
}

function buildPasswordPayload(input = {}) {
  return {
    PayloadType: "com.apple.mobiledevice.passwordpolicy",
    PayloadVersion: 1,
    PayloadIdentifier: `com.pmdm.password.${uuid()}`,
    PayloadUUID: uuid(),
    PayloadDisplayName: "Password Policy",
    PayloadContent: {
      minLength: input.minLength ?? 8,
      minComplexChars: input.minComplexity ?? 1
    }
  };
}

function buildWifiPayload(input = {}) {
  return {
    PayloadType: "com.apple.wifi.managed",
    PayloadVersion: 1,
    PayloadIdentifier: `com.pmdm.wifi.${uuid()}`,
    PayloadUUID: uuid(),
    PayloadDisplayName: "Wi-Fi",
    PayloadContent: {
      SSID_STR: input.ssid ?? "",
      AutoJoin: input.autoJoin !== false,
      HiddenNetwork: !!input.hiddenNetwork,
      EncryptionType: input.encryptionType ?? "WPA"
    }
  };
}

function buildLoginWindowPayload(input = {}) {
  return {
    PayloadType: "com.apple.loginwindow",
    PayloadVersion: 1,
    PayloadIdentifier: `com.pmdm.loginwindow.${uuid()}`,
    PayloadUUID: uuid(),
    PayloadDisplayName: "Login Window",
    PayloadContent: {
      DisableGuestAccount: !!input.disableGuestAccount,
      SHOWFULLNAME: !!input.showOnlySpecifiedUsers
    }
  };
}

function buildPayloadByType(type, values, minOsVersion) {
  switch (type) {
    case "chrome":
      return buildChromePayload(values);
    case "restrictions":
      return buildRestrictionsPayload(values, minOsVersion);
    case "password_policy":
      return buildPasswordPayload(values);
    case "wifi":
      return buildWifiPayload(values);
    case "login_window":
      return buildLoginWindowPayload(values);
    default:
      throw new Error(`Unsupported profile type: ${type}`);
  }
}

export function buildMobileConfig({ name, description = "", profileType, values = {}, minOsVersion = "10.13" }) {
  const payload = buildPayloadByType(profileType, values, minOsVersion);
  const root = {
    PayloadContent: [payload],
    PayloadDisplayName: name,
    PayloadDescription: description,
    PayloadIdentifier: `com.pmdm.profile.${uuid()}`,
    PayloadOrganization: "PMDM",
    PayloadRemovalDisallowed: false,
    PayloadType: "Configuration",
    PayloadUUID: uuid(),
    PayloadVersion: 1
  };

  return Buffer.from(plist.build(root), "utf8");
}

export function validateProfileDefinition(body) {
  if (!body?.name || typeof body.name !== "string") {
    throw new Error("Profile name is required");
  }
  if (!body?.profileType || typeof body.profileType !== "string") {
    throw new Error("profileType is required");
  }
}
