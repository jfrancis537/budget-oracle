import React from "react";

interface ICurrencyProps {
  symbol?: string;
  amount: number;
  tag?: keyof HTMLElementTagNameMap;
  onclick?: () => void;
  color?: CurrencyColorMode;
}

export enum CurrencyColorMode {
  Auto,
  Negative,
  Positive,
  Neutral
}

export const Currency: React.FC<ICurrencyProps> = (props) => {
  const tag = props.tag ?? 'div';
  const mode = props.color ?? CurrencyColorMode.Auto;

  function getColor() {
    let color = undefined;
    switch (mode) {
      case CurrencyColorMode.Auto:
        color = props.amount >= 0 ? 'rgb(113, 254, 117)' : props.amount <= 0 ? '#e76d6d' : undefined;
        break;
      case CurrencyColorMode.Positive:
        color = `rgb(113, 254, 117)`;
        break;
      case CurrencyColorMode.Negative:
        color = '#e76d6d'
        break;
      case CurrencyColorMode.Neutral:
      default:
        break;
    }
    return color;
  }

  return React.createElement(tag, {
    onClick: props.onclick,
    style: { color: getColor() },
    children: [props.symbol ?? '$', Math.abs(props.amount).toFixed(2)]
  })
}