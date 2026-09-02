import { describe, expect, it } from 'vitest';

import { backspaceEdit, changeEdit, deleteEdit, fillEdit } from '@/app/login/otp-input';

/**
 * The six-box code field's rules.
 *
 * The component itself is focus management and markup, which needs a DOM; these are the
 * value rules underneath it, which do not. Each case here is a way a person actually
 * enters a code, so a regression in one of them is a regression in signing in.
 */

const LENGTH = 6;

describe('typing one digit', () => {
    it('fills the focused box and moves to the next', () => {
        expect(changeEdit('', 0, '9', LENGTH)).toEqual({ value: '9', focus: 1 });
        expect(changeEdit('9', 1, '1', LENGTH)).toEqual({ value: '91', focus: 2 });
    });

    it('replaces the digit in a box that already has one, rather than ignoring the keystroke', () => {
        expect(changeEdit('915155', 2, '7', LENGTH)).toEqual({ value: '917155', focus: 3 });
    });

    it('keeps focus on the last box, so the code can be submitted without tabbing away', () => {
        expect(changeEdit('91515', 5, '5', LENGTH)).toEqual({ value: '915155', focus: 5 });
    });

    it('ignores a letter', () => {
        expect(changeEdit('91', 2, 'a', LENGTH)).toEqual({ value: '91', focus: 2 });
    });

    it('never grows past the code length', () => {
        expect(changeEdit('915155', 5, '7', LENGTH).value).toHaveLength(LENGTH);
    });
});

describe('pasting, which is how most people enter a code', () => {
    it('fills every box from a six digit paste into the first', () => {
        expect(fillEdit('', 0, '915155', LENGTH)).toEqual({ value: '915155', focus: 5 });
    });

    it('replaces a code already typed, rather than appending to it', () => {
        expect(fillEdit('123456', 0, '915155', LENGTH)).toEqual({ value: '915155', focus: 5 });
    });

    it.each([
        ['spaces around it', ' 915155 '],
        ['a space in the middle, as some mail clients wrap it', '915 155'],
        ['a hyphen', '915-155'],
        ['the sentence it was copied inside', 'Your code is 915155, it expires in 10 minutes'],
    ])('takes the digits out of a paste with %s', (_why, pasted) => {
        expect(fillEdit('', 0, pasted, LENGTH).value).toBe('915155');
    });

    it('drops anything past the sixth digit', () => {
        expect(fillEdit('', 0, '91515512345', LENGTH)).toEqual({ value: '915155', focus: 5 });
    });

    it('fills from a later box when the paste lands there, keeping what came before', () => {
        expect(fillEdit('91', 2, '5155', LENGTH)).toEqual({ value: '915155', focus: 5 });
    });

    it('changes nothing when the clipboard holds no digits at all', () => {
        expect(fillEdit('915', 3, 'no digits here', LENGTH)).toEqual({ value: '915', focus: 3 });
    });

    it('treats a multi-character change as a paste, which is how browser autofill arrives', () => {
        // Chrome and iOS put the whole code into the first box in one change event.
        expect(changeEdit('', 0, '915155', LENGTH)).toEqual({ value: '915155', focus: 5 });
    });
});

describe('backspace', () => {
    it('empties a filled box and stays on it', () => {
        expect(backspaceEdit('915155', 5)).toEqual({ value: '91515', focus: 5 });
    });

    it('steps back and empties the previous box when the focused one is already empty', () => {
        // Focus sits on box 3, which is empty, after typing three digits.
        expect(backspaceEdit('915', 3)).toEqual({ value: '91', focus: 2 });
    });

    it('does nothing at the first box when there is nothing to delete', () => {
        expect(backspaceEdit('', 0)).toEqual({ value: '', focus: 0 });
    });

    it('walks the whole code out one digit at a time', () => {
        let state = { value: '915155', focus: 5 };
        for (let i = 0; i < 6; i += 1) state = backspaceEdit(state.value, state.focus);
        expect(state.value).toBe('');
    });

    it('removes from the middle without leaving a hole, since the value is a plain string', () => {
        expect(backspaceEdit('915155', 2)).toEqual({ value: '91155', focus: 2 });
    });
});

describe('delete', () => {
    it('empties the focused box and stays put', () => {
        expect(deleteEdit('915155', 0)).toEqual({ value: '15155', focus: 0 });
    });

    it('does nothing past the end of the value', () => {
        expect(deleteEdit('915', 5)).toEqual({ value: '915', focus: 5 });
    });
});
