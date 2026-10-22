import * as LocalAuthentication from 'expo-local-authentication';

export async function checkBiometricSupport(): Promise<{
  hasHardware: boolean;
  isEnrolled: boolean;
  biometryType: string;
}> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

  let biometryType = 'Biometrics';
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    biometryType = 'Face ID';
  } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    biometryType = 'Fingerprint';
  }

  return { hasHardware, isEnrolled, biometryType };
}

export async function promptBiometricAuth(promptMessage = 'Unlock Bullseye'): Promise<boolean> {
  const { hasHardware, isEnrolled } = await checkBiometricSupport();
  if (!hasHardware || !isEnrolled) return true;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancel',
    fallbackLabel: 'Use Passcode',
    disableDeviceFallback: false,
  });

  return result.success;
}
