import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import booksImage from '@/assets/old-books.jpg';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed flex flex-col items-center justify-center px-4 relative"
      style={{
        backgroundImage: `url(${booksImage})`,
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Animated Book Icon */}
        <div className="mb-8 flex justify-center">
          <div className="animate-bounce">
            <BookOpen className="w-24 h-24 text-amber-900 drop-shadow-lg" />
          </div>
        </div>

        {/* Title with fade-in animation */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in drop-shadow-lg">
          Online Ebook Reader
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-slate-100 mb-8 animate-fade-in animation-delay-1000 drop-shadow-lg">
          Discover and read your favorite books anytime, anywhere
        </p>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in animation-delay-2000">
          <Button
            size="lg"
            variant="outline"
            className="px-8 py-6 text-lg rounded-lg border-2 border-slate-400 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-300"
            onClick={() => navigate('/library')}
          >
            Get Started
          </Button>
          <Button
            size="lg"
            className="bg-amber-700 hover:bg-amber-800 text-white px-8 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
        </div>
      </div>

      {/* Add keyframe animations via style tag */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        .animation-delay-1000 {
          animation-delay: 0.3s;
        }

        .animation-delay-2000 {
          animation-delay: 0.6s;
        }
      `}</style>
    </div>
  );
}
