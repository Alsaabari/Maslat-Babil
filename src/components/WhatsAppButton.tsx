import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WhatsAppIcon, type CommContext } from "@/components/CommunicationCenter";
import { useState } from "react";
import CommunicationCenter from "@/components/CommunicationCenter";

/** زر WhatsApp الموحد — أيقونة فقط مع Tooltip، يفتح مركز التواصل */
export default function WhatsAppButton({
  context,
  disabledReason,
}: {
  context: CommContext;
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);
  const disabled = !!disabledReason;
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) setOpen(true);
            }}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
              disabled
                ? "text-muted-foreground/40 cursor-not-allowed"
                : "text-[#1e9e6a] hover:bg-[#1e9e6a]/10"
            }`}
            aria-label="مراسلة عبر WhatsApp"
          >
            <WhatsAppIcon className="h-4.5 w-4.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{disabledReason ?? "مراسلة عبر WhatsApp"}</TooltipContent>
      </Tooltip>
      <CommunicationCenter open={open} onClose={() => setOpen(false)} context={context} />
    </>
  );
}
