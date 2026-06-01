/**
 * Round-robin fixture generator with support for:
 * - Odd number of teams (automatic bye per round)
 * - Competition-wide bye weeks (skip entire rounds)
 * - Team-specific byes (nominated team sits out a round)
 */

export interface FixtureConfig {
  teamIds: string[];
  totalRounds: number;
  competitionByeRounds: number[];  // rounds where no games are played
  teamByes: { teamId: string; round: number }[];  // specific team byes
}

export interface GeneratedFixture {
  round: number;
  homeTeamId: string;
  awayTeamId: string;
}

export interface GeneratedBye {
  round: number;
  teamId: string;
}

export interface FixtureResult {
  fixtures: GeneratedFixture[];
  teamByes: GeneratedBye[];
  competitionByeRounds: number[];
}

/**
 * Generate round-robin fixtures using the circle method.
 * Handles odd teams by adding a phantom "BYE" slot.
 */
export function generateFixtures(config: FixtureConfig): FixtureResult {
  const { teamIds, totalRounds, competitionByeRounds, teamByes } = config;

  if (teamIds.length < 2) {
    return { fixtures: [], teamByes: [], competitionByeRounds };
  }

  // Circle method: fix one team, rotate the rest
  const teams = [...teamIds];
  const hasOddTeams = teams.length % 2 !== 0;
  if (hasOddTeams) {
    teams.push("__BYE__");
  }

  const n = teams.length;
  const roundRobinRounds = n - 1;

  // Build the base round-robin pattern
  const baseRounds: { home: string; away: string }[][] = [];
  const rotating = teams.slice(1);

  for (let r = 0; r < roundRobinRounds; r++) {
    const roundFixtures: { home: string; away: string }[] = [];
    const current = [teams[0], ...rotating];

    for (let i = 0; i < n / 2; i++) {
      const home = current[i];
      const away = current[n - 1 - i];
      roundFixtures.push({ home, away });
    }

    baseRounds.push(roundFixtures);
    // Rotate: move last to front
    rotating.unshift(rotating.pop()!);
  }

  // Map base rounds across the requested total rounds (repeating if needed)
  const fixtures: GeneratedFixture[] = [];
  const generatedByes: GeneratedBye[] = [];
  const competitionByeSet = new Set(competitionByeRounds);
  const teamByeMap = new Map<string, Set<number>>();

  for (const tb of teamByes) {
    if (!teamByeMap.has(tb.teamId)) teamByeMap.set(tb.teamId, new Set());
    teamByeMap.get(tb.teamId)!.add(tb.round);
  }

  let baseIdx = 0;
  for (let round = 1; round <= totalRounds; round++) {
    if (competitionByeSet.has(round)) continue;

    const baseRound = baseRounds[baseIdx % baseRounds.length];
    // Alternate home/away on repeat cycles
    const flip = Math.floor(baseIdx / baseRounds.length) % 2 === 1;
    baseIdx++;

    for (const match of baseRound) {
      const home = flip ? match.away : match.home;
      const away = flip ? match.home : match.away;

      // Handle phantom bye
      if (home === "__BYE__") {
        generatedByes.push({ round, teamId: away });
        continue;
      }
      if (away === "__BYE__") {
        generatedByes.push({ round, teamId: home });
        continue;
      }

      // Handle team-specific byes
      const homeBye = teamByeMap.get(home)?.has(round);
      const awayBye = teamByeMap.get(away)?.has(round);

      if (homeBye && awayBye) {
        generatedByes.push({ round, teamId: home });
        generatedByes.push({ round, teamId: away });
        continue;
      }
      if (homeBye) {
        generatedByes.push({ round, teamId: home });
        // away gets a bye too since their opponent is out
        generatedByes.push({ round, teamId: away });
        continue;
      }
      if (awayBye) {
        generatedByes.push({ round, teamId: away });
        generatedByes.push({ round, teamId: home });
        continue;
      }

      fixtures.push({ round, homeTeamId: home, awayTeamId: away });
    }
  }

  return {
    fixtures,
    teamByes: generatedByes,
    competitionByeRounds: [...competitionByeSet],
  };
}
