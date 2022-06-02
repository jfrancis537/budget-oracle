import { useState } from "react";
import { Button, ListGroup, Modal, ModalBody, ModalFooter } from "react-bootstrap";
import { LinkedAccountDetails } from "../../APIs/TellerAPI";
import { LoadingButton } from "./LoadingButton";

interface ILinkedAccountPromptProps {
  accountsToLink: LinkedAccountDetails[]
  processAccept: (selected: LinkedAccountDetails[]) => Promise<void>;
  handleCloseRequested: () => void;
}

export const LinkedAccountPrompt: React.FC<ILinkedAccountPromptProps> = (props) => {

  const [selected, setSelected] = useState(new Set(props.accountsToLink));
  const [loading, setLoading] = useState(false);

  function close() {
    props.handleCloseRequested();
  }

  async function accept() {
    setLoading(true);
    try {
      await props.processAccept([...selected]);
      props.handleCloseRequested();
    } catch {
      //TODO show an error
    } finally {
      setLoading(false);
    }
  }

  function renderAccount(details: LinkedAccountDetails) {
    return (
      <ListGroup.Item
        key={details.id}
        active={selected.has(details)}
        onClick={() => {
          if (selected.has(details)) {
            selected.delete(details);
          } else {
            selected.add(details);
          }
          setSelected(new Set([...selected]));
        }}
      >
        {`${details.name} : (${details.lastFour})`}
      </ListGroup.Item>
    )
  }

  function render() {
    return (
      <Modal
        show={!!props.accountsToLink && props.accountsToLink.length > 0}
      >
        <Modal.Header>
          <Modal.Title>Select Accounts to Link</Modal.Title>
        </Modal.Header>
        <ModalBody>
          <ListGroup>
            {props.accountsToLink.map(renderAccount)}
          </ListGroup>
        </ModalBody>
        <ModalFooter>
          <LoadingButton variant="primary" onClick={accept} isLoading={loading}>Accept</LoadingButton>
          <Button variant="secondary" onClick={close}>Cancel</Button>
        </ModalFooter>
      </Modal>
    )
  }

  return render();
}