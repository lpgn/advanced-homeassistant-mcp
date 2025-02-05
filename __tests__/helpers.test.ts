import { describe, expect, test } from "bun:test";
import { describe, expect, test } from "bun:test";
import { formatToolCall } from "../src/utils/helpers";

describe('helpers', () => {
    describe('formatToolCall', () => {
        test('should format an object into the correct structure', () => {
            const testObj = { name: 'test', value: 123 };
            const result = formatToolCall(testObj);

            expect(result).toEqual({
                content: [{
                    type: 'text',
                    text: JSON.stringify(testObj, null, 2),
                    isError: false
                }]
            });
        });

        test('should handle error cases correctly', () => {
            const testObj = { error: 'test error' };
            const result = formatToolCall(testObj, true);

            expect(result).toEqual({
                content: [{
                    type: 'text',
                    text: JSON.stringify(testObj, null, 2),
                    isError: true
                }]
            });
        });

        test('should handle empty objects', () => {
            const testObj = {};
            const result = formatToolCall(testObj);

            expect(result).toEqual({
                content: [{
                    type: 'text',
                    text: '{}',
                    isError: false
                }]
            });
        });

        test('should handle null and undefined', () => {
            const nullResult = formatToolCall(null);
            const undefinedResult = formatToolCall(undefined);

            expect(nullResult).toEqual({
                content: [{
                    type: 'text',
                    text: 'null',
                    isError: false
                }]
            });

            expect(undefinedResult).toEqual({
                content: [{
                    type: 'text',
                    text: 'undefined',
                    isError: false
                }]
            });
        });
    });
}); 