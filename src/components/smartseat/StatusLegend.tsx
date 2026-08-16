const items = [
  { label: "Available", className: "bg-available" },
  { label: "Occupied", className: "bg-occupied" },
  { label: "On break", className: "bg-onbreak" },
  { label: "Your seat", className: "bg-primary" },
];

export function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className={`size-2.5 rounded-full ${item.className}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
