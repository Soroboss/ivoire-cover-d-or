import React from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_DOMAIN, APP_NAME, APP_TAGLINE, APP_EMAIL } from '../lib/appConfig';
import { 
  Egg, 
  ChevronRight, 
  ShieldCheck, 
  TrendingUp, 
  Smartphone, 
  Settings, 
  CheckCircle2, 
  ArrowRight,
  Target,
  Users,
  BarChart3
} from 'lucide-react';

import heroImage from '../assets/hero.png';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-brand-dark overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
              </div>
              <span className="text-xl font-display font-bold bg-gradient-to-r from-brand-orange to-brand-orange-glow bg-clip-text text-transparent uppercase tracking-tight">
                Ivoire Couvée d'Or
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#expertise" className="text-sm font-medium text-slate-600 hover:text-brand-orange transition-colors">Notre Expertise</a>
              <a href="#processus" className="text-sm font-medium text-slate-600 hover:text-brand-orange transition-colors">Le Processus</a>
              <a href="#pourquoi" className="text-sm font-medium text-slate-600 hover:text-brand-orange transition-colors">Pourquoi Nous</a>
            </div>

            <div>
              <button 
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 bg-brand-orange text-white px-6 py-2.5 rounded-full font-semibold shadow-soft hover:bg-brand-hover transition-all active:scale-95 text-sm"
              >
                Accéder au Portail
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[500px] h-[500px] bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-brand-orange/10 text-brand-orange px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
                <Target className="w-4 h-4" />
                Leader de l'aviculture moderne en Côte d'Ivoire
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-slate-900 leading-[1.1] mb-6">
                L'excellence avicole <br />
                <span className="text-brand-orange">propulsée par l'IA</span>
              </h1>
              <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Transformez votre rentabilité avec notre système intelligent de couvaison. 
                Une précision chirurgicale, une traçabilité totale et des conseils d'experts automatisés.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button 
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 py-4 bg-brand-orange text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-glow-orange hover:bg-brand-hover transition-all"
                >
                  Démarrer Votre Production
                  <ArrowRight className="w-5 h-5" />
                </button>
                <a 
                  href="#expertise" 
                  className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                >
                  Découvrir nos services
                </a>
              </div>
              
              <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 pt-8 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-slate-900">98%</span>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Satisfaction Client</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-slate-900">+50k</span>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Poussins / mois</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-slate-900">24/7</span>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Suivi Intelligent</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                <img 
                  src={heroImage} 
                  alt="Production Avicole Moderne" 
                  className="w-full h-auto object-cover"
                />
              </div>
              {/* Floating badges */}
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3 animate-bounce">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Performance</p>
                  <p className="text-sm font-bold text-slate-900">+21% de succès</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center text-brand-orange">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Notifications</p>
                  <p className="text-sm font-bold text-slate-900">Alertes WhatsApp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section id="expertise" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base font-bold text-brand-orange uppercase tracking-[0.2em] mb-3">Notre Expertise</h2>
            <h3 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 mb-4">
              Une solution complète pour chaque aviculteur
            </h3>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Que vous soyez un producteur établi ou que vous lanciez votre activité, 
              nos services sont conçus pour maximiser vos résultats dès le premier jour.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-soft hover:shadow-soft-lg transition-all group">
              <div className="w-14 h-14 bg-brand-orange/10 rounded-2xl flex items-center justify-center text-brand-orange mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Service de Couvaison B2B</h4>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Apportez vos œufs et confiez-nous le reste. Nous utilisons des incubateurs de dernière génération 
                avec un suivi précis par tiroir et des alertes automatiques pour les mirages et éclosions.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-brand-orange" /> Traçabilité individuelle par tiroir
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-brand-orange" /> Rapports détaillés automatisés
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-brand-orange" /> Tarification transparente et fixe
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-soft hover:shadow-soft-lg transition-all group">
              <div className="w-14 h-14 bg-brand-orange/10 rounded-2xl flex items-center justify-center text-brand-orange mb-6 group-hover:scale-110 transition-transform">
                <Egg className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Vente de Poussins & Élevage</h4>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Nous produisons et vendons des poussins de haute qualité (Poules, Pintades, Dindes, etc.). 
                Bénéficiez de souches sélectionnées pour leur résistance et leur croissance rapide.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-brand-orange" /> Souches premium sélectionnées
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-brand-orange" /> Planning de livraisons régulières
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-brand-orange" /> Accompagnement post-achat
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Processus Section */}
      <section id="processus" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base font-bold text-brand-orange uppercase tracking-[0.2em] mb-3">Le Processus</h2>
            <h3 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 mb-4">
              Une rigueur scientifique à chaque étape
            </h3>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Notre système gère l'ensemble du cycle de vie de vos œufs avec une automatisation 
              poussée pour garantir les meilleurs taux d'éclosion du marché.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
            
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
              {[
                { title: 'Réception', icon: <Target className="w-6 h-6" />, desc: 'Enregistrement précis et attribution de tiroir.' },
                { title: 'Couvaison', icon: <Settings className="w-6 h-6" />, desc: 'Contrôle constant de température et humidité.' },
                { title: 'Mirage (J14)', icon: <BarChart3 className="w-6 h-6" />, desc: 'Analyse de fertilité et rapports WhatsApp.' },
                { title: 'Éclosion', icon: <Egg className="w-6 h-6" />, desc: 'Surveillance rapprochée 24/7 de la naissance.' },
                { title: 'Livraison', icon: <CheckCircle2 className="w-6 h-6" />, desc: 'Remise des poussins et conseils professionnels.' },
              ].map((step, idx) => (
                <div key={idx} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft flex flex-col items-center text-center group hover:-translate-y-2 transition-transform">
                  <div className="w-12 h-12 rounded-full bg-brand-orange text-white flex items-center justify-center font-bold mb-4 shadow-glow-orange group-hover:scale-110 transition-transform">
                    {idx + 1}
                  </div>
                  <div className="w-12 h-12 bg-brand-orange/5 rounded-xl flex items-center justify-center text-brand-orange mb-4">
                    {step.icon}
                  </div>
                  <h5 className="font-bold text-slate-900 mb-2">{step.title}</h5>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pourquoi Nous Section */}
      <section id="pourquoi" className="py-24 bg-brand-dark relative overflow-hidden">
        {/* Background Mesh */}
        <div className="absolute inset-0 bg-mesh-dark opacity-40 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-base font-bold text-brand-orange uppercase tracking-[0.2em] mb-4">Pourquoi Nous Faire Confiance?</h2>
              <h3 className="text-4xl lg:text-5xl font-display font-extrabold text-white mb-8 leading-tight">
                La technologie au service de <br />
                <span className="text-brand-orange">votre sérénité</span>
              </h3>
              
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-brand-orange-glow">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">Sécurité & Transparence</h4>
                    <p className="text-slate-300">
                      Chaque tiroir est tracé. Vous recevez des rapports précis à chaque étape. 
                      Aucune confusion possible, aucun oubli.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-brand-orange-glow">
                    <Smartphone className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">Intelligence Avancée</h4>
                    <p className="text-slate-300">
                      Notre IA analyse les causes d'échec et vous donne des recommandations concrètes 
                      pour améliorer vos futurs taux d'éclosion.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-brand-orange-glow">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">Rentabilité Maximisée</h4>
                    <p className="text-slate-300">
                      Réduisez vos pertes de 10 à 15% grâce à notre expertise technique et notre 
                      système de monitoring en temps réel.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-10 rounded-4xl">
              <div className="text-center mb-8">
                <h4 className="text-2xl font-bold text-white mb-2">Prêt à moderniser votre ferme?</h4>
                <p className="text-slate-400">Rejoignez la communauté d'aviculteurs professionnels qui nous font déjà confiance.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl flex items-center gap-4">
                  <div className="w-3 h-3 bg-brand-orange rounded-full animate-pulse" />
                  <span className="text-slate-200 text-sm">Gestion des stocks en temps réel</span>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-slate-200 text-sm">Analyses IA de performance</span>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl flex items-center gap-4 text-left">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-slate-200 text-sm">Multi-utilisateurs (Marie, Fatou...)</span>
                </div>
              </div>

              <button 
                onClick={() => navigate('/login')}
                className="w-full mt-10 py-5 bg-brand-orange text-white rounded-2xl font-bold text-lg hover:bg-brand-hover shadow-glow-orange transition-all"
              >
                Accéder à mon espace personnel
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-slate-900 leading-tight">{APP_NAME}</span>
                <span className="text-xs text-slate-500 font-medium">{APP_TAGLINE}</span>
              </div>
            </div>

            <div className="flex gap-8 text-sm font-medium text-slate-500">
              <a href="#" className="hover:text-brand-orange transition-colors">Politique de confidentialité</a>
              <a href={`mailto:${APP_EMAIL}`} className="hover:text-brand-orange transition-colors">Support technique</a>
              <a href={APP_DOMAIN} className="hover:text-brand-orange transition-colors font-bold text-brand-orange">
                🌐 {APP_DOMAIN.replace('https://', '')}
              </a>
            </div>

            <div className="text-sm text-slate-400">
              © 2026 {APP_NAME}. Par Soroboss Impact.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
