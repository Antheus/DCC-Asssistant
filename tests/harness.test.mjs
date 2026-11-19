import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRules, scriptedRoller } from './helpers.mjs';

test('rollDiceExpression lance 1d30+2 avec le bon dé', () => {
  const R = loadRules();
  R.__setRoller(scriptedRoller([[30, 17]]));
  assert.deepEqual(R.rollDiceExpression('1d30+2'), { total: 19, rolls: [17], sides: 30, count: 1, plus: 2 });
});
test('rollDiceExpression 2d20', () => {
  const R = loadRules();
  R.__setRoller(scriptedRoller([[20, 3], [20, 11]]));
  assert.equal(R.rollDiceExpression('2d20').total, 14);
});
test('d10+4 sans compte vaut 1d10+4', () => {
  const R = loadRules();
  R.__setRoller(scriptedRoller([[10, 10]]));
  assert.equal(R.rollDiceExpression('d10+4').total, 14);
});
