export async function triggerPushForDevice(_deviceId) {
  // NanoMDM delivers APNS pushes after command queue updates.
  // This hook is intentionally left as an extension point for direct APNS workflows.
  return { queued: true };
}
