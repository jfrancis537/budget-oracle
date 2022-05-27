import { TellerAPI } from "../../APIs/TellerAPI"
import { Action } from "../../Utilities/Action"
import { autobind } from "../../Utilities/Decorators"
import { UserManager } from "./UserManager"

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

declare interface TellerFailure {
  type: "payment" | "payee",
  code: "timeout" | "error",
  message: string
}

declare interface TellerSetupArgs {
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

declare class TellerConnect {
  public static setup(args: TellerSetupArgs): TellerConnect;
  public open(): void;
}

export enum LinkedAccountType {
  BANK,
  CREDIT
}

export interface LinkedAccount {
  amount: number,
  name: string,
  enrollmentId: string,
  type: LinkedAccountType
}

class TellerManager {
  private appId = "app_o20o86tki9q1nfvons000"
  private linkedAccounts: Map<string, LinkedAccount[]>
  public onlinkedaccountsupdated: Action<LinkedAccount[]>;

  constructor() {
    this.linkedAccounts = new Map();
    this.onlinkedaccountsupdated = new Action();
    UserManager.onuserloggedin.addListener(this.handleUserLoggedIn);
  }

  public async createEnrollment() {
    let userId = await TellerAPI.getTellerUserId();
    const options: TellerSetupArgs = {
      applicationId: this.appId,
      environment: "development",
      onSuccess: async (enrollment) => {
        if (!userId) {
          await TellerAPI.setTellerUserId(enrollment.user.id);
        }
        await TellerAPI.addEnrollment(enrollment);
        let linkedAccounts = await TellerAPI.getEnrollmentData(enrollment.enrollment.id);
        this.linkedAccounts.set(enrollment.enrollment.id, linkedAccounts);
        this.handleLinkedAccountsUpdated();
      }
    };
    if (userId) {
      options.userId = userId;
    }
    let client = TellerConnect.setup(options);
    client.open();
  }

  @autobind
  private async handleUserLoggedIn() {
    let enrollments = await TellerAPI.getEnrollments();
    for (const enrollment of enrollments) {
      let linkedAccounts = await TellerAPI.getEnrollmentData(enrollment.id);
      this.linkedAccounts.set(enrollment.id, linkedAccounts);
    }
    this.handleLinkedAccountsUpdated();
  }

  private handleLinkedAccountsUpdated() {
    const accounts = [...this.linkedAccounts.values()].flat();
    console.log(accounts);
    this.onlinkedaccountsupdated.invoke(accounts);
  }

  public async refreshEnrollment() {
    //TODO
  }
}

const instance = new TellerManager();

export { instance as TellerManager };