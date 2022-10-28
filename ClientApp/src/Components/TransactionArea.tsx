import moment from 'moment';
import { useEffect, useState } from 'react';
import { Dropdown, DropdownButton } from 'react-bootstrap';
import { LinkedAccountDetails, TransactionData } from '../APIs/TellerAPI';
import { TellerManager } from '../Processing/Managers/TellerManager';
import { Sorting } from '../Utilities/ArrayUtils';
import { getMonthNameFromNumber } from '../Utilities/DateTools';

import styles from '../styles/TransactionArea.module.css';

interface ITransactionItemProps {
  transaction: TransactionData;
}

const TransactionItem: React.FC<ITransactionItemProps> = props => {
  const t = props.transaction;
  useEffect(() => {
    TellerManager.oncategorynamesupdated.addListener(setCategories);
    TellerManager.ontransactioncategorized.addListener(handleCategoryChanged);
    return () => {
      TellerManager.oncategorynamesupdated.removeListener(setCategories);
      TellerManager.ontransactioncategorized.removeListener(handleCategoryChanged);
    }
  }, []);

  const [, setCategories] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState<string>(TellerManager.getTransactionCategory(t.id) ?? 'Uncategorized')

  async function addCategory() {
    let done = false;
    while (!done) {
      const input = window.prompt("Please enter a category name.");
      if (input && !TellerManager.hasTransactionCategory(input)) {
        done = true;
        await TellerManager.addTransactionCategory(input);
      } else if (!input) {
        if (!window.confirm("You did not specify a category name.")) {
          done = true;
        }
      } else {
        if (!window.confirm("Category already exists")) {
          done = true;
        }
      }
    }
  }

  function handleCategoryChanged(id: string) {
    if (t.id === id) {
      setTitle(TellerManager.getTransactionCategory(id) ?? 'Uncategorized');
    }
  }

  return (
    <div className={styles['transaction-body']}>
      <div>{t.description}</div>
      <div style={{ color: t.amount > 0 ? 'lime' : '#e76d6d' }}>${Math.abs(t.amount).toFixed(2)}</div>
      <div>{t.date}</div>
      <div className={styles['category-container']}>
        <DropdownButton title={title} >
          {TellerManager.categoryNames.map((name,index) => (
            <Dropdown.Item key={index} onClick={() => TellerManager.categorizeTransaction(t.id, name)}>
              {name}
            </Dropdown.Item>
          ))}
          <Dropdown.Item onSelect={addCategory}>
            Add Category
          </Dropdown.Item>
        </DropdownButton>
      </div>
    </div>
  )
};

export const TransactionArea: React.FC = () => {

  const [transactions, setTransactions] = useState<TransactionData[] | null>(null);
  const [accounts, setAccounts] = useState<LinkedAccountDetails[] | null>(null);
  const [month, setMonth] = useState<number>(-1);
  const [year, setYear] = useState<number>(-1);

  useEffect(() => {
    TellerManager.onlinkedtransactionsupdated.addListener(onTransactionsUpdated);
    TellerManager.onlinkedaccountsupdated.addListener(onAccountsUpdated);
    return () => {
      TellerManager.onlinkedtransactionsupdated.removeListener(onTransactionsUpdated);
      TellerManager.onlinkedaccountsupdated.removeListener(onAccountsUpdated);
    }
  }, []);

  function onTransactionsUpdated(data: TransactionData[]) {
    setTransactions(data);
  }

  function onAccountsUpdated(accounts: LinkedAccountDetails[]) {
    setAccounts(accounts);
  }

  function renderMonthPicker() {
    const months = new Set<number>();
    const years = new Set<number>();
    for (const t of transactions!) {
      const date = moment(t.date);
      months.add(date.month());
      years.add(Number(date.format("YYYY")));
    }
    return (
      <>
        <div className={styles['container']}>
          <DropdownButton title={month >= 0 ? getMonthNameFromNumber(month) : 'Month'}>
            {[...months].sort(Sorting.num).map(monthNum => (
              <Dropdown.Item key={monthNum} active={monthNum === month} onSelect={() => setMonth(monthNum)}>
                {getMonthNameFromNumber(monthNum)}
              </Dropdown.Item>
            ))}
          </DropdownButton>
          <DropdownButton title={year >= 0 ? year : 'Year'}>
            {[...years].sort(Sorting.num).map(yearNum => (
              <Dropdown.Item key={yearNum} active={yearNum === month} onSelect={() => setYear(yearNum)}>
                {yearNum}
              </Dropdown.Item>
            ))}
          </DropdownButton>
        </div>
      </>
    )
  }

  function renderTransactions() {
    if (month > 0 && year > 0) {
      const results = transactions!.filter(t => {
        const date = moment(t.date);
        return date.month() === month && date.year() === year
      }).map(t => (<TransactionItem transaction={t} key={t.id} />));
      return results;
    } else {
      return (<div>Please select a date</div>);
    }
  }

  function render(): JSX.Element | null {
    if (transactions && accounts) {
      //console.log(transactions[0], accounts[0]);
      const transactionsPerAccount = new Map<string, Set<TransactionData>>();
      for (const transaction of transactions) {
        if (!transactionsPerAccount.has(transaction.accountId)) {
          transactionsPerAccount.set(transaction.accountId, new Set());
        }
        transactionsPerAccount.get(transaction.accountId)!.add(transaction);
      }
      return (
        <>
          {renderMonthPicker()}
          <div className={styles['transactions-container']}>
            {renderTransactions()}
          </div>
        </>
      )
    }
    return null;


  }

  return render();
}