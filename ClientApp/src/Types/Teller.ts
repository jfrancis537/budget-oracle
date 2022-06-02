export interface TellerEnrollment {
  // An access token you can use together with your
  // client certificate to access this user's accounts.
  accessToken: string,
  user: {
    // A user ID you can use to later add more enrollments to the same user.
    id: string
  },
  enrollment: {
    // The enrollment ID used to initialise Connect in update mode, i.e. if it becomes disconnected.
    id: string,
    institution: {
      name: string
    }
  },
  // Signatures of the payload that can be used for verification.
  signatures: string[]
}

export interface TellerFailure {
  type: "payment" | "payee",
  code: "timeout" | "error",
  message: string
}

export interface TellerSetupArgs {
  environment?: "sandbox" | "development" | "production"
  applicationId: string;
  institution?: string;
  selectAccount?: "disabled" | "single" | "multiple";
  enrollmentId?: string,
  userId?: string,
  connectToken?: string,
  nonce?: string,
  onInit?: () => void;
  onSuccess: (enrollment: TellerEnrollment) => void;
  onExit?: () => void;
  onFailure?: (failure: TellerFailure) => void;
}

export type TellerAccountType = "depository" | "credit"

declare global {
  class TellerConnect {
    public static setup(args: TellerSetupArgs): TellerConnect;
    public open(): void;
  }
}