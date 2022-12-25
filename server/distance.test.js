const { calculateDistanceToNest } = require('./distance.js')

test('Distance from (250.00,250.00) to birdnest expected to be 0', () => {
  const x = 250
  const y = 250
  expect(calculateDistanceToNest([x, y])).toBe(0);
})

test('Distance from (150.00,250.00) to birdnest expected to be 100', () => {
  const x = 150
  const y = 250
  expect(calculateDistanceToNest([x, y])).toBe(100);
})