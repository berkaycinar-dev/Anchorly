import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import Icon from "../Icon";

const TONES = {
  danger: { icon: CircleAlert, role: "alert" },
  success: { icon: CircleCheck, role: "status" },
  warning: { icon: TriangleAlert, role: "status" },
  info: { icon: Info, role: "status" },
};

function Alert({ tone = "info", actions, className = "", children }) {
  const { icon, role } = TONES[tone];
  const classes = ["alert", `alert-${tone}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role={role}>
      <Icon icon={icon} size="lg" className="alert-icon" />
      <div className="alert-body">
        <div className="alert-message">{children}</div>
        {actions ? <div className="alert-actions">{actions}</div> : null}
      </div>
    </div>
  );
}

export default Alert;
