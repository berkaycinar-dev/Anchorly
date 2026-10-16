import { useLocation } from "react-router";

export default function LocationProbe() {
  const location = useLocation();

  return (
    <span hidden data-testid="location">
      {location.pathname}
    </span>
  );
}