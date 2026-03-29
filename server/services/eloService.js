/**
 * eloService.js
 * Handles Elo rating calculations and database updates.
 * K-factor: 32 (standard for most competitive systems)
 */

import User from '../models/User.js'

const K_FACTOR = 32

/**
 * Calculate expected score based on Elo ratings.
 * @param {number} ratingA 
 * @param {number} ratingB 
 * @returns {number} Expected score for player A (0-1)
 */
const expectedScore = (ratingA, ratingB) => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

/**
 * Calculate new Elo ratings for both players after a match.
 * @param {number} ratingA - Player A's current Elo
 * @param {number} ratingB - Player B's current Elo
 * @param {'a'|'b'|'draw'} outcome - Who won
 * @returns {{ newRatingA: number, newRatingB: number, changeA: number, changeB: number }}
 */
export const calculateElo = (ratingA, ratingB, outcome) => {
  const expectedA = expectedScore(ratingA, ratingB)
  const expectedB = expectedScore(ratingB, ratingA)

  let actualA, actualB
  if (outcome === 'a') {
    actualA = 1
    actualB = 0
  } else if (outcome === 'b') {
    actualA = 0
    actualB = 1
  } else {
    actualA = 0.5
    actualB = 0.5
  }

  const changeA = Math.round(K_FACTOR * (actualA - expectedA))
  const changeB = Math.round(K_FACTOR * (actualB - expectedB))

  return {
    newRatingA: Math.max(100, ratingA + changeA), // Minimum Elo of 100
    newRatingB: Math.max(100, ratingB + changeB),
    changeA,
    changeB,
  }
}

/**
 * Update Elo ratings in the database after a debate ends.
 * @param {string} usernameA - Debater A username
 * @param {string} usernameB - Debater B username
 * @param {'a'|'b'|'draw'} outcome - Who won
 * @param {string} topic - Debate topic
 * @returns {Promise<{ eloA: object, eloB: object } | null>}
 */
export const updateEloAfterDebate = async (usernameA, usernameB, outcome, topic) => {
  try {
    const [userA, userB] = await Promise.all([
      User.findOne({ username: usernameA }),
      User.findOne({ username: usernameB }),
    ])

    if (!userA || !userB) {
      console.warn('[elo] Could not find one or both users:', usernameA, usernameB)
      return null
    }

    const { newRatingA, newRatingB, changeA, changeB } = calculateElo(
      userA.elo, userB.elo, outcome
    )

    // Determine results for each player
    let resultA, resultB
    if (outcome === 'a') {
      resultA = 'win'
      resultB = 'loss'
    } else if (outcome === 'b') {
      resultA = 'loss'
      resultB = 'win'
    } else {
      resultA = 'draw'
      resultB = 'draw'
    }

    // Update player A
    userA.elo = newRatingA
    userA[resultA === 'win' ? 'wins' : resultA === 'loss' ? 'losses' : 'draws'] += 1
    userA.matchHistory.push({
      opponentUsername: usernameB,
      result: resultA,
      eloChange: changeA,
      newElo: newRatingA,
      topic: topic || 'Unknown',
    })
    // Keep only last 50 matches
    if (userA.matchHistory.length > 50) {
      userA.matchHistory = userA.matchHistory.slice(-50)
    }

    // Update player B
    userB.elo = newRatingB
    userB[resultB === 'win' ? 'wins' : resultB === 'loss' ? 'losses' : 'draws'] += 1
    userB.matchHistory.push({
      opponentUsername: usernameA,
      result: resultB,
      eloChange: changeB,
      newElo: newRatingB,
      topic: topic || 'Unknown',
    })
    if (userB.matchHistory.length > 50) {
      userB.matchHistory = userB.matchHistory.slice(-50)
    }

    await Promise.all([userA.save(), userB.save()])

    console.log(
      `[elo] ${usernameA}: ${userA.elo - changeA} → ${newRatingA} (${changeA >= 0 ? '+' : ''}${changeA})`,
      `| ${usernameB}: ${userB.elo - changeB} → ${newRatingB} (${changeB >= 0 ? '+' : ''}${changeB})`
    )

    return {
      eloA: { username: usernameA, elo: newRatingA, change: changeA, result: resultA },
      eloB: { username: usernameB, elo: newRatingB, change: changeB, result: resultB },
    }
  } catch (err) {
    console.error('[elo] Failed to update ratings:', err)
    return null
  }
}

/**
 * Get the leaderboard (top N players by Elo).
 * @param {number} limit - Number of players to return
 * @returns {Promise<Array>}
 */
export const getLeaderboard = async (limit = 50) => {
  return User.find({}, 'username elo wins losses draws')
    .sort({ elo: -1 })
    .limit(limit)
    .lean()
}

/**
 * Get a single user's Elo profile.
 * @param {string} username
 * @returns {Promise<object|null>}
 */
export const getUserEloProfile = async (username) => {
  return User.findOne({ username }, 'username elo wins losses draws matchHistory')
    .lean()
}
