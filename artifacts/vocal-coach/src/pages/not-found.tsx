import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-display font-bold text-white mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Esta frequência está fora do alcance.</p>
      <Link href="/" className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors">
        Voltar ao Painel
      </Link>
    </div>
  );
}
