import moment from 'moment';
import { useEffect, useState } from 'react';
import { Dropdown, DropdownButton, Button } from 'react-bootstrap';
import { LinkedAccountDetails, TransactionData } from '../APIs/TellerAPI';
import { IGNORED_TRANSACTION_CATEGORY, TellerManager } from '../Processing/Managers/TellerManager';
import { Sorting } from '../Utilities/ArrayUtils';
import { getMonthNameFromNumber } from '../Utilities/DateTools';

import styles from '../styles/TransactionArea.module.css';
import { Currency } from './Currency';

interface ITransactionItemProps {
  transaction: TransactionData;
  accounts: LinkedAccountDetails[] | null;
}

enum SortMode {
  PriceHighestFirst = "Price (Highest First)",
  PriceLowestFirst = "Price (Lowest First)",
  MostRecent = "Most Recent",
  Oldest = "Oldest"
}

enum ViewMode {
  Summary,
  Transaction
}

const TransactionItem: React.FC<ITransactionItemProps> = props => {
  const t = props.transaction;
  useEffect(() => {
    TellerManager.oncategorynamesupdated.addListener(onCategoriesUpdated);
    TellerManager.ontransactioncategorized.addListener(handleCategoryChanged);
    return () => {
      TellerManager.oncategorynamesupdated.removeListener(onCategoriesUpdated);
      TellerManager.ontransactioncategorized.removeListener(handleCategoryChanged);
    }
  }, []);

  const [categories, setCategories] = useState<string[]>(TellerManager.categoryNames);
  const [title, setTitle] = useState<string>(TellerManager.getTransactionCategory(t.id) ?? 'Uncategorized')

  function onCategoriesUpdated(names: Set<string>) {
    const categories = [...names];
    categories.sort();
    setCategories(categories);
  }

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
  function render() {
    let value = t.amount;
    const account = props.accounts?.find(acct => t.accountId === acct.id);
    if (account) {
      value = account.type === 'credit' ? value *= -1 : value;
    }

    return (
      <div className={styles['transaction-body']}>
        <div>{t.description}</div>
        <Currency amount={value} />
        <div>{t.date}</div>
        <div className={styles['category-container']}>
          <DropdownButton title={title} >
            {[null, ...categories].reduce((filteredItems: JSX.Element[], category, index) => {
              if (/*TODO MOVE UNCATEGORIZE category !== IGNORED_TRANSACTION_CATEGORY &&*/ category !== title) {
                filteredItems?.push(
                  <Dropdown.Item key={index} onClick={() => TellerManager.categorizeTransaction(t.id, category)}>
                    {category ?? "Uncategorized"}
                  </Dropdown.Item>
                );
              }
              return filteredItems;
            }, [])}
            <Dropdown.Item onClick={addCategory}>
              Add Category
            </Dropdown.Item>
          </DropdownButton>
        </div>
      </div>
    )
  }

  return render();
};

export const TransactionArea: React.FC = () => {

  const [transactions, setTransactions] = useState<TransactionData[] | null>(null);
  const [accounts, setAccounts] = useState<LinkedAccountDetails[] | null>(null);
  const [month, setMonth] = useState<number>(-1);
  const [year, setYear] = useState<number>(-1);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(TellerManager.categoryNames);
  const [sortMode, setSortMode] = useState<SortMode>(SortMode.MostRecent);
  const [view, setView] = useState<ViewMode>(ViewMode.Transaction);

  useEffect(() => {
    TellerManager.onlinkedtransactionsupdated.addListener(onTransactionsUpdated);
    TellerManager.onlinkedaccountsupdated.addListener(onAccountsUpdated);
    TellerManager.oncategorynamesupdated.addListener(onCategoriesUpdated);
    TellerManager.ontransactioncategorized.addListener(onTransactionCategorized);
    return () => {
      TellerManager.onlinkedtransactionsupdated.removeListener(onTransactionsUpdated);
      TellerManager.onlinkedaccountsupdated.removeListener(onAccountsUpdated);
      TellerManager.oncategorynamesupdated.removeListener(onCategoriesUpdated);
      TellerManager.ontransactioncategorized.addListener(onTransactionCategorized);
    }
  }, []);

  function onTransactionsUpdated() {
    setTransactions(TellerManager.getTransactions());
  }

  function onAccountsUpdated(accounts: LinkedAccountDetails[]) {
    setAccounts(accounts);
  }

  function onCategoriesUpdated(categories: Set<string>) {
    const sortedCategories = [...categories];
    sortedCategories.sort();
    setCategories(sortedCategories);
  }

  function onTransactionCategorized() {
    setTransactions(TellerManager.getTransactions());
  }

  function renderStats(filtered: TransactionData[]) {
    const total = filtered.reduce((prev, t) => {
      const account = accounts?.find(acct => acct.id === t.accountId);
      let value = t.amount;
      if (account) {
        value = account.type === 'credit' ? value * -1 : value;
      }
      return prev + value;
    }, 0);
    return (
      <>
        <div className={styles['transaction-stats']}>
          <div>Total:</div>
          <Currency amount={total} />
        </div>
        <div className={styles['transaction-stats']}>
          <div>Transactions:</div>
          <div>{filtered.length}</div>
        </div>
      </>
    )
  }

  function exportReport(data: TransactionData[]) {
    TellerManager.exportReport(data);
  }

  function onCategoryChanged(category: string | null) {
    setCategoryFilter(category)
    setView(ViewMode.Transaction);
  }

  function toggleViewMode() {
    setView(view === ViewMode.Summary ? ViewMode.Transaction : ViewMode.Summary);
  }

  function renderControls(filteredTransactions: TransactionData[]) {
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
              <Dropdown.Item key={monthNum} active={monthNum === month} onClick={() => setMonth(monthNum)}>
                {getMonthNameFromNumber(monthNum)}
              </Dropdown.Item>
            ))}
          </DropdownButton>
          <DropdownButton title={year >= 0 ? year : 'Year'}>
            {[...years].sort(Sorting.num).map(yearNum => (
              <Dropdown.Item key={yearNum} active={yearNum === month} onClick={() => setYear(yearNum)}>
                {yearNum}
              </Dropdown.Item>
            ))}
          </DropdownButton>
          <DropdownButton title={categoryFilter ?? 'Filter'} disabled={categoryFilter === null && categories.length === 0}>
            <Dropdown.Item onClick={toggleViewMode}>
              {view === ViewMode.Summary ? 'All Transactions' : 'Summary'}
            </Dropdown.Item>
            <Dropdown.Divider />
            {[null, ...categories].reduce((elems: JSX.Element[], category, index) => {
              if (category || categoryFilter !== null) {
                elems.push(
                  <Dropdown.Item key={index} active={categoryFilter === category} onClick={() => onCategoryChanged(category)}>
                    {category ?? 'Clear Filter...'}
                  </Dropdown.Item>
                );
              }
              return elems;
            }, [])}
          </DropdownButton>
          <Button disabled={filteredTransactions.length <= 0} onClick={() => exportReport(filteredTransactions)}>
            <i className="bi bi-save"></i>
          </Button>
        </div>
      </>
    )
  }

  function sortTransactions(transactions: TransactionData[]) {
    switch (sortMode) {
      case SortMode.Oldest:
        transactions.sort((a, b) => {
          return Sorting.dateString(a.date, b.date);
        });
        break;
      case SortMode.MostRecent:
        transactions.sort((a, b) => {
          return Sorting.dateString(a.date, b.date, false);
        });
        break;
      case SortMode.PriceHighestFirst:
        transactions.sort((a, b) => {
          return Sorting.num(a.amount, b.amount, false);
        });
        break;
      case SortMode.PriceLowestFirst:
        transactions.sort((a, b) => {
          return Sorting.num(a.amount, b.amount);
        });
        break;
    }
  }

  function processTransactions() {
    const filteredTransactions = transactions!.filter(t => {
      const category = TellerManager.getTransactionCategory(t.id);
      const date = moment(t.date);
      if (categoryFilter === IGNORED_TRANSACTION_CATEGORY) {
        if (category === IGNORED_TRANSACTION_CATEGORY &&
          (date.month() === month && date.year() === year)) {
          return true;
        }
      } else {
        if ((date.month() === month && date.year() === year) &&
          (categoryFilter === null || category === categoryFilter) &&
          (category !== IGNORED_TRANSACTION_CATEGORY)) {
          return true;
        }
      }
      return false
    });
    sortTransactions(filteredTransactions);
    return filteredTransactions;
  }

  function renderTransactions(filteredTransactions: TransactionData[]) {
    if (month >= 0 && year > 0) {
      return (
        <>
          {renderStats(filteredTransactions)}
          {filteredTransactions.map(t => (<TransactionItem accounts={accounts} transaction={t} key={t.id} />))}
        </>
      )
    } else {
      return (<div>Please select a date</div>);
    }
  }

  function renderSummary(transactions: TransactionData[]) {
    const categoryTotals = new Map<string, number>();
    for (const data of transactions) {
      const category = TellerManager.getTransactionCategory(data.id) ?? 'Uncategorized';
      const account = accounts?.find(acct => acct.id === data.accountId);
      let value = data.amount;
      if (account) {
        value = account.type === 'credit' ? value * -1 : value;
      }
      let amount = categoryTotals.get(category) ?? 0;
      amount += value;
      categoryTotals.set(category, amount);
    }
    return (
      <>
        {categories.map(cat => {
          const total = categoryTotals.get(cat) ?? 0
          return (
            <div className={styles['transaction-stats']}>
              <div>{cat}</div>
              <Currency amount={total} />
            </div>
          )
        })}
      </>
    );
  }

  function render(): JSX.Element | null {
    if (transactions && accounts) {
      const filteredTransactions = processTransactions();
      return (
        <>
          {renderControls(filteredTransactions)}
          <div className={styles['transactions-container']}>
            {view === ViewMode.Transaction ? renderTransactions(filteredTransactions) : renderSummary(filteredTransactions)}
          </div>
        </>
      )
    }
    return null;


  }

  return render();
}