import type { ExperienceLevel } from '../../generated/prisma/enums';

export interface CompatibilityTarget {
  genres: string[];
  instruments: string[];
  influences: string[];
  locationText?: string | null;
  requiresAvailability?: boolean;
  desiredExperience?: ExperienceLevel | null;
}

export interface CompatibilityCandidate {
  genres: string[];
  instruments: string[];
  influences: string[];
  locationText?: string | null;
  availableForProjects: boolean;
  experienceLevel?: ExperienceLevel | null;
}

const experienceRank: Record<ExperienceLevel, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  PROFESSIONAL: 4,
};

function normalized(values: string[]): Set<string> {
  return new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean));
}

function overlapRatio(left: string[], right: string[]): number {
  const a = normalized(left);
  const b = normalized(right);
  if (!a.size || !b.size) return 0;
  let matches = 0;
  for (const value of a) if (b.has(value)) matches += 1;
  return matches / Math.max(a.size, b.size);
}

export function calculateCompatibility(
  target: CompatibilityTarget,
  candidate: CompatibilityCandidate,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const genreScore = overlapRatio(target.genres, candidate.genres) * 30;
  if (genreScore) reasons.push('Géneros en común');

  const instrumentScore = overlapRatio(target.instruments, candidate.instruments) * 25;
  if (instrumentScore) reasons.push('Instrumento compatible');

  const sameZone =
    !!target.locationText &&
    !!candidate.locationText &&
    target.locationText.trim().toLowerCase() === candidate.locationText.trim().toLowerCase();
  if (sameZone) reasons.push('Misma zona');

  const availabilityScore = target.requiresAvailability && candidate.availableForProjects ? 10 : 0;
  if (availabilityScore) reasons.push('Disponible para proyectos');

  const influenceScore = overlapRatio(target.influences, candidate.influences) * 10;
  if (influenceScore) reasons.push('Influencias compartidas');

  let experienceScore = 0;
  if (target.desiredExperience && candidate.experienceLevel) {
    const distance = Math.abs(
      experienceRank[target.desiredExperience] - experienceRank[candidate.experienceLevel],
    );
    experienceScore = Math.max(0, 10 - distance * 3);
    if (experienceScore) reasons.push('Experiencia compatible');
  }

  return {
    score: Math.round(
      genreScore +
        instrumentScore +
        (sameZone ? 15 : 0) +
        availabilityScore +
        influenceScore +
        experienceScore,
    ),
    reasons,
  };
}
