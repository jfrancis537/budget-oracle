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

  const [transactions, setTransactions] = useState<TransactionData[] | null>(sampleTransactions);
  const [accounts, setAccounts] = useState<LinkedAccountDetails[] | null>(sampleAccounts);
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
      return (<div>TODO RENDER THE TRANSACTRION</div>);
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
          <span>Hello World</span>
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

const sampleAccounts = JSON.parse('[{"name":"CREDIT CARD","enrollmentId":"enr_o29rd1ojled7kpv0lk000","userId":"usr_o29qe57403o322mrdk000","type":"credit","balanceUrl":"https://api.teller.io/accounts/acc_o20o96lg5kdkm3htp8000/balances","id":"acc_o20o96lg5kdkm3htp8000","lastFour":"0422","accessToken":"token_clpl7txr4myztx7biogxy5gzqy"},{"name":"TOTAL CHECKING","enrollmentId":"enr_o29rd1ojled7kpv0lk000","userId":"usr_o29qe57403o322mrdk000","type":"depository","balanceUrl":"https://api.teller.io/accounts/acc_o20o96lelkdkm3htp8000/balances","id":"acc_o20o96lelkdkm3htp8000","lastFour":"7968","accessToken":"token_clpl7txr4myztx7biogxy5gzqy"},{"name":"CREDIT CARD","enrollmentId":"enr_o29rd1ojled7kpv0lk000","userId":"usr_o29qe57403o322mrdk000","type":"credit","balanceUrl":"https://api.teller.io/accounts/acc_o20o96lflkdkm3htp8000/balances","id":"acc_o20o96lflkdkm3htp8000","lastFour":"2886","accessToken":"token_clpl7txr4myztx7biogxy5gzqy"}]');

const sampleTransactions: TransactionData[] = JSON.parse('[{"status":"posted","amount":-60,"id":"acc_o20o96lelkdkm3htp8000","type":"atm","date":"2022-10-21","description":"ATM WITHDRAWAL 001432 10/218010 164T","category":""},{"status":"posted","amount":-0.09,"id":"acc_o20o96lelkdkm3htp8000","type":"card_payment","date":"2022-10-21","description":"COSTCO WHSE #1225 REDMOND WA 10/20","category":"groceries"},{"status":"posted","amount":65,"id":"acc_o20o96lelkdkm3htp8000","type":"payment","date":"2022-10-19","description":"Zelle payment from KARIN FRANCIS WFCT0QRM6VZC","category":"general"},{"status":"posted","amount":-1522.5,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-10-17","description":"Guardian Life ACH Paymnt PPD ID: 9970011000","category":"general"},{"status":"posted","amount":48,"id":"acc_o20o96lelkdkm3htp8000","type":"digital_payment","date":"2022-10-17","description":"Zelle payment from LEBNY JECSAN PARGAS 15561735153","category":""},{"status":"posted","amount":4072.13,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-10-14","description":"GOOGLE LLC PAYROLL PPD ID: J770493581","category":"software"},{"status":"posted","amount":-63.51,"id":"acc_o20o96lelkdkm3htp8000","type":"bill_payment","date":"2022-10-11","description":"Online Payment 15518517309 To ZIPLY FIBER 10/11","category":"general"},{"status":"posted","amount":-20000,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-10-06","description":"SEI GWS TRANSFERS PPD ID: 4061271230","category":""},{"status":"posted","amount":-2600,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-10-05","description":"PL*WindermerePro WEB PMTS 65QFB4 WEB ID: 9000292793","category":"general"},{"status":"posted","amount":-216.7,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-10-05","description":"DEPT EDUCATION STUDENT LN PPD ID: 9102001001","category":"general"},{"status":"posted","amount":-13,"id":"acc_o20o96lelkdkm3htp8000","type":"card_payment","date":"2022-10-05","description":"WA LOT- WALMART NEIGHBO BELLEVUE WA 10/04","category":"general"},{"status":"posted","amount":-23.86,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-10-04","description":"DISCOVER E-PAYMENT 3623 WEB ID: 2510020270","category":"service"},{"status":"posted","amount":1120,"id":"acc_o20o96lelkdkm3htp8000","type":"digital_payment","date":"2022-10-04","description":"Zelle payment from LEBNY JECSAN PARGAS 15458012481","category":""},{"status":"posted","amount":-326.21,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-10-03","description":"LIGHTSTREAM LOAN PMTS 32830076 WEB ID: 1253108792","category":"general"},{"status":"posted","amount":-23,"id":"acc_o20o96lelkdkm3htp8000","type":"digital_payment","date":"2022-09-30","description":"Zelle payment to Lebny Pargas 15430617214","category":"general"},{"status":"posted","amount":-200,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-09-30","description":"Payment to Chase card ending in 0422 09/30","category":"service"},{"status":"posted","amount":-5,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-09-30","description":"Payment to Chase card ending in 2886 09/30","category":"service"},{"status":"posted","amount":-242.24,"id":"acc_o20o96lelkdkm3htp8000","type":"bill_payment","date":"2022-09-30","description":"Online Payment 15415028331 To CITY OF REDMOND WA 09/30","category":"general"},{"status":"posted","amount":217.38,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-09-30","description":"GOOGLE LLC PAYROLL PPD ID: J770493581","category":"software"},{"status":"posted","amount":4024.62,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-09-30","description":"GOOGLE LLC PAYROLL PPD ID: J770493581","category":"software"},{"status":"posted","amount":12737.4,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-09-30","description":"Morgan Stanley ACH CREDIT PPD ID: 9827837001","category":"general"},{"status":"posted","amount":-600,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-09-29","description":"Payment to Chase card ending in 0422 09/29","category":"service"},{"status":"posted","amount":-1400,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-09-29","description":"Payment to Chase card ending in 2886 09/29","category":"service"},{"status":"posted","amount":-600,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-09-28","description":"Payment to Chase card ending in 0422 09/29","category":"service"},{"status":"posted","amount":-1400,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-09-28","description":"Payment to Chase card ending in 2886 09/29","category":"service"},{"status":"posted","amount":-20,"id":"acc_o20o96lelkdkm3htp8000","type":"digital_payment","date":"2022-09-27","description":"Zelle payment to Lebny Pargas 15400287267","category":"general"},{"status":"posted","amount":-40.89,"id":"acc_o20o96lelkdkm3htp8000","type":"card_payment","date":"2022-09-25","description":"SAFEWAY #1555 FEDERAL WAY WA 09/25 Purchase $0.89 Cash Back $40.00","category":"groceries"},{"status":"posted","amount":-1522.5,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-09-24","description":"Guardian Life ACH Paymnt PPD ID: 9970011000","category":"general"},{"status":"posted","amount":-2078.75,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-09-24","description":"HEALTHEQUITY INC HealthEqui PPD ID: 1522383166","category":"general"},{"status":"posted","amount":-45,"id":"acc_o20o96lelkdkm3htp8000","type":"atm","date":"2022-09-23","description":"ATM WITHDRAWAL 007435 09/2317667 NE","category":""},{"status":"posted","amount":-153,"id":"acc_o20o96lelkdkm3htp8000","type":"transaction","date":"2022-09-23","description":"HAPO COM WEB ECM LOAN PAY 72515745 WEB ID: 1751553739","category":"general"},{"status":"posted","amount":25,"id":"acc_o20o96lelkdkm3htp8000","type":"digital_payment","date":"2022-09-18","description":"Zelle payment from JONATHAN CHEN 15327189628","category":""},{"status":"posted","amount":4072.11,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-09-16","description":"GOOGLE LLC PAYROLL PPD ID: J770493581","category":"software"},{"status":"posted","amount":-49.24,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-09-15","description":"DISCOVER E-PAYMENT 3623 WEB ID: 2510020270","category":"service"},{"status":"posted","amount":2078.75,"id":"acc_o20o96lelkdkm3htp8000","type":"check","date":"2022-09-12","description":"REMOTE ONLINE DEPOSIT # 1","category":""},{"status":"posted","amount":-13,"id":"acc_o20o96lelkdkm3htp8000","type":"digital_payment","date":"2022-09-11","description":"Zelle payment to Lebny Pargas 15273001067","category":"general"},{"status":"posted","amount":-216.7,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-09-07","description":"DEPT EDUCATION STUDENT LN PPD ID: 9102001001","category":"general"},{"status":"posted","amount":-63.51,"id":"acc_o20o96lelkdkm3htp8000","type":"bill_payment","date":"2022-09-05","description":"Online Payment 15225977967 To ZIPLY FIBER 09/06","category":"general"},{"status":"posted","amount":1100,"id":"acc_o20o96lelkdkm3htp8000","type":"digital_payment","date":"2022-09-03","description":"Zelle payment from LEBNY JECSAN PARGAS 15215611506","category":""},{"status":"posted","amount":-326.21,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-09-02","description":"LIGHTSTREAM LOAN PMTS 32337494 WEB ID: 1253108792","category":"general"},{"status":"posted","amount":4072.13,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-09-02","description":"GOOGLE LLC PAYROLL PPD ID: J770493581","category":"software"},{"status":"posted","amount":-19000,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-08-31","description":"FID BKG SVC LLC MONEYLINE PPD ID: 1035141383","category":"loan"},{"status":"posted","amount":-720.43,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-08-30","description":"Payment to Chase card ending in 0422 08/30","category":"service"},{"status":"posted","amount":-852.76,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-08-30","description":"Payment to Chase card ending in 2886 08/30","category":"service"},{"status":"posted","amount":16,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-08-30","description":"FID BKG SVC LLC MONEYLINE PPD ID: 1035141375","category":"loan"},{"status":"posted","amount":-15000,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-08-29","description":"AMERICANEXPRESS TRANSFER 000320015939970 WEB ID: 124085066","category":"general"},{"status":"posted","amount":10,"id":"acc_o20o96lelkdkm3htp8000","type":"payment","date":"2022-08-27","description":"Zelle payment from Amador Abreu FTFWUBMGBSJY","category":"general"},{"status":"posted","amount":-3,"id":"acc_o20o96lelkdkm3htp8000","type":"fee","date":"2022-08-26","description":"NON-CHASE ATM FEE-WITH","category":""},{"status":"posted","amount":-62,"id":"acc_o20o96lelkdkm3htp8000","type":"atm","date":"2022-08-26","description":"NON-CHASE ATM WITHDRAW 688662 08/267829 LEAR","category":""},{"status":"posted","amount":-2600,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-08-26","description":"PL*WindermerePro WEB PMTS 24BM54 WEB ID: 9000292793","category":"general"},{"status":"posted","amount":0.15,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-08-26","description":"AMERICANEXPRESS ACCTVERIFY PPD ID: 124085066","category":"general"},{"status":"posted","amount":0.21,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-08-26","description":"AMERICANEXPRESS ACCTVERIFY PPD ID: 124085066","category":"general"},{"status":"posted","amount":67,"id":"acc_o20o96lelkdkm3htp8000","type":"payment","date":"2022-08-26","description":"Zelle payment from KARIN FRANCIS WFCT0QN7T34T","category":"general"},{"status":"posted","amount":711.54,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-08-23","description":"FID BKG SVC LLC MONEYLINE PPD ID: 0368504603","category":"loan"},{"status":"posted","amount":55,"id":"acc_o20o96lelkdkm3htp8000","type":"digital_payment","date":"2022-08-19","description":"Zelle payment from LEBNY JECSAN PARGAS 15084678211","category":""},{"status":"posted","amount":4072.12,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-08-19","description":"GOOGLE LLC PAYROLL PPD ID: J770493581","category":"software"},{"status":"posted","amount":-172.7,"id":"acc_o20o96lelkdkm3htp8000","type":"card_payment","date":"2022-08-14","description":"REVZILLA MOTORSPORTS 877-792-9455 PA 08/18","category":"general"},{"status":"posted","amount":-63.51,"id":"acc_o20o96lelkdkm3htp8000","type":"bill_payment","date":"2022-08-09","description":"Online Payment 15014497183 To ZIPLY FIBER 08/10","category":"general"},{"status":"posted","amount":-5500,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-08-09","description":"Payment to Chase card ending in 2886 08/10","category":"service"},{"status":"posted","amount":-239.65,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-08-07","description":"Payment to Chase card ending in 2886 08/08","category":"service"},{"status":"posted","amount":-510.12,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-08-07","description":"Payment to Chase card ending in 0422 08/08","category":"service"},{"status":"posted","amount":775.65,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-08-06","description":"Google LLC EDI PYMNTS PPD ID: W770493581","category":"software"},{"status":"posted","amount":-20,"id":"acc_o20o96lelkdkm3htp8000","type":"atm","date":"2022-08-05","description":"ATM WITHDRAWAL 003600 08/053110 WOBU","category":""},{"status":"posted","amount":-216.7,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-08-05","description":"DEPT EDUCATION STUDENT LN PPD ID: 9102001001","category":"general"},{"status":"posted","amount":4072.13,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-08-05","description":"GOOGLE LLC PAYROLL PPD ID: J770493581","category":"software"},{"status":"posted","amount":-127.82,"id":"acc_o20o96lelkdkm3htp8000","type":"transaction","date":"2022-08-04","description":"HAPO COM WEB ECM LOAN PAY 32643065 WEB ID: 1751553739","category":"general"},{"status":"posted","amount":-326.21,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-08-02","description":"LIGHTSTREAM LOAN PMTS 31810743 WEB ID: 1253108792","category":"general"},{"status":"posted","amount":1400,"id":"acc_o20o96lelkdkm3htp8000","type":"digital_payment","date":"2022-08-02","description":"Zelle payment from LEBNY JECSAN PARGAS 14956424914","category":""},{"status":"posted","amount":-194.26,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-08-01","description":"DISCOVER E-PAYMENT 3623 WEB ID: 2510020270","category":"service"},{"status":"posted","amount":-1152.93,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-07-29","description":"Payment to Chase card ending in 2886 07/29","category":"service"},{"status":"posted","amount":-964.56,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-07-29","description":"Payment to Chase card ending in 0422 07/29","category":"service"},{"status":"posted","amount":-238.53,"id":"acc_o20o96lelkdkm3htp8000","type":"bill_payment","date":"2022-07-26","description":"Online Payment 14897743722 To CITY OF REDMOND WA 07/26","category":"general"},{"status":"posted","amount":-2600,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-07-26","description":"PL*WindermerePro WEB PMTS LZNM24 WEB ID: 9000292793","category":"general"},{"status":"posted","amount":-100,"id":"acc_o20o96lelkdkm3htp8000","type":"atm","date":"2022-07-22","description":"ATM WITHDRAWAL 003052 07/221501 4TH","category":""},{"status":"posted","amount":4072.12,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-07-22","description":"GOOGLE LLC PAYROLL PPD ID: J770493581","category":"software"},{"status":"posted","amount":-40,"id":"acc_o20o96lelkdkm3htp8000","type":"atm","date":"2022-07-16","description":"ATM WITHDRAWAL 003487 07/161955 156T","category":""},{"status":"posted","amount":20.43,"id":"acc_o20o96lelkdkm3htp8000","type":"deposit","date":"2022-07-15","description":"Cash Redemption","category":""},{"status":"posted","amount":21.45,"id":"acc_o20o96lelkdkm3htp8000","type":"deposit","date":"2022-07-15","description":"Cash Redemption","category":""},{"status":"posted","amount":84.65,"id":"acc_o20o96lelkdkm3htp8000","type":"payment","date":"2022-07-13","description":"Zelle payment from JACOB FRANCIS WFCT0QKK65CM","category":"general"},{"status":"posted","amount":40,"id":"acc_o20o96lelkdkm3htp8000","type":"digital_payment","date":"2022-07-11","description":"Zelle payment from LEBNY JECSAN PARGAS 14788447327","category":""},{"status":"posted","amount":-63.51,"id":"acc_o20o96lelkdkm3htp8000","type":"bill_payment","date":"2022-07-08","description":"Online Payment 14766556277 To ZIPLY FIBER 07/08","category":"general"},{"status":"posted","amount":4131.59,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-07-08","description":"GOOGLE LLC PAYROLL PPD ID: J770493581","category":"software"},{"status":"posted","amount":-99.66,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-07-07","description":"DISCOVER E-PAYMENT 3623 WEB ID: 2510020270","category":"service"},{"status":"posted","amount":-127.82,"id":"acc_o20o96lelkdkm3htp8000","type":"transaction","date":"2022-07-06","description":"HAPO COM WEB ECM LOAN PAY 58442062 WEB ID: 1751553739","category":"general"},{"status":"posted","amount":-216.7,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-07-06","description":"DEPT EDUCATION STUDENT LN PPD ID: 9102001001","category":"general"},{"status":"posted","amount":-2.75,"id":"acc_o20o96lelkdkm3htp8000","type":"card_payment","date":"2022-07-04","description":"KC METRO TGT 206-5533000 WA 07/04","category":"transportation"},{"status":"posted","amount":-2.75,"id":"acc_o20o96lelkdkm3htp8000","type":"card_payment","date":"2022-07-04","description":"KC METRO TGT 206-5533000 WA 07/04","category":"transportation"},{"status":"posted","amount":15,"id":"acc_o20o96lelkdkm3htp8000","type":"digital_payment","date":"2022-07-03","description":"Zelle payment from LEBNY JECSAN PARGAS 14728333015","category":""},{"status":"posted","amount":-326.21,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-07-02","description":"LIGHTSTREAM LOAN PMTS 31336568 WEB ID: 1253108792","category":"general"},{"status":"posted","amount":-368.25,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-07-02","description":"WA STATE DOL WA ST DMV VS0000005677068 CCD ID: 9160010713","category":"general"},{"status":"posted","amount":500,"id":"acc_o20o96lelkdkm3htp8000","type":"digital_payment","date":"2022-07-02","description":"Zelle payment from LEBNY JECSAN PARGAS 14719087610","category":""},{"status":"posted","amount":-2600,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-07-01","description":"PL*WindermerePro WEB PMTS PQW104 WEB ID: 9000292793","category":"general"},{"status":"posted","amount":-330,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-06-29","description":"Payment to Chase card ending in 0422 06/29","category":"service"},{"status":"posted","amount":-1350,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-06-28","description":"Payment to Chase card ending in 2886 06/28","category":"service"},{"status":"posted","amount":-875.07,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-06-28","description":"Payment to Chase card ending in 0422 06/28","category":"service"},{"status":"posted","amount":225,"id":"acc_o20o96lelkdkm3htp8000","type":"transaction","date":"2022-06-28","description":"$225 for New Checking","category":""},{"status":"posted","amount":-3.25,"id":"acc_o20o96lelkdkm3htp8000","type":"card_payment","date":"2022-06-24","description":"SOUND TRANSIT TGT 206-5533000 WA 06/24","category":"transportation"},{"status":"posted","amount":-3.25,"id":"acc_o20o96lelkdkm3htp8000","type":"card_payment","date":"2022-06-24","description":"SOUND TRANSIT TGT 206-5533000 WA 06/24","category":"transportation"},{"status":"posted","amount":2446.48,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-06-24","description":"GOOGLE LLC PAYROLL PPD ID: J770493581","category":"software"},{"status":"posted","amount":13982.13,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-06-24","description":"GOOGLE LLC PAYROLL PPD ID: J770493581","category":"software"},{"status":"posted","amount":6800,"id":"acc_o20o96lelkdkm3htp8000","type":"deposit","date":"2022-06-24","description":"DEPOSIT ID NUMBER 73971","category":""},{"status":"posted","amount":500,"id":"acc_o20o96lelkdkm3htp8000","type":"payment","date":"2022-06-16","description":"Zelle payment from JACOB FRANCIS WFCT0QHWCLLX","category":"general"},{"status":"posted","amount":3500,"id":"acc_o20o96lelkdkm3htp8000","type":"payment","date":"2022-06-15","description":"Zelle payment from JACOB FRANCIS WFCT0QHT5WKZ","category":"general"},{"status":"posted","amount":40,"id":"acc_o20o96lelkdkm3htp8000","type":"digital_payment","date":"2022-06-13","description":"Zelle payment from LEBNY JECSAN PARGAS 14565520076","category":""},{"status":"posted","amount":-63.51,"id":"acc_o20o96lelkdkm3htp8000","type":"bill_payment","date":"2022-06-11","description":"Online Payment 14558453417 To ZIPLY FIBER 06/13","category":"general"},{"status":"posted","amount":-80,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-06-10","description":"PAYPAL INST XFER LESLIVERELLEN WEB ID: PAYPALSI77","category":"general"},{"status":"posted","amount":-216.7,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-06-07","description":"DEPT EDUCATION STUDENT LN PPD ID: 9102001001","category":"general"},{"status":"posted","amount":-193.5,"id":"acc_o20o96lelkdkm3htp8000","type":"card_payment","date":"2022-06-06","description":"WA DOL LIC & REG 59348 BELLEVUE WA 06/06","category":"tax"},{"status":"posted","amount":-127.82,"id":"acc_o20o96lelkdkm3htp8000","type":"transaction","date":"2022-06-06","description":"HAPO COM WEB ECM LOAN PAY 20604001 WEB ID: 1751553739","category":"general"},{"status":"posted","amount":25,"id":"acc_o20o96lelkdkm3htp8000","type":"check","date":"2022-06-06","description":"REMOTE ONLINE DEPOSIT # 1","category":""},{"status":"posted","amount":-0.56,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-06-03","description":"VANGUARD EDI PYMNTS PPD ID: 9231945930","category":"general"},{"status":"posted","amount":0.26,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-06-03","description":"VANGUARD EDI PYMNTS PPD ID: 9231945930","category":"general"},{"status":"posted","amount":0.3,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-06-03","description":"VANGUARD EDI PYMNTS PPD ID: 9231945930","category":"general"},{"status":"posted","amount":-10.81,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-06-02","description":"DISCOVER E-PAYMENT 3623 WEB ID: 2510020270","category":"service"},{"status":"posted","amount":-326.21,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-06-02","description":"LIGHTSTREAM LOAN PMTS 30800162 WEB ID: 1253108792","category":"general"},{"status":"posted","amount":2500,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-06-02","description":"WELLS FARGO IFI DDA TO DDA PPD ID: INTFITRVOS","category":"service"},{"status":"posted","amount":-280,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-06-01","description":"Payment to Chase card ending in 0422 06/01","category":"service"},{"status":"posted","amount":-1250,"id":"acc_o20o96lelkdkm3htp8000","type":"withdrawal","date":"2022-05-31","description":"WITHDRAWAL 05/31","category":""},{"status":"posted","amount":-2600,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-05-31","description":"PL*WindermerePro WEB PMTS F79XW3 WEB ID: 9000292793","category":"general"},{"status":"posted","amount":-470.48,"id":"acc_o20o96lelkdkm3htp8000","type":"transfer","date":"2022-05-31","description":"Payment to Chase card ending in 2886 05/31","category":"service"},{"status":"posted","amount":-0.2,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-05-27","description":"PAYPAL VERIFYBANK PPD ID: PAYPALRD33","category":"service"},{"status":"posted","amount":-0.21,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-05-27","description":"NATL FIN SVC LLC EFT PPD ID: 1035141383","category":"general"},{"status":"posted","amount":-0.83,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-05-27","description":"WELLS FARGO IFI TRIAL DEP TD0FFTHDQL WEB ID: INTFIDTVOS","category":"service"},{"status":"posted","amount":0.03,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-05-27","description":"PAYPAL VERIFYBANK PPD ID: PAYPALRD33","category":"service"},{"status":"posted","amount":0.06,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-05-27","description":"NATL FIN SVC LLC EFT PPD ID: 1035141375","category":"general"},{"status":"posted","amount":0.15,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-05-27","description":"NATL FIN SVC LLC EFT PPD ID: 1035141375","category":"general"},{"status":"posted","amount":0.17,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-05-27","description":"PAYPAL VERIFYBANK PPD ID: PAYPALRD33","category":"service"},{"status":"posted","amount":0.37,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-05-27","description":"WELLS FARGO IFI TRIAL DEP PPD ID: INTFIDTVOS","category":"service"},{"status":"posted","amount":0.46,"id":"acc_o20o96lelkdkm3htp8000","type":"ach","date":"2022-05-27","description":"WELLS FARGO IFI TRIAL DEP PPD ID: INTFIDTVOS","category":"service"},{"status":"posted","amount":12000,"id":"acc_o20o96lelkdkm3htp8000","type":"deposit","date":"2022-05-26","description":"DEPOSIT ID NUMBER 788537","category":""}]');

sampleTransactions.forEach((item) => {
  item.accountId = item.id;
  //@ts-ignore
  item.id = crypto.randomUUID();
});