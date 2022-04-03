import { IAccountPromptProps } from "../../Components/Prompts/AccountPrompt";
import { IBillPromptProps } from "../../Components/Prompts/BillPrompt";
import { IDebtPromptProps } from "../../Components/Prompts/DebtPrompt";
import { IGroupPromptProps } from "../../Components/Prompts/GroupPrompt";
import { IIncomePromptProps } from "../../Components/Prompts/IncomePrompt";
import { IInvestmentPromptProps } from "../../Components/Prompts/InvestmentPrompt";
import { IPaymentSchedulePromptProps } from "../../Components/Prompts/PaymentSchedulePrompt";
import { IVestSchedulePromptProps } from "../../Components/Prompts/VestSchedulePrompt";
import { Action } from "../../Utilities/Action";
import { Account } from "../Models/Account";
import { Bill } from "../Models/Bill";
import { Debt } from "../Models/Debt";
import { IncomeSource } from "../Models/IncomeSource";
import { PaymentSchedule } from "../Models/ScheduledPayment";
import { IValued } from "../Models/Valued";

class PromptManager {

  readonly ongrouppromptrequested: Action<IGroupPromptProps>;
  readonly onaccountpromptrequested: Action<IAccountPromptProps>;
  readonly onincomepromptrequested: Action<IIncomePromptProps>;
  readonly ondebtpromptrequested: Action<IDebtPromptProps>;
  readonly onbillpromptrequested: Action<IBillPromptProps>;
  readonly oninvestmentpromptrequested: Action<IInvestmentPromptProps>;
  readonly onpaymentschedulepromptrequested: Action<IPaymentSchedulePromptProps>;
  readonly onvestschedulepromptrequested: Action<IVestSchedulePromptProps>;
  readonly oncloserequested: Action<void>;

  private promptActive: boolean;


  constructor() {
    this.ongrouppromptrequested = new Action();
    this.onvestschedulepromptrequested = new Action();
    this.onaccountpromptrequested = new Action();
    this.oncloserequested = new Action();
    this.onincomepromptrequested = new Action();
    this.ondebtpromptrequested = new Action();
    this.onbillpromptrequested = new Action();
    this.oninvestmentpromptrequested = new Action();
    this.onpaymentschedulepromptrequested = new Action();

    this.promptActive = false;
  }

  public requestGroupPrompt(props: IGroupPromptProps) {
    if (!this.promptActive) {
      this.ongrouppromptrequested.invoke(props);
      this.promptActive = true;
    } else {
      throw new Error("You can't open two prompts at once");
    }
  }

  public requestAccountPrompt(props: IAccountPromptProps) {
    if (!this.promptActive) {
      this.onaccountpromptrequested.invoke(props);
      this.promptActive = true;
    } else {
      throw new Error("You can't open two prompts at once");
    }
  }

  public requestInvestmentPrompt(props: IInvestmentPromptProps) {
    if (!this.promptActive) {
      this.oninvestmentpromptrequested.invoke(props);
      this.promptActive = true;
    } else {
      throw new Error("You can't open two prompts at once");
    }
  }

  public requestPaymentSchedulePrompt(props: IPaymentSchedulePromptProps) {
    if (!this.promptActive) {
      this.onpaymentschedulepromptrequested.invoke(props);
      this.promptActive = true;
    } else {
      throw new Error("You can't open two prompts at once");
    }
  }

  public requestVestSchedulePrompt(props: IVestSchedulePromptProps) {
    if (!this.promptActive) {
      this.onvestschedulepromptrequested.invoke(props);
      this.promptActive = true;
    } else {
      throw new Error("You can't open two prompts at once");
    }
  }

  public requestIncomePrompt(props: IIncomePromptProps) {
    if (!this.promptActive) {
      this.onincomepromptrequested.invoke(props);
      this.promptActive = true;
    } else {
      throw new Error("You can't open two prompts at once");
    }
  }

  public requestDebtPrompt(props: IDebtPromptProps) {
    if (!this.promptActive) {
      this.ondebtpromptrequested.invoke(props);
      this.promptActive = true;
    } else {
      throw new Error("You can't open two prompts at once");
    }
  }

  public requestBillPrompt(props: IBillPromptProps) {
    if (!this.promptActive) {
      this.onbillpromptrequested.invoke(props);
      this.promptActive = true;
    } else {
      throw new Error("You can't open two prompts at once");
    }
  }

  public requestMessagePrompt()
  {
    
  }

  public requestPromptForItem(item: IValued, groupName?: string) {
    if (item instanceof Bill) {
      this.requestBillPrompt({
        billToEdit: item.id,
        editing: true,
        groupName: groupName!
      });
    } else if (item instanceof Account) {
      this.requestAccountPrompt({
        accountToEdit: item.id,
        editing: true
      });
    } else if (item instanceof Debt) {
      this.requestDebtPrompt({
        debtToEdit: item.id,
        editing: true,
        groupName: groupName!
      });
    } else if (item instanceof IncomeSource) {
      this.requestIncomePrompt({
        sourceToEdit: item.id,
        editing: true
      });
    } else if (item instanceof PaymentSchedule) {
      this.requestPaymentSchedulePrompt({
        editing: true,
        scheduleToEdit: item.id,
        viewOnly: false
      });
    }
  }

  public requestPaymentScheduleView(item: PaymentSchedule) {
    this.requestPaymentSchedulePrompt({
      editing: true,
      scheduleToEdit: item.id,
      viewOnly: true
    });
  }

  public requestClosePrompt() {
    this.promptActive = false;
    this.oncloserequested.invoke();
  }
}

let instance = new PromptManager();
export { instance as PromptManager };