import React from "react";
import { PromptManager } from "../../Processing/Managers/PromptManager";

import promptStyles from '../../styles/Prompts.module.css';
import { AccountPrompt, IAccountPromptProps } from "./AccountPrompt";
import { BillPrompt, IBillPromptProps } from "./BillPrompt";
import { DebtPrompt, IDebtPromptProps } from "./DebtPrompt";
import { GroupPrompt, IGroupPromptProps } from "./GroupPrompt";
import { IIncomePromptProps, IncomePrompt } from "./IncomePrompt";

export enum PromptType {
  Group,
  Account,
  Bill,
  Debt,
  IncomeSource
}

export type PromptProps = IGroupPromptProps | IAccountPromptProps | IIncomePromptProps;

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

    this.showGroupPrompt = this.showGroupPrompt.bind(this);
    this.showAccountPrompt = this.showAccountPrompt.bind(this);
    this.showIncomePrompt = this.showIncomePrompt.bind(this);
    this.showDebtPrompt = this.showDebtPrompt.bind(this);
    this.showBillPrompt = this.showBillPrompt.bind(this);
    this.closePrompt = this.closePrompt.bind(this);
  }

  componentDidMount() {
    PromptManager.onaccountpromptrequested.addListener(this.showAccountPrompt);
    PromptManager.ongrouppromptrequested.addListener(this.showGroupPrompt);
    PromptManager.onincomepromptrequested.addListener(this.showIncomePrompt);
    PromptManager.ondebtpromptrequested.addListener(this.showDebtPrompt);
    PromptManager.onbillpromptrequested.addListener(this.showBillPrompt);
    PromptManager.oncloserequested.addListener(this.closePrompt);
  }

  private showGroupPrompt(props: IGroupPromptProps) {
    this.setState({
      activePrompt: PromptType.Group,
      props: props
    });
  }

  private showAccountPrompt(props: IAccountPromptProps) {
    this.setState({
      activePrompt: PromptType.Account,
      props: props
    });
  }

  private showIncomePrompt(props: IIncomePromptProps) {
    this.setState({
      activePrompt: PromptType.IncomeSource,
      props: props
    });
  }

  private showDebtPrompt(props: IDebtPromptProps) {
    this.setState({
      activePrompt: PromptType.Debt,
      props: props
    });
  }

  private showBillPrompt(props: IBillPromptProps)
  {
    this.setState({
      activePrompt: PromptType.Bill,
      props: props
    });
  }

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