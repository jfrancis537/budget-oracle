import React from "react"
import { Button, FormControl, InputGroup, Modal } from "react-bootstrap"
import { GroupManager, GroupType } from "../../Processing/Managers/GroupManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { LoadingButton } from "./LoadingButton";

export interface IGroupPromptProps {
  editing: boolean;
  groupToEdit?: [GroupType, string];
}

interface GroupPromptState {
  name: string;
  groupType: GroupType;
  isSaving: boolean;
}

export class GroupPrompt extends React.Component<IGroupPromptProps, GroupPromptState> {

  constructor(props: IGroupPromptProps) {
    super(props);

    if (this.props.editing) {
      if (this.props.groupToEdit && GroupManager.hasGroup(...this.props.groupToEdit)) {
        const [type, name] = this.props.groupToEdit;
        this.state = {
          groupType: type,
          name: name,
          isSaving: false
        };
      } else {
        throw new Error('If editing is enabled, you must select the group to edit');
      }
    } else {
      this.state = {
        name: '',
        groupType: GroupType.Bill,
        isSaving: false
      };
    }

    this.accept = this.accept.bind(this);
    this.cancel = this.cancel.bind(this);
    this.handleNameChanged = this.handleNameChanged.bind(this);
    this.handleGroupTypeChanged = this.handleGroupTypeChanged.bind(this);
  }

  private async accept() {
    this.setState({
      isSaving: true
    });
    if (!this.props.editing) {
      await GroupManager.addGroup(this.state.name, this.state.groupType);
    } else {
      let oldName = this.props.groupToEdit![1];
      await GroupManager.updateGroup(this.state.groupType, oldName, this.state.name);
    }
    this.setState({
      isSaving: false
    });
    PromptManager.requestClosePrompt();
  }

  private cancel() {
    PromptManager.requestClosePrompt();
  }

  private handleNameChanged(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      name: event.target.value
    });
  }

  private handleGroupTypeChanged(event: React.ChangeEvent<HTMLSelectElement>) {
    this.setState({
      groupType: (Number(event.target.value) as GroupType)
    });
  }

  private checkNameValid() {
    if (this.props.editing) {
      let exists = GroupManager.hasGroup(this.state.groupType, this.state.name);
      let isStartingName = this.state.name === this.props.groupToEdit![1];
      return isStartingName || !exists;
    } else {
      return !GroupManager.hasGroup(this.state.groupType, this.state.name);
    }
  }

  private acceptEnabled() {
    let result = this.state.name !== '';
    if (this.props.editing) {
      let isStartingName = this.state.name === this.props.groupToEdit![1];
      result = !isStartingName && result;
    }
    return result && this.checkNameValid() && !this.state.isSaving;
  }

  render() {
    return (
      <Modal
        show
        onHide={this.cancel}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>{this.props.editing ? "Update" : "Add"} Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InputGroup className="mb-3" hasValidation>
            <FormControl
              placeholder="Group Name"
              aria-label="group name"
              onChange={this.handleNameChanged}
              value={this.state.name}
              isInvalid={!this.checkNameValid()}
            />
            <FormControl.Feedback type="invalid">Group already exists!</FormControl.Feedback>
          </InputGroup>
          <InputGroup className="mb-3">
            <FormControl
              as='select'
              onChange={this.handleGroupTypeChanged}
              value={this.state.groupType}
              disabled={this.props.editing}
            >
              <option value={GroupType.Bill}>Bill</option>
              <option value={GroupType.Debt}>Debt</option>
            </FormControl>
          </InputGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.cancel}>
            Cancel
          </Button>
          <LoadingButton isLoading={this.state.isSaving} loadingText="Saving..." variant="primary" onClick={this.accept} disabled={!this.acceptEnabled()}>
            {this.props.editing ? "Update" : "Add"}
          </LoadingButton>
        </Modal.Footer>
      </Modal>
    )
  }
}