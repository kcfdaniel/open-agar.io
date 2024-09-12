/*jshint expr:true */

import { describe, it, expect } from 'vitest';
import * as util from './util';

/**
 * Tests for server/lib/util.js
 *
 * This is mostly a regression suite, to make sure behavior
 * is preserved throughout changes to the server infrastructure.
 */

describe('util.js', () => {
  describe('massToRadius', () => {
    it('should return non-zero radius on zero input', () => {
      const r = util.massToRadius(0);
      expect(r).toBeTypeOf('number');
      expect(r).toBe(4);
    });

    it('should convert masses to a circle radius', () => {
      const r1 = util.massToRadius(4);
      const r2 = util.massToRadius(16);
      const r3 = util.massToRadius(1);

      expect(r1).toBe(16);
      expect(r2).toBe(28);
      expect(r3).toBe(10);
    });
  });

  describe('validNick', () => {
    it.skip('should allow empty player nicknames', () => {
      const bool = util.validNick('');
      expect(bool).toBe(true);
    });

    it('should allow ascii character nicknames', () => {
      const n1 = util.validNick('Walter_White');
      const n2 = util.validNick('Jesse_Pinkman');
      const n3 = util.validNick('hank');
      const n4 = util.validNick('marie_schrader12');
      const n5 = util.validNick('p');

      expect(n1).toBe(true);
      expect(n2).toBe(true);
      expect(n3).toBe(true);
      expect(n4).toBe(true);
      expect(n5).toBe(true);
    });

    it('should disallow unicode-dependent alphabets', () => {
      const n1 = util.validNick('Йèæü');
      expect(n1).toBe(false);
    });

    it('should disallow spaces in nicknames', () => {
      const n1 = util.validNick('Walter White');
      expect(n1).toBe(false);
    });
  });

  describe('log', () => {
    it('should compute the log_{base} of a number', () => {
      const base10 = util.mathLog(1, 10);
      const base2  = util.mathLog(1, 2);
      const identity = util.mathLog(10, 10);
      const logNineThree = Math.round(util.mathLog(9,3) * 1e5) / 1e5; // Tolerate rounding errors

      // log(1) should equal 0, no matter the base
      expect(base10).toEqual(base2);

      // log(n,n) === 1
      expect(identity).toEqual(1);

      // perform a trivial log calculation: 3^2 === 9
      expect(logNineThree).toEqual(2);
    });
  });

  describe('getDistance', () => {
    interface Point {
      x: number;
      y: number;
      radius: number;
    }

    const Point = (x: number, y: number, r: number): Point => {
      return {
        x,
        y,
        radius: r
      };
    };

    const p1 = Point(-100, 20, 1);
    const p2 = Point(0, 40, 5);

    it('should return a positive number', () => {
      const distance = util.getDistance(p1, p2);
      expect(distance).toBeGreaterThan(0);
    });
  });
});
