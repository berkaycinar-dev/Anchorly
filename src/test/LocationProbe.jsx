import { useLocation } from "react-router";

export default function LocationProbe() {
  const location = useLocation();

  return (
    <span
      hidden
      data-testid="location"
      data-hash={location.hash}
      data-search={location.search}
    >
      {location.pathname}
    </span>
  );
}
