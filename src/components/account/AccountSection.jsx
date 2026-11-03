import { useId } from "react";
import Card from "../ui/Card";

function AccountSection({ title, description, tone, children }) {
  const headingId = useId();

  return (
    <Card
      className="account-section"
      data-tone={tone}
      role="region"
      aria-labelledby={headingId}
    >
      <div className="account-section-heading">
        <h3 id={headingId} className="account-section-title">
          {title}
        </h3>
        {description ? (
          <p className="account-section-description">{description}</p>
        ) : null}
      </div>
      {children}
    </Card>
  );
}

export default AccountSection;
