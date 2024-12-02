import React from "react";
import { PromptManager } from "../../Processing/Managers/PromptManager";

import promptStyles from '../../styles/Prompts.module.css';
import { autobind } from "../../Utilities/Decorators";
import { AccountPrompt, IAccountPromptProps } from "./AccountPrompt";
import { BillPrompt, IBillPromptProps } from "./BillPrompt";
import { DebtPrompt, IDebtPromptProps } from "./DebtPrompt";
import { GroupPrompt, IGroupPromptProps } from "./GroupPrompt";
import { IIncomePromptProps, IncomePrompt } from "./IncomePrompt";
import { IInvestmentPromptProps, InvestmentPrompt } from "./InvestmentPrompt";
import { IPaymentSchedulePromptProps, PaymentSchedulePrompt } from "./PaymentSchedulePrompt";
import { IVestSchedulePromptProps, VestSchedulePrompt } from "./VestSchedulePrompt";

export enum PromptType {
  Group,
  Account,
  Bill,
  Debt,
  IncomeSource,
  Investment,
  PaymentSchedule,
  VestSchedule
}

export type PromptProps = IGroupPromptProps | IAccountPromptProps | IIncomePromptProps | IInvestmentPromptProps;

interface PromptsState {
  activePrompt?: PromptType;
  props?: PromptProps;
}

export class Prompts extends React.Component<{}, PromptsState> {

  constructor(props: {}) {
    super(props);

    this.state = {
      activePrompt: undefined,
      props: undefined
    }
  }

  componentDidMount() {
    PromptManager.onaccountpromptrequested.addListener(this.showAccountPrompt);
    PromptManager.ongrouppromptrequested.addListener(this.showGroupPrompt);
    PromptManager.onincomepromptrequested.addListener(this.showIncomePrompt);
    PromptManager.ondebtpromptrequested.addListener(this.showDebtPrompt);
    PromptManager.onbillpromptrequested.addListener(this.showBillPrompt);
    PromptManager.oncloserequested.addListener(this.closePrompt);
    PromptManager.oninvestmentpromptrequested.addListener(this.showInvestmentPrompt);
    PromptManager.onpaymentschedulepromptrequested.addListener(this.showPaymentSchedulePrompt)
    PromptManager.onvestschedulepromptrequested.addListener(this.showVestSchedulePrompt);
  }

  @autobind
  private showGroupPrompt(props: IGroupPromptProps) {
    this.setState({
      activePrompt: PromptType.Group,
      props: props
    });
  }

  @autobind
  private showPaymentSchedulePrompt(props: IPaymentSchedulePromptProps) {
    this.setState({
      activePrompt: PromptType.PaymentSchedule,
      props: props
    });
  }

  @autobind
  private showVestSchedulePrompt(props: IVestSchedulePromptProps) {
    this.setState({
      activePrompt: PromptType.VestSchedule,
      props: props
    });
  }

  @autobind
  private showAccountPrompt(props: IAccountPromptProps) {
    this.setState({
      activePrompt: PromptType.Account,
      props: props
    });
  }

  @autobind
  private showIncomePrompt(props: IIncomePromptProps) {
    this.setState({
      activePrompt: PromptType.IncomeSource,
      props: props
    });
  }

  @autobind
  private showDebtPrompt(props: IDebtPromptProps) {
    this.setState({
      activePrompt: PromptType.Debt,
      props: props
    });
  }

  @autobind
  private showBillPrompt(props: IBillPromptProps) {
    this.setState({
      activePrompt: PromptType.Bill,
      props: props
    });
  }

  @autobind
  private showInvestmentPrompt(props: IInvestmentPromptProps) {
    this.setState({
      activePrompt: PromptType.Investment,
      props: props
    });
  }

  @autobind
  private closePrompt() {
    this.setState({
      activePrompt: undefined,
      props: undefined
    });
  }

  private renderPrompt(): JSX.Element | null {
    let result: JSX.Element | null;
    switch (this.state.activePrompt) {
      case PromptType.Group:
        const groupProps = this.state.props as IGroupPromptProps;
        result = (
          <GroupPrompt {...groupProps} />
        );
        break;
      case PromptType.Account:
        const accountProps = this.state.props as IAccountPromptProps;
        result = (
          <AccountPrompt {...accountProps} />
        );
        break;
      case PromptType.IncomeSource:
        const incomeProps = this.state.props as IIncomePromptProps;
        result = (
          <IncomePrompt {...incomeProps} />
        );
        break;
      case PromptType.Debt:
        const debtProps = this.state.props as IDebtPromptProps;
        result = (
          <DebtPrompt {...debtProps} />
        );
        break;
      case PromptType.Bill:
        const billProps = this.state.props as IBillPromptProps;
        result = (
          <BillPrompt {...billProps} />
        );
        break;
      case PromptType.Investment:
        const investmentProps = this.state.props as IInvestmentPromptProps;
        result = (
          <InvestmentPrompt {...investmentProps} />
        );
        break;
      case PromptType.PaymentSchedule:
        const paymentScheduleProps = this.state.props as IPaymentSchedulePromptProps;
        result = (
          <PaymentSchedulePrompt {...paymentScheduleProps} />
        );
        break;
      case PromptType.VestSchedule:
        const vestScheduleProps = this.state.props as IVestSchedulePromptProps;
        result = (
          <VestSchedulePrompt {...vestScheduleProps} />
        );
        break;
      default:
        result = null;
        break;
    }
    return result;
  }

  render() {
    return (
      <div className={promptStyles['placeholder']}>
        {this.renderPrompt()}
      </div>
    )
  }
}