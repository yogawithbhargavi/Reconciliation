interface SectionProps {
  title?: string;
  caption?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Section({ title, caption, children, className = '' }: SectionProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
          {caption && <p className="text-sm text-gray-500">{caption}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
