interface IDividerProps {
  color?: string;
  margin?: number;
  visible?: boolean;
}

export const Divider: React.FC<IDividerProps> = (props) => {
  return (
    <div
      style={
        {
          color: props.color ?? "white",
          borderBottom: "solid 1px",
          height: "0px",
          margin: `${props.margin ?? 20}px 0px`,
          display: !!props.visible ? undefined : "none"
        }
      }
    />
  )
}