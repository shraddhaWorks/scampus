import { Award, Download } from "lucide-react";

type Certificate = {
  id: string;
  title: string;
  issuedDate: string;
  issuedBy: string | null;
  certificateUrl: string | null;
};

type Props = {
  certificates?: Certificate[];
};

export const Certificates = ({ certificates = [] }: Props) => {
  const displayData = certificates.length > 0 ? certificates : [];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 sm:p-8 shadow-2xl overflow-hidden min-w-0">
      <h3 className="text-xl font-semibold flex items-center gap-3 mb-6 sm:mb-10 text-white">
        <Award className="w-6 h-6 text-[#b4f44d] flex-shrink-0" />
        Certificates
      </h3>
      
      {displayData.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-sm">No certificates</div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {displayData.map((c) => (
          <div
            key={c.id}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 flex justify-between items-center transition-all hover:bg-white/10"
          >
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-[#b4f44d]/10 rounded-xl flex items-center justify-center text-[#b4f44d]">
                <Award size={24} />
              </div>
              <div>
                <p className="text-base font-bold text-white leading-tight">{c.title}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Issued on {new Date(c.issuedDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <a
              href={c.certificateUrl ?? "#"}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#b4f44d] p-2 transition-colors touch-manipulation min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
              aria-label="Download"
            >
              <Download size={20} />
            </a>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};