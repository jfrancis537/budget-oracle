import React from "react";

interface ICurrencyProps {
  symbol?: string;
  amount: number;
  tag?: keyof HTMLElementTagNameMap;
  onclick?: () => void
}

export const Currency: React.FC<ICurrencyProps> = (props) => {
  const tag = props.tag ?? 'div';
  const color = props.amount >= 0 ? 'rgb(113, 254, 117)' : props.amount <= 0 ? '#e76d6d' : undefined;

  return React.createElement(tag, {
    onClick: props.onclick,
    style: { color },
    children: [props.symbol ?? '$',Math.abs(props.amount).toFixed(2)]
  })
}