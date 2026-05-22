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

function restrictionFlag(input, key, defaultValue = true) {
  if (input[key] === undefined) {
    return defaultValue;
  }
  return Boolean(input[key]);
}

function buildRestrictionsPayload(input = {}, minOsVersion = "10.13") {
  const payloadContent = {
    allowAirDrop: restrictionFlag(input, "allowAirDrop", !input.disableAirDrop),
    allowScreenRecording: restrictionFlag(input, "allowScreenRecording", !input.disableScreenRecording),
    allowAppInstallation: restrictionFlag(input, "allowAppInstallation", !input.disableInstallingApps),
    allowCamera: restrictionFlag(input, "allowCamera"),
    allowSafari: restrictionFlag(input, "allowSafari"),
    allowiTunes: restrictionFlag(input, "allowiTunes"),
    allowCloudBackup: restrictionFlag(input, "allowCloudBackup"),
    allowEraseContentAndSettings: restrictionFlag(input, "allowEraseContentAndSettings", false),
    allowUIConfigurationProfileInstallation: restrictionFlag(
      input,
      "allowUIConfigurationProfileInstallation",
      !input.disableProfileInstallation
    ),
    forceDelayedSoftwareUpdates: Boolean(input.forceDelayedSoftwareUpdates),
    allowUSBRestrictedMode: restrictionFlag(input, "allowUSBRestrictedMode", !input.disableUSBRestrictedMode)
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

function buildCustomPayload(input = {}) {
  if (!input.rawPlistBase64 || typeof input.rawPlistBase64 !== "string") {
    throw new Error("custom profile requires values.rawPlistBase64");
  }
  const decoded = Buffer.from(input.rawPlistBase64, "base64");
  const parsed = plist.parse(decoded);
  if (!parsed?.PayloadType) {
    throw new Error("custom profile plist must include PayloadType");
  }
  return parsed;
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
    case "custom":
      return buildCustomPayload(values);
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

export const PROFILE_TYPE_SCHEMAS = {
  restrictions: {
    label: "Restrictions",
    fields: [
      { key: "disableAirDrop", label: "Disable AirDrop", type: "boolean" },
      { key: "disableScreenRecording", label: "Disable screen recording", type: "boolean" },
      { key: "disableInstallingApps", label: "Block app installation", type: "boolean" },
      { key: "disableProfileInstallation", label: "Block profile installation by user", type: "boolean" },
      { key: "allowCamera", label: "Allow camera", type: "boolean", default: true },
      { key: "allowSafari", label: "Allow Safari", type: "boolean", default: true },
      { key: "allowCloudBackup", label: "Allow iCloud backup", type: "boolean", default: true },
      { key: "forceDelayedSoftwareUpdates", label: "Delay software updates", type: "boolean" },
      { key: "disableUSBRestrictedMode", label: "Disable USB restricted mode lockout", type: "boolean" }
    ]
  },
  chrome: {
    label: "Chrome Policy",
    fields: [
      { key: "disableIncognito", label: "Disable incognito", type: "boolean" },
      { key: "disableDevTools", label: "Disable developer tools", type: "boolean" },
      { key: "forceSafeSearch", label: "Force safe search", type: "boolean" }
    ]
  },
  password_policy: {
    label: "Password Policy",
    fields: [
      { key: "minLength", label: "Minimum length", type: "number", default: 8 },
      { key: "minComplexity", label: "Minimum complex characters", type: "number", default: 1 }
    ]
  },
  wifi: {
    label: "Wi-Fi",
    fields: [
      { key: "ssid", label: "SSID", type: "string" },
      { key: "autoJoin", label: "Auto-join", type: "boolean", default: true },
      { key: "hiddenNetwork", label: "Hidden network", type: "boolean" },
      { key: "encryptionType", label: "Encryption", type: "string", default: "WPA" }
    ]
  },
  login_window: {
    label: "Login Window",
    fields: [
      { key: "disableGuestAccount", label: "Disable guest account", type: "boolean" },
      { key: "showOnlySpecifiedUsers", label: "Show only specified users", type: "boolean" }
    ]
  },
  custom: {
    label: "Custom payload (base64 plist)",
    fields: [{ key: "rawPlistBase64", label: "Base64-encoded payload plist", type: "text" }]
  }
};

export function validateProfileDefinition(body) {
  if (!body?.name || typeof body.name !== "string") {
    throw new Error("Profile name is required");
  }
  if (!body?.profileType || typeof body.profileType !== "string") {
    throw new Error("profileType is required");
  }
  if (!PROFILE_TYPE_SCHEMAS[body.profileType]) {
    throw new Error(`Unsupported profile type: ${body.profileType}`);
  }
}
