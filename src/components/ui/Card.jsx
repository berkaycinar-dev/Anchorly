function Card({ className = "", children, ...rest }) {
  return (
    <div {...rest} className={className ? `ui-card ${className}` : "ui-card"}>
      {children}
    </div>
  );
}

export default Card;
