import React from "react";
import divStyles from "./AnimatedHeightDiv.module.css";

interface IAnimatedHeightDivProps extends React.PropsWithChildren{
  open?: boolean
}

export class AnimatedHeightDiv extends React.Component<IAnimatedHeightDivProps> {

  private element: React.RefObject<HTMLDivElement>;

  constructor(props: {}) {
    super(props);
    this.element = React.createRef();
  }

  componentDidUpdate(oldProps: IAnimatedHeightDivProps) {
    if (oldProps.open !== this.props.open) {
      this.toggle();
    }
  }

  private toggle() {
    let element = this.element.current;
    if (element) {
      //On open

      element.style.height = "";
      element.style.transition = "none";

      const startHeight = window.getComputedStyle(element).height;
      element.classList.toggle(divStyles.collapsed);
      const endHeight = window.getComputedStyle(element).height;
      element.style.height = startHeight;
      requestAnimationFrame(() => {
        element!.style.transition = '';
        requestAnimationFrame(() => {
          element!.style.height = endHeight;
        });
      });

      const resetHeight = () => {
        element!.style.height = "";
        element!.removeEventListener("transitionend", resetHeight);
      }
      element.addEventListener('transitionend', resetHeight);
    }

  }

  public render() {
    return (
      <div className={`${divStyles.collapsible} ${divStyles.collapsed}`} ref={this.element}>{this.props.children}</div>
    )
  }
}