import { WhatsAppIcon } from "./icons/WhatsAppIcon";

const WhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/971588251088"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[hsl(142,70%,40%)] text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
      aria-label="Chat on WhatsApp"
    >
      <WhatsAppIcon className="w-6 h-6" />
    </a>
  );
};

export default WhatsAppButton;
