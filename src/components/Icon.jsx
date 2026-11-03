const ICON_SIZES = { sm: 16, md: 18, lg: 20 };
const ICON_STROKE_WIDTH = 1.75;

function Icon({ icon: Glyph, size = "md", label, className }) {
  const accessibility = label
    ? { role: "img", "aria-label": label }
    : { focusable: "false" };

  return (
    <Glyph
      size={ICON_SIZES[size]}
      strokeWidth={ICON_STROKE_WIDTH}
      className={className}
      {...accessibility}
    />
  );
}

export default Icon;
