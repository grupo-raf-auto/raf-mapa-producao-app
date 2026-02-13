import { Sparkles } from 'lucide-react';
import { useSupportChat } from '@/contexts/support-chat-context';
import { Image } from '@/lib/router-compat';

export function SidebarSupportChat() {
  const support = useSupportChat();
  const openChat = support?.openChat;

  return (
    <div className="px-4 pb-6 shrink-0">
      <div
        role="button"
        tabIndex={0}
        onClick={() => openChat?.()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && e.preventDefault() && openChat?.()}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-colors cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center group-hover:bg-black/90 transition-colors p-1.5 border border-slate-800">
            <Image
              src="/LogoMySabischao.png"
              alt="MySabichão"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Assistente RAF</p>
            <p className="text-xs text-white/60">Suporte inteligente</p>
          </div>
        </div>
        <div className="w-full flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-red-900 text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
          <Sparkles className="w-4 h-4" />
          Iniciar Conversa
        </div>
      </div>
    </div>
  );
}
