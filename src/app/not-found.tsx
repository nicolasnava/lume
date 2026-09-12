import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Home } from 'lucide-react'

export default function RootNotFound() {
  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col justify-between selection:bg-[#B8A9D9]/30 relative overflow-hidden">
      {/* Elementos decorativos de fundo com iluminação suave */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#B8A9D9]/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-80 h-80 rounded-full bg-[#B8A9D9]/15 blur-3xl pointer-events-none" />

      {/* Topo com Logo alinhada no canto superior direito */}
      <header className="w-full px-6 sm:px-10 py-6 z-10 flex justify-end">
        <Link href="/" className="inline-block group">
          <Image
            src="/logo.png"
            alt="Lumê"
            width={110}
            height={34}
            className="max-h-8 sm:max-h-9 w-auto object-contain transition-transform group-hover:scale-105"
            priority
          />
        </Link>
      </header>

      {/* Conteúdo Central Conectado e Harmonioso */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 z-10">
        <div className="w-full max-w-lg text-center space-y-4 sm:space-y-5">
          {/* Número 404 limpo no padrão com a cor Lumê */}
          <div className="relative select-none my-1 flex items-center justify-center">
            <span className="font-black tracking-tighter leading-none text-[110px] sm:text-[150px] md:text-[180px] text-[#B8A9D9] transition-transform duration-300 hover:scale-105 inline-block cursor-default">
              404
            </span>
          </div>

          {/* Textos limpos sem fundo e sem ícones de sparkles */}
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#4A3F5C]/80">
              Ops! Página não encontrada
            </p>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#4A3F5C] tracking-tight">
              Parece que nos perdemos no caminho
            </h1>

            <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
              O endereço que você tentou acessar não existe, mudou de lugar ou foi removido. Mas não se preocupe, você pode voltar para onde estava:
            </p>
          </div>

          {/* Botões de Ação Integrados */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#B8A9D9] hover:bg-[#a695ca] text-xs font-bold text-[#4A3F5C] shadow-xs hover:shadow-md transition cursor-pointer"
            >
              <Home className="h-4 w-4" />
              <span>Voltar para o Início</span>
            </Link>

            <Link
              href="/dashboard/geral"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-gray-50 text-xs font-bold text-[#4A3F5C] border border-[#B8A9D9]/40 hover:border-[#B8A9D9] shadow-2xs transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Ir para a Minha Agenda</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Rodapé Minimalista */}
      <footer className="w-full text-center py-6 text-xs text-[#4A3F5C]/60 z-10">
        <p>Lumê — A plataforma pensada para profissionais da beleza</p>
      </footer>
    </div>
  )
}
