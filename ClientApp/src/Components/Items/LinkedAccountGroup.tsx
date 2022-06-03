import { Card } from "react-bootstrap";
import { LinkedAccountDetails } from "../../APIs/TellerAPI";

import groupStyles from '../../styles/Group.module.css';
import { LinkedAccountItem } from "./LinkedAccountItem";

interface LinkedAccountGroupProps {
  name: string;
  accounts: LinkedAccountDetails[];
}

export const LinkedAccountGroup: React.FC<LinkedAccountGroupProps> = (props) => {

  function renderAccount(linkedAccount: LinkedAccountDetails) {
    return (
      <LinkedAccountItem account={linkedAccount} key={linkedAccount.id} />
    )
  }

  function render() {
    return (
      <Card className={groupStyles['card']} bg='dark' text='light'>
        <Card.Header className={groupStyles['header']}>
          <div className={groupStyles['group-title']}>{props.name}</div>
        </Card.Header>
        <Card.Body className={groupStyles['items']}>
          {[...props.accounts].map(renderAccount)}
        </Card.Body>
      </Card>
    );
  }

  return render();
}