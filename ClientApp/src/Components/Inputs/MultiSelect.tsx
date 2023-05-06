import { useState } from "react";
import { Dropdown, DropdownButton } from "react-bootstrap";

import styles from "../../styles/MultiSelect.module.css";

interface IMultiSelectProps {
  values: string[];
  title: string;
  selectedValues?: 'none' | 'all' | string[];
  className?: string;
  onValuesChanged?: (values: string[]) => void;
  variant?: string;
}

export const MultiSelect: React.FC<IMultiSelectProps> = (props) => {
  let defaultValues: Set<string> = new Set();
  if(props.selectedValues)
  {
    if(props.selectedValues === 'all')
    {
      defaultValues = new Set(props.values);
    } else if(typeof props.selectedValues === 'object')
    {
      defaultValues = new Set(props.selectedValues);
    }
  }
  const [selectedValues, setSelectedValues] = useState<Set<string>>(defaultValues);

  function handleOptionClicked(event: React.MouseEvent<HTMLElement> ,option: string)
  {
    event.preventDefault();
    event.stopPropagation();
    selectedValues.has(option) ? selectedValues.delete(option) : selectedValues.add(option);
    const values = [...selectedValues];
    setSelectedValues(new Set(values));
    if(props.onValuesChanged)
    {
      props.onValuesChanged(values);
    }
  }

  function generateOptions() {
    const nodes: JSX.Element[] = [];
    for(const option of props.values)
    {
      nodes.push(
        <Dropdown.Item key={option} className={styles.item} onClick={(e) => handleOptionClicked(e,option)}>
          <input readOnly type='checkbox' checked={selectedValues.has(option)}/>
          <span>{option}</span>
        </Dropdown.Item>
      );
    }
    return nodes;
  }

  function render() {
    return (
      <DropdownButton variant={props.variant} title={props.title} className={props.className}>
        {generateOptions()}
      </DropdownButton>
    );
  }

  return render();
}