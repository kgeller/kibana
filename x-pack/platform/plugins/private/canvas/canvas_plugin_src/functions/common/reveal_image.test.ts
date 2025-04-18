/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { elasticOutline, elasticLogo } from '../../../public/lib';
import { functionWrapper } from '@kbn/presentation-util-plugin/test_helpers';
import { ExecutionContext } from '@kbn/expressions-plugin/common';
import { errors } from '../../../i18n/functions/dict/reveal_image';
import { revealImage, Origin } from './reveal_image';

describe('revealImageFunction', () => {
  const fn = functionWrapper(revealImage);

  it('returns a render as revealImage', async () => {
    const result = await fn(
      0.5,
      {
        image: null,
        emptyImage: null,
        origin: Origin.BOTTOM,
      },
      {} as ExecutionContext
    );
    expect(result).toHaveProperty('type', 'render');
    expect(result).toHaveProperty('as', 'revealImage');
  });

  describe('context', () => {
    it('throws when context is not a number between 0 and 1', async () => {
      expect.assertions(2);
      await fn(
        10,
        {
          image: elasticLogo,
          emptyImage: elasticOutline,
          origin: Origin.TOP,
        },
        {} as ExecutionContext
      ).catch((e: any) => {
        expect(e.message).toMatch(new RegExp(errors.invalidPercent(10).message));
      });

      await fn(
        -0.1,
        {
          image: elasticLogo,
          emptyImage: elasticOutline,
          origin: Origin.TOP,
        },
        {} as ExecutionContext
      ).catch((e: any) => {
        expect(e.message).toMatch(new RegExp(errors.invalidPercent(-0.1).message));
      });
    });
  });

  describe('args', () => {
    describe('image', () => {
      it('sets the image', async () => {
        const result = (
          await fn(
            0.89,
            {
              emptyImage: null,
              origin: Origin.TOP,
              image: elasticLogo,
            },
            {} as ExecutionContext
          )
        ).value;
        expect(result).toHaveProperty('image', elasticLogo);
      });

      it('defaults to the Elastic outline logo', async () => {
        const result = (
          await fn(
            0.89,
            {
              emptyImage: null,
              origin: Origin.TOP,
              image: null,
            },
            {} as ExecutionContext
          )
        ).value;
        expect(result).toHaveProperty('image', elasticOutline);
      });
    });

    describe('emptyImage', () => {
      it('sets the background image', async () => {
        const result = (
          await fn(
            0,
            {
              emptyImage: elasticLogo,
              origin: Origin.TOP,
              image: null,
            },
            {} as ExecutionContext
          )
        ).value;
        expect(result).toHaveProperty('emptyImage', elasticLogo);
      });

      it('sets emptyImage to null', async () => {
        const result = (
          await fn(
            0,
            {
              emptyImage: null,
              origin: Origin.TOP,
              image: null,
            },
            {} as ExecutionContext
          )
        ).value;
        expect(result).toHaveProperty('emptyImage', null);
      });
    });

    describe('origin', () => {
      it('sets which side to start the reveal from', async () => {
        let result = (
          await fn(
            1,
            {
              emptyImage: null,
              origin: Origin.TOP,
              image: null,
            },
            {} as ExecutionContext
          )
        ).value;
        expect(result).toHaveProperty('origin', 'top');
        result = (
          await fn(
            1,
            {
              emptyImage: null,
              origin: Origin.LEFT,
              image: null,
            },
            {} as ExecutionContext
          )
        ).value;
        expect(result).toHaveProperty('origin', 'left');
        result = (
          await fn(
            1,
            {
              emptyImage: null,
              origin: Origin.BOTTOM,
              image: null,
            },
            {} as ExecutionContext
          )
        ).value;
        expect(result).toHaveProperty('origin', 'bottom');
        result = (
          await fn(
            1,
            {
              emptyImage: null,
              origin: Origin.RIGHT,
              image: null,
            },
            {} as ExecutionContext
          )
        ).value;
        expect(result).toHaveProperty('origin', 'right');
      });
    });
  });
});
