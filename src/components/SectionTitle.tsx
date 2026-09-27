interface SectionTitleProps {
  title: string;
  action?: React.ReactNode;
}

export default function SectionTitle({ title, action }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-base font-bold text-navy-900">{title}</h3>
      {action}
    </div>
  );
}
