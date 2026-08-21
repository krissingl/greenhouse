/**
 * Manual Jest mock for `expo-crypto`, applied automatically by Jest for all
 * tests (see https://jestjs.io/docs/manual-mocks#mocking-node-modules).
 *
 * `expo-crypto` wraps a native module that isn't available under Jest's Node
 * test environment, so `randomUUID()` silently returns `undefined` there.
 * This mock backs it with Node's built-in `crypto.randomUUID` so repository
 * tests exercise real, valid UUIDs.
 */
/// <reference types="node" />
import { randomUUID as nodeRandomUUID } from 'node:crypto';

export function randomUUID(): string {
  return nodeRandomUUID();
}
