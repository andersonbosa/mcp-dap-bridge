import { StandardCommandResponse, isErrorResponse, isStandardCommandResponse } from '../src/index';
import { expect, test } from '@jest/globals';

test('isErrorResponse type guard', () => {
  const errorResponse = { error: 'Test error' };
  const normalResponse = { data: { test: 'value' } };
  
  expect(isErrorResponse(errorResponse)).toBe(true);
  expect(isErrorResponse(normalResponse)).toBe(false);
});

test('isStandardCommandResponse type guard', () => {
  const standardResponse: StandardCommandResponse<any> = { data: { test: 'value' } };
  const errorResponse = { error: 'Test error' };
  
  expect(isStandardCommandResponse(standardResponse)).toBe(true);
  expect(isStandardCommandResponse(errorResponse)).toBe(false);
});
