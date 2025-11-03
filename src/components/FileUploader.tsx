import { Upload } from 'lucide-react';

interface FileUploaderProps {
  label: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
}

export default function FileUploader({ label, hint, file, onChange, accept = '.csv' }: FileUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onChange(selectedFile);
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-1 min-w-[260px]">
      <div className="text-sm font-semibold text-gray-700 mb-3">{label}</div>
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
        <Upload className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-xs text-gray-600 mb-1">
          {file ? 'Change file' : 'Click to upload'}
        </span>
        <span className="text-[0.65rem] text-gray-400">{accept}</span>
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
      {file && (
        <div className="mt-3 inline-block bg-sky-100 text-sky-700 text-xs font-medium px-3 py-1.5 rounded-full border border-sky-300 max-w-full truncate">
          {file.name}
        </div>
      )}
      <div className="text-[0.7rem] text-gray-500 mt-2">{hint}</div>
    </div>
  );
}
