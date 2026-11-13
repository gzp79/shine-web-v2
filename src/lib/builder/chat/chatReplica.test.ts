import { describe, expect, test } from 'vitest';
import { CHAT_MAX_TEXT_BYTES, CHAT_WINDOW, ChatCommand, ChatState, uuidToBytes } from '#lib/game-bindings';
import type { ServerFrame } from '../hub.svelte';
import { ChatReplica } from './chatReplica';

const ME = '00000000-0000-0000-0000-00000000000a';
const OTHER = '00000000-0000-0000-0000-00000000000b';

/** Command ids that are easy to read in failures. */
const id = (n: number): string => `00000000-0000-0000-0000-${n.toString(16).padStart(12, '0')}`;

type WireCommand = { version: number; commandId: string; userId: string; command: string };

function wire(version: number, userId: string, command: ChatCommand, commandId = id(version)): WireCommand {
    return { version, commandId, userId, command: ChatCommand.encode(command) };
}

function sync(commands: WireCommand[] = [], snapshot?: { version: number; data: string }): ServerFrame {
    return { type: 'streamSync', streamId: 'chat:global', snapshot: snapshot ?? null, commands };
}

function commandsFrame(commands: WireCommand[]): ServerFrame {
    return { type: 'streamCommands', streamId: 'chat:global', commands };
}

function snapshotOf(version: number, messages: { id: string; from: string; text: string; edited?: boolean }[]) {
    const data = ChatState.encode({
        messages: messages.map((m) => ({
            id: uuidToBytes(m.id),
            userId: uuidToBytes(m.from),
            text: m.text,
            edited: m.edited ?? false
        }))
    });
    return { version, data };
}

function liveReplica(commands: WireCommand[] = []): ChatReplica {
    const replica = new ChatReplica(ME);
    replica.handle(sync(commands));
    return replica;
}

const texts = (replica: ChatReplica) => replica.view().map((m) => m.text);

describe('ChatReplica sync', () => {
    test('is waiting until the first sync', () => {
        const replica = new ChatReplica(ME);
        expect(replica.status).toBe('waiting');
        expect(replica.view()).toEqual([]);
    });

    test('reports no arrived messages for history', () => {
        const replica = new ChatReplica(ME);
        const result = replica.handle(sync([wire(1, OTHER, ChatCommand.add('old'))]));
        expect(result.arrived).toEqual([]);
    });

    test('goes live on an empty sync', () => {
        const replica = new ChatReplica(ME);
        const result = replica.handle(sync());
        expect(replica.status).toBe('live');
        expect(replica.version).toBe(0);
        expect(result.changed).toBe(true);
    });

    test('restores the snapshot and replays the commands after it', () => {
        const replica = new ChatReplica(ME);
        const snapshot = snapshotOf(5, [{ id: id(1), from: OTHER, text: 'old' }]);

        replica.handle(sync([wire(6, OTHER, ChatCommand.add('new'))], snapshot));

        expect(replica.version).toBe(6);
        expect(replica.view()).toEqual([
            { id: id(1), from: OTHER, text: 'old', edited: false, pending: false },
            { id: id(6), from: OTHER, text: 'new', edited: false, pending: false }
        ]);
    });

    test('skips commands the snapshot already covers', () => {
        const replica = new ChatReplica(ME);
        const snapshot = snapshotOf(5, [{ id: id(1), from: OTHER, text: 'old' }]);

        replica.handle(
            sync([wire(4, OTHER, ChatCommand.add('covered')), wire(6, OTHER, ChatCommand.add('new'))], snapshot)
        );

        expect(texts(replica)).toEqual(['old', 'new']);
    });

    test('replaces the earlier state on a new sync', () => {
        const replica = liveReplica([wire(1, OTHER, ChatCommand.add('before'))]);
        replica.handle(sync([wire(1, OTHER, ChatCommand.add('after'))]));
        expect(texts(replica)).toEqual(['after']);
    });

    test('becomes unsynced when the sync has a gap', () => {
        const replica = new ChatReplica(ME);
        const result = replica.handle(sync([wire(2, OTHER, ChatCommand.add('late'))]));
        expect(replica.status).toBe('unsynced');
        expect(result).toMatchObject({ changed: false, resubscribe: false });
    });

    test('becomes unsynced when the snapshot or a command cannot be decoded', () => {
        const badSnapshot = new ChatReplica(ME);
        badSnapshot.handle(sync([], { version: 1, data: '////' }));
        expect(badSnapshot.status).toBe('unsynced');

        const badCommand = new ChatReplica(ME);
        badCommand.handle(sync([{ ...wire(1, OTHER, ChatCommand.add('x')), command: '////' }]));
        expect(badCommand.status).toBe('unsynced');
    });

    test('becomes unsynced on a malformed sync', () => {
        const replica = new ChatReplica(ME);
        replica.handle({ type: 'streamSync', streamId: 'chat:global', commands: 'nope' });
        expect(replica.status).toBe('unsynced');
    });

    test('keeps the messages shown while it waits for a new sync', () => {
        const replica = liveReplica([wire(1, OTHER, ChatCommand.add('kept'))]);
        replica.resync();
        expect(replica.status).toBe('waiting');
        expect(texts(replica)).toEqual(['kept']);
    });
});

describe('ChatReplica commands', () => {
    test('applies add, replace and remove of the author', () => {
        const replica = liveReplica([wire(1, OTHER, ChatCommand.add('one')), wire(2, OTHER, ChatCommand.add('two'))]);

        replica.handle(
            commandsFrame([
                wire(3, OTHER, ChatCommand.replace(id(1), 'one!')),
                wire(4, OTHER, ChatCommand.remove(id(2)))
            ])
        );

        expect(replica.view()).toEqual([{ id: id(1), from: OTHER, text: 'one!', edited: true, pending: false }]);
        expect(replica.version).toBe(4);
    });

    test('ignores replace and remove of another user message', () => {
        const replica = liveReplica([wire(1, OTHER, ChatCommand.add('mine not'))]);

        replica.handle(
            commandsFrame([wire(2, ME, ChatCommand.replace(id(1), 'hijack')), wire(3, ME, ChatCommand.remove(id(1)))])
        );

        expect(texts(replica)).toEqual(['mine not']);
        expect(replica.version).toBe(3);
    });

    test(`keeps the last ${CHAT_WINDOW} messages`, () => {
        const adds = Array.from({ length: CHAT_WINDOW + 5 }, (_, n) => wire(n + 1, OTHER, ChatCommand.add(`m${n}`)));
        const replica = liveReplica(adds);

        const messages = texts(replica);
        expect(messages).toHaveLength(CHAT_WINDOW);
        expect(messages[0]).toBe('m5');
    });

    test('reports the added messages as arrived, the own echo included, edits not', () => {
        const replica = liveReplica();
        const result = replica.handle(
            commandsFrame([
                wire(1, OTHER, ChatCommand.add('hi')),
                wire(2, ME, ChatCommand.add('mine')),
                wire(3, OTHER, ChatCommand.replace(id(1), 'hi!'))
            ])
        );
        expect(result.changed).toBe(true);
        expect(result.arrived).toEqual([
            { id: id(1), from: OTHER, text: 'hi' },
            { id: id(2), from: ME, text: 'mine' }
        ]);
    });

    test('skips versions it already has', () => {
        const replica = liveReplica([wire(1, OTHER, ChatCommand.add('one'))]);
        const result = replica.handle(commandsFrame([wire(1, OTHER, ChatCommand.add('one'))]));
        expect(result).toMatchObject({ changed: false, arrived: [] });
        expect(texts(replica)).toEqual(['one']);
    });

    test('ignores commands until a sync made it live', () => {
        const replica = new ChatReplica(ME);
        const result = replica.handle(commandsFrame([wire(1, OTHER, ChatCommand.add('early'))]));
        expect(result.changed).toBe(false);
        expect(replica.view()).toEqual([]);
    });

    test('asks to subscribe again when versions were missed', () => {
        const replica = liveReplica([wire(1, OTHER, ChatCommand.add('one'))]);
        const result = replica.handle(commandsFrame([wire(3, OTHER, ChatCommand.add('three'))]));
        expect(result).toMatchObject({ resubscribe: true, changed: false });
        expect(replica.status).toBe('waiting');
        expect(texts(replica)).toEqual(['one']);
    });

    test('asks to subscribe again when a command cannot be decoded, keeping what applied before it', () => {
        const replica = liveReplica();
        const result = replica.handle(
            commandsFrame([
                wire(1, OTHER, ChatCommand.add('good')),
                { ...wire(2, OTHER, ChatCommand.add('x')), command: '////' }
            ])
        );
        expect(result).toMatchObject({ resubscribe: true, changed: true, arrived: [{ text: 'good' }] });
        expect(texts(replica)).toEqual(['good']);
    });

    test('asks to subscribe again on a malformed batch', () => {
        const replica = liveReplica();
        const result = replica.handle({
            type: 'streamCommands',
            streamId: 'chat:global',
            commands: [{ version: 'x' }]
        });
        expect(result.resubscribe).toBe(true);
    });
});

describe('ChatReplica submit', () => {
    test('refuses while not live', () => {
        expect(new ChatReplica(ME).submit(id(100), 'hello')).toBeUndefined();
    });

    test.each([[''], ['   '], ['x'.repeat(CHAT_MAX_TEXT_BYTES + 1)], ['é'.repeat(CHAT_MAX_TEXT_BYTES / 2 + 1)]])(
        'refuses an unacceptable text',
        (text) => {
            expect(liveReplica().submit(id(100), text)).toBeUndefined();
        }
    );

    test('accepts the longest text', () => {
        expect(liveReplica().submit(id(100), 'x'.repeat(CHAT_MAX_TEXT_BYTES))).toBeDefined();
    });

    test('shows the message at once as pending and returns the command to send', () => {
        const replica = liveReplica([wire(1, OTHER, ChatCommand.add('hi'))]);

        const sent = replica.submit(id(100), '  hello  ');

        expect(sent).toEqual({ commandId: id(100), command: ChatCommand.encode(ChatCommand.add('hello')) });
        expect(replica.pendingCount).toBe(1);
        expect(replica.view().at(-1)).toEqual({ id: id(100), from: ME, text: 'hello', edited: false, pending: true });
    });

    test('settles the pending message when the server confirms it', () => {
        const replica = liveReplica();
        replica.submit(id(100), 'hello');

        const result = replica.handle(commandsFrame([wire(1, ME, ChatCommand.add('hello'), id(100))]));

        expect(replica.pendingCount).toBe(0);
        expect(replica.view()).toEqual([{ id: id(100), from: ME, text: 'hello', edited: false, pending: false }]);
        expect(result).toMatchObject({ changed: true, arrived: [{ id: id(100), from: ME, text: 'hello' }] });
    });

    test('forgets a command that could not be sent', () => {
        const replica = liveReplica();
        replica.submit(id(100), 'hello');
        replica.discard(id(100));
        expect(replica.view()).toEqual([]);
    });

    test('sends the unconfirmed messages again after a sync and drops the confirmed ones', () => {
        const replica = liveReplica();
        replica.submit(id(100), 'confirmed');
        replica.submit(id(101), 'lost');
        replica.resync();

        const result = replica.handle(sync([wire(1, ME, ChatCommand.add('confirmed'), id(100))]));

        expect(result.resend).toEqual([{ commandId: id(101), command: ChatCommand.encode(ChatCommand.add('lost')) }]);
        expect(replica.view().map((m) => [m.text, m.pending])).toEqual([
            ['confirmed', false],
            ['lost', true]
        ]);
    });
});

describe('ChatReplica server notices', () => {
    test('a nack removes the pending message', () => {
        const replica = liveReplica();
        replica.submit(id(100), 'hello');

        const result = replica.handle({
            type: 'streamNack',
            streamId: 'chat:global',
            commandId: id(100),
            reason: 'invalid'
        });

        expect(result).toMatchObject({ changed: true, resubscribe: false });
        expect(replica.view()).toEqual([]);
    });

    test('a nack for a message that is not pending changes nothing', () => {
        const result = liveReplica().handle({
            type: 'streamNack',
            streamId: 'chat:global',
            commandId: id(9),
            reason: 'failed'
        });
        expect(result).toMatchObject({ changed: false, resubscribe: false });
    });

    test('a notSubscribed nack asks to subscribe again', () => {
        const replica = liveReplica();
        replica.submit(id(100), 'hello');

        const result = replica.handle({
            type: 'streamNack',
            streamId: 'chat:global',
            commandId: id(100),
            reason: 'notSubscribed'
        });

        expect(result).toMatchObject({ resubscribe: true, changed: true });
        expect(replica.status).toBe('waiting');
    });

    test.each(['streamUnsynced', 'streamSubscribeFailed'])('%s makes it unsynced', (type) => {
        const replica = liveReplica();
        replica.handle({ type, streamId: 'chat:global', reason: 'failed' });
        expect(replica.status).toBe('unsynced');
    });

    test('a reset makes it wait for a sync', () => {
        const replica = liveReplica();
        replica.handle({ type: 'streamReset', streamId: 'chat:global' });
        expect(replica.status).toBe('waiting');
    });

    test('ignores checkpoints and unknown frames', () => {
        const replica = liveReplica([wire(1, OTHER, ChatCommand.add('one'))]);
        expect(
            replica.handle({ type: 'streamCheckpoint', streamId: 'chat:global', version: 1, stateHash: '00' }).changed
        ).toBe(false);
        expect(replica.handle({ type: 'whatever' }).changed).toBe(false);
        expect(replica.status).toBe('live');
    });
});
