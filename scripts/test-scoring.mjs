// Extended scoring tests
function calculatePoints({ homePred, awayPred, homeActual, awayActual }) {
  if (homePred === homeActual && awayPred === awayActual) return 5
  let points = 0
  const predResult = homePred > awayPred ? 'home' : awayPred > homePred ? 'away' : 'draw'
  const actualResult = homeActual > awayActual ? 'home' : awayActual > homeActual ? 'away' : 'draw'
  if (predResult === actualResult) points += 2
  if ((homePred - awayPred) === (homeActual - awayActual)) points += 1
  if (homePred === homeActual || awayPred === awayActual) points += 1
  return points
}

const tests = [
  [{ homePred: 2, awayPred: 1, homeActual: 2, awayActual: 1 }, 5, 'exact'],
  [{ homePred: 2, awayPred: 0, homeActual: 3, awayActual: 1 }, 3, 'result+diff'],
  [{ homePred: 2, awayPred: 1, homeActual: 3, awayActual: 0 }, 2, 'result only'],
  [{ homePred: 1, awayPred: 0, homeActual: 2, awayActual: 0 }, 3, 'result+away goals'],
  [{ homePred: 0, awayPred: 1, homeActual: 2, awayActual: 0 }, 0, 'all wrong'],
]

let passed = 0
for (const [input, expected] of tests) {
  const result = calculatePoints(input)
  if (result === expected) passed++
  else console.error(`FAIL: expected ${expected}, got ${result}`, input)
}
console.log(`${passed}/${tests.length} scoring tests passed`)
process.exit(passed === tests.length ? 0 : 1)
