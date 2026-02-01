import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  Award, 
  Sparkles,
  CheckCircle2,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
  type: 'verified' | 'pending' | 'confidence' | 'expert' | 'purchase' | 'rating';
  value?: string | number;
  className?: string;
}

export default function TrustBadge({ type, value, className }: TrustBadgeProps) {
  const badges = {
    verified: {
      icon: ShieldCheck,
      label: 'Verified',
      className: 'trust-badge-verified'
    },
    pending: {
      icon: Clock,
      label: 'Pending Verification',
      className: 'trust-badge-pending'
    },
    confidence: {
      icon: Sparkles,
      label: `${value}% AI Confidence`,
      className: 'trust-badge-high-confidence'
    },
    expert: {
      icon: Award,
      label: 'Expert Endorsed',
      className: 'bg-accent/10 text-accent-foreground'
    },
    purchase: {
      icon: CheckCircle2,
      label: 'Verified Purchase',
      className: 'bg-green-500/10 text-green-700'
    },
    rating: {
      icon: Star,
      label: `${value} Rating`,
      className: 'bg-amber-500/10 text-amber-700'
    }
  };

  const badge = badges[type];
  const Icon = badge.icon;

  return (
    <Badge className={cn("trust-badge gap-1.5", badge.className, className)}>
      <Icon className="h-3.5 w-3.5" />
      {badge.label}
    </Badge>
  );
}

// Trust Score Display Component
interface TrustScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function TrustScore({ score, size = 'md' }: TrustScoreProps) {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const sizes = {
    sm: { container: 'w-12 h-12', text: 'text-sm', ring: 'w-10 h-10' },
    md: { container: 'w-16 h-16', text: 'text-lg', ring: 'w-14 h-14' },
    lg: { container: 'w-24 h-24', text: 'text-2xl', ring: 'w-20 h-20' }
  };

  const s = sizes[size];

  return (
    <div className={cn("relative flex items-center justify-center", s.container)}>
      {/* Background ring */}
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-muted"
        />
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={`${score} 100`}
          strokeLinecap="round"
          className={getBgColor(score)}
        />
      </svg>
      <span className={cn("font-bold", s.text, getColor(score))}>
        {score}
      </span>
    </div>
  );
}

// Provenance Timeline Component
interface ProvenanceEvent {
  id: number;
  eventType: string;
  eventDate: Date | null;
  description: string | null;
  location: string | null;
  verifiedBy: string | null;
}

interface ProvenanceTimelineProps {
  events: ProvenanceEvent[];
}

export function ProvenanceTimeline({ events }: ProvenanceTimelineProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'creation': return '🎨';
      case 'exhibition': return '🏛️';
      case 'sale': return '💰';
      case 'authentication': return '✅';
      case 'restoration': return '🔧';
      case 'transfer': return '📦';
      default: return '📌';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Date unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg">
              {getEventIcon(event.eventType)}
            </div>
            {index < events.length - 1 && (
              <div className="w-px flex-1 bg-border my-2" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2">
              <h4 className="font-medium capitalize">{event.eventType}</h4>
              {event.verifiedBy && (
                <Badge variant="outline" className="text-xs">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(event.eventDate)}
              {event.location && ` • ${event.location}`}
            </p>
            {event.description && (
              <p className="text-sm mt-2">{event.description}</p>
            )}
            {event.verifiedBy && (
              <p className="text-xs text-muted-foreground mt-1">
                Verified by: {event.verifiedBy}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
