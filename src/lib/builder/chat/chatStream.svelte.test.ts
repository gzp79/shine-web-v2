import { testInEffectRoot } from '#testing';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ChatCommand } from '#lib/game-bindings';
import type { ServerFrame } from '../hub.svelte';
import type { StreamHub, StreamListener, StreamSubscription } from '../streamHub';
import { type ChatCommandFlags, createChatCommands } from './chatCommands';
import { CHAT_STREAM_ID, ChatStream } from './chatStream.svelte';

const ME = '00000000-0000-0000-0000-00000000000a';
const OTHER = '00000000-0000-0000-0000-00000000000b';
const id = (n: number): string => `00000000-0000-0000-0000-${n.toString(16).padStart(12, '0')}`;

type Wire = { version: number; commandId: string; userId: string; command: string };
const wire = (version: number, userId: string, command: ChatCommand, commandId = id(version)): Wire => ({
    version,
    commandId,
    userId,
    command: ChatCommand.encode(command)
});
const syncFrame = (commands: Wire[] = []): ServerFrame => ({
    type: 'streamSync',
    streamId: CHAT_STREAM_ID,
    snapshot: null,
    commands
});
const commandsFrame = (commands: Wire[]): ServerFrame => ({
    type: 'streamCommands',
    streamId: CHAT_STREAM_ID,
    commands
});

/** A stream hub the tests drive by hand. */
class FakeStreamHub implements StreamHub {
    isConnected = true;
    streamId: string | null = null;
    #create: ((userId: string) => StreamListener) | null = null;
    #listener: StreamListener | null = null;

    readonly subscribe = vi.fn(() => Promise.resolve());
    readonly sendCommand = vi.fn((_commandId: string, _command: string) => true);
    readonly unsubscribe = vi.fn();

    createSubscription(streamId: string, createListener: (userId: string) => StreamListener): StreamSubscription {
        this.streamId = streamId;
        this.#create = createListener;
        return { subscribe: this.subscribe, sendCommand: this.sendCommand, unsubscribe: this.unsubscribe };
    }

    /** The connection is accepted, as the stream hub reports it. */
    connect(userId = ME): void {
        this.#listener ??= this.#create?.(userId) ?? null;
        this.#listener?.connected();
    }
    disconnect(): void {
        this.#listener?.disconnected();
    }
    receive(frame: ServerFrame): void {
        this.#listener?.frame(frame);
    }
}

const NO_COMMANDS: ChatCommandFlags = { ping: false, burst: false, storm: false };
const ALL_COMMANDS: ChatCommandFlags = { ping: true, burst: true, storm: true };

/** The commands are given explicitly, so the tests do not depend on what the build enables. */
function setup(flags: ChatCommandFlags = NO_COMMANDS): { hub: FakeStreamHub; chat: ChatStream } {
    const hub = new FakeStreamHub();
    let next = 100;
    const chat = new ChatStream(hub, {
        newCommandId: () => id(next++),
        resubscribeDelayMs: 1000,
        commands: createChatCommands(flags)
    });
    return { hub, chat };
}

function liveChat(
    commands: Wire[] = [],
    flags: ChatCommandFlags = NO_COMMANDS
): { hub: FakeStreamHub; chat: ChatStream } {
    const fixture = setup(flags);
    fixture.chat.start();
    fixture.hub.connect();
    fixture.hub.receive(syncFrame(commands));
    return fixture;
}

describe('ChatStream', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('connection', () => {
        test('subscribes to the shared room on start', () => {
            testInEffectRoot(() => {
                const { hub, chat } = setup();
                expect(chat.state).toBe('connecting');

                chat.start();

                expect(hub.streamId).toBe('chat:global');
                expect(hub.subscribe).toHaveBeenCalledTimes(1);
            });
        });

        test('syncs after the connection and is live with the room', () => {
            testInEffectRoot(() => {
                const { hub, chat } = setup();
                chat.start();

                hub.connect();
                expect(chat.state).toBe('syncing');
                expect(chat.selfId).toBe(ME);

                hub.receive(syncFrame([wire(1, OTHER, ChatCommand.add('hello'))]));
                expect(chat.state).toBe('live');
                expect(chat.canSend).toBe(true);
                expect(chat.messages.map((m) => m.text)).toEqual(['hello']);
            });
        });

        test('reconnects: reconnecting while down, syncing again after, the messages stay shown', () => {
            testInEffectRoot(() => {
                const { hub, chat } = liveChat([wire(1, OTHER, ChatCommand.add('kept'))]);

                hub.disconnect();
                expect(chat.state).toBe('reconnecting');
                expect(chat.canSend).toBe(false);
                expect(chat.messages.map((m) => m.text)).toEqual(['kept']);

                hub.connect();
                expect(chat.state).toBe('syncing');
                hub.receive(
                    syncFrame([wire(1, OTHER, ChatCommand.add('kept')), wire(2, OTHER, ChatCommand.add('missed'))])
                );
                expect(chat.state).toBe('live');
                expect(chat.messages.map((m) => m.text)).toEqual(['kept', 'missed']);
            });
        });

        test('subscribes again when versions were missed', () => {
            testInEffectRoot(() => {
                const { hub, chat } = liveChat();
                hub.subscribe.mockClear();

                hub.receive(commandsFrame([wire(5, OTHER, ChatCommand.add('far'))]));

                expect(hub.subscribe).toHaveBeenCalledTimes(1);
                expect(chat.state).toBe('syncing');
            });
        });

        test('subscribes again after the server lost the subscription', () => {
            testInEffectRoot(() => {
                const { hub } = liveChat();
                hub.subscribe.mockClear();

                hub.receive({
                    type: 'streamNack',
                    streamId: CHAT_STREAM_ID,
                    commandId: id(9),
                    reason: 'notSubscribed'
                });

                expect(hub.subscribe).toHaveBeenCalledTimes(1);
            });
        });

        test('retries after a pause when the server cannot serve the room', () => {
            testInEffectRoot(() => {
                const { hub, chat } = liveChat();
                hub.subscribe.mockClear();

                hub.receive({ type: 'streamUnsynced', streamId: CHAT_STREAM_ID });
                expect(chat.state).toBe('unsynced');
                expect(hub.subscribe).not.toHaveBeenCalled();

                vi.advanceTimersByTime(1000);
                expect(hub.subscribe).toHaveBeenCalledTimes(1);
                expect(chat.state).toBe('syncing');

                hub.receive(syncFrame());
                expect(chat.state).toBe('live');
            });
        });

        test('retries a failed subscribe', () => {
            testInEffectRoot(() => {
                const { hub, chat } = setup();
                chat.start();
                hub.connect();
                hub.subscribe.mockClear();

                hub.receive({ type: 'streamSubscribeFailed', streamId: CHAT_STREAM_ID, reason: 'failed' });
                vi.advanceTimersByTime(1000);

                expect(hub.subscribe).toHaveBeenCalledTimes(1);
            });
        });

        test('does not retry once the connection is lost', () => {
            testInEffectRoot(() => {
                const { hub } = liveChat();
                hub.receive({ type: 'streamUnsynced', streamId: CHAT_STREAM_ID });
                hub.subscribe.mockClear();

                hub.disconnect();
                vi.advanceTimersByTime(10_000);

                expect(hub.subscribe).not.toHaveBeenCalled();
            });
        });

        test('destroy leaves the room and cancels a pending retry', () => {
            testInEffectRoot(() => {
                const { hub, chat } = liveChat();
                hub.receive({ type: 'streamUnsynced', streamId: CHAT_STREAM_ID });
                hub.subscribe.mockClear();

                chat.destroy();
                vi.advanceTimersByTime(10_000);

                expect(hub.unsubscribe).toHaveBeenCalledTimes(1);
                expect(hub.subscribe).not.toHaveBeenCalled();
            });
        });
    });

    describe('sending', () => {
        test('cannot send before the room is live', () => {
            testInEffectRoot(() => {
                const { hub, chat } = setup();
                chat.start();
                hub.connect();

                expect(chat.send('hello')).toBe(false);
                expect(hub.sendCommand).not.toHaveBeenCalled();
            });
        });

        test('sends the message as an add command and shows it as pending', () => {
            testInEffectRoot(() => {
                const { hub, chat } = liveChat();

                expect(chat.send('  hello ')).toBe(true);

                expect(hub.sendCommand).toHaveBeenCalledWith(id(100), ChatCommand.encode(ChatCommand.add('hello')));
                expect(chat.messages.map((m) => [m.text, m.from, m.pending])).toEqual([['hello', ME, true]]);
            });
        });

        test('the confirmed message replaces the pending one', () => {
            testInEffectRoot(() => {
                const { hub, chat } = liveChat();
                chat.send('hello');

                hub.receive(commandsFrame([wire(1, ME, ChatCommand.add('hello'), id(100))]));

                expect(chat.messages.map((m) => [m.id, m.pending])).toEqual([[id(100), false]]);
            });
        });

        test('refuses text the room does not accept', () => {
            testInEffectRoot(() => {
                const { hub, chat } = liveChat();
                expect(chat.send('   ')).toBe(false);
                expect(hub.sendCommand).not.toHaveBeenCalled();
            });
        });

        test('drops the message when it could not be sent', () => {
            testInEffectRoot(() => {
                const { hub, chat } = liveChat();
                hub.sendCommand.mockReturnValueOnce(false);

                expect(chat.send('hello')).toBe(false);
                expect(chat.messages).toEqual([]);
            });
        });

        test('sends the unconfirmed messages again after a reconnect sync', () => {
            testInEffectRoot(() => {
                const { hub, chat } = liveChat();
                chat.send('lost');
                hub.sendCommand.mockClear();

                hub.disconnect();
                hub.connect();
                hub.receive(syncFrame());

                expect(hub.sendCommand).toHaveBeenCalledWith(id(100), ChatCommand.encode(ChatCommand.add('lost')));
                expect(chat.messages.map((m) => m.pending)).toEqual([true]);
            });
        });

        test('removes a message the server refused', () => {
            testInEffectRoot(() => {
                const { hub, chat } = liveChat();
                chat.send('hello');

                hub.receive({ type: 'streamNack', streamId: CHAT_STREAM_ID, commandId: id(100), reason: 'invalid' });

                expect(chat.messages).toEqual([]);
            });
        });
    });

    describe('unread', () => {
        test('the first sync is not unread', () => {
            testInEffectRoot(() => {
                const { chat } = liveChat([wire(1, OTHER, ChatCommand.add('old'))]);
                expect(chat.hasUnread).toBe(false);
            });
        });

        test('a message of another user arriving live is unread until marked read', () => {
            testInEffectRoot(() => {
                const { hub, chat } = liveChat();

                hub.receive(commandsFrame([wire(1, OTHER, ChatCommand.add('hi'))]));
                expect(chat.hasUnread).toBe(true);

                chat.markAllRead();
                expect(chat.hasUnread).toBe(false);
            });
        });

        test('own messages are not unread', () => {
            testInEffectRoot(() => {
                const { hub, chat } = liveChat();
                chat.send('mine');

                hub.receive(commandsFrame([wire(1, ME, ChatCommand.add('mine'), id(100))]));

                expect(chat.hasUnread).toBe(false);
            });
        });
    });

    describe('dev commands', () => {
        /** The texts of the messages sent so far, in order. */
        const sentTexts = (hub: FakeStreamHub): string[] =>
            hub.sendCommand.mock.calls.map(([, command]) => {
                const parsed = ChatCommand.parse(command);
                return parsed.tag === 'add' ? parsed.value.text : '';
            });

        /** The command id of the n-th message sent. */
        const sentId = (hub: FakeStreamHub, n: number): string => String(hub.sendCommand.mock.calls[n]?.[0]);

        const NOW = 1_000_000;

        beforeEach(() => {
            vi.setSystemTime(NOW);
        });

        test('commands are recognised only when enabled', () => {
            testInEffectRoot(() => {
                const { hub, chat } = liveChat();
                chat.send('@ping');
                chat.send('@burst 2');
                expect(sentTexts(hub)).toEqual(['@ping', '@burst 2']);
            });
        });

        test('cannot run a command while the room is not live', () => {
            testInEffectRoot(() => {
                const { hub, chat } = setup(ALL_COMMANDS);
                chat.start();
                hub.connect();

                expect(chat.send('@ping')).toBe(false);
                expect(hub.sendCommand).not.toHaveBeenCalled();
            });
        });

        test('sends text starting with @ as a plain message when it names no command', () => {
            testInEffectRoot(() => {
                const { hub, chat } = liveChat([], ALL_COMMANDS);
                expect(chat.send('@hello there')).toBe(true);
                expect(sentTexts(hub)).toEqual(['@hello there']);
            });
        });

        describe('ping', () => {
            test('sends a probe with the user id and the clock', () => {
                testInEffectRoot(() => {
                    const { hub, chat } = liveChat([], ALL_COMMANDS);
                    chat.send('@ping');
                    expect(sentTexts(hub)).toEqual([`@ping ${ME} ${NOW}`]);
                });
            });

            test('ignores a ping with parameters', () => {
                testInEffectRoot(() => {
                    const { hub, chat } = liveChat([], ALL_COMMANDS);
                    chat.send('@ping now');
                    expect(hub.sendCommand).not.toHaveBeenCalled();
                });
            });

            test('shows the own probe with its server round trip, without answering it', () => {
                testInEffectRoot(() => {
                    const { hub, chat } = liveChat([], ALL_COMMANDS);
                    chat.send('@ping');

                    vi.setSystemTime(NOW + 42);
                    hub.receive(commandsFrame([wire(1, ME, ChatCommand.add(`@ping ${ME} ${NOW}`), sentId(hub, 0))]));

                    expect(chat.messages.map((m) => m.display)).toEqual([{ kind: 'ping', selfMs: 42 }]);
                    expect(hub.sendCommand).toHaveBeenCalledTimes(1);
                });
            });

            test('shows the probe of a peer without a time and answers it', () => {
                testInEffectRoot(() => {
                    const { hub, chat } = liveChat([], ALL_COMMANDS);

                    hub.receive(commandsFrame([wire(1, OTHER, ChatCommand.add(`@ping ${OTHER} ${NOW - 100}`))]));

                    expect(chat.messages.map((m) => m.display)).toEqual([{ kind: 'ping' }]);
                    expect(sentTexts(hub)).toEqual([`@pong ${OTHER} ${NOW - 100} ${NOW}`]);
                });
            });

            test('shows the answer of a peer to the own probe as the full round trip', () => {
                testInEffectRoot(() => {
                    const { hub, chat } = liveChat([], ALL_COMMANDS);

                    vi.setSystemTime(NOW + 100);
                    hub.receive(commandsFrame([wire(1, OTHER, ChatCommand.add(`@pong ${ME} ${NOW} ${NOW + 60}`))]));

                    expect(chat.messages.map((m) => m.display)).toEqual([{ kind: 'pong', roundTripMs: 100 }]);
                    expect(hub.sendCommand).not.toHaveBeenCalled();
                });
            });

            test('shows the own answer with its server round trip', () => {
                testInEffectRoot(() => {
                    const { hub, chat } = liveChat([], ALL_COMMANDS);

                    vi.setSystemTime(NOW + 50);
                    hub.receive(commandsFrame([wire(1, ME, ChatCommand.add(`@pong ${OTHER} ${NOW - 80} ${NOW}`))]));

                    expect(chat.messages.map((m) => m.display)).toEqual([{ kind: 'pong', roundTripMs: 50 }]);
                });
            });

            test('hides the answers exchanged between other users, and they are not unread', () => {
                testInEffectRoot(() => {
                    const { hub, chat } = liveChat([], ALL_COMMANDS);

                    hub.receive(commandsFrame([wire(1, OTHER, ChatCommand.add(`@pong ${id(77)} ${NOW} ${NOW}`))]));

                    expect(chat.messages).toEqual([]);
                    expect(chat.hasUnread).toBe(false);
                });
            });

            test('a probe of a peer is unread', () => {
                testInEffectRoot(() => {
                    const { hub, chat } = liveChat([], ALL_COMMANDS);
                    hub.receive(commandsFrame([wire(1, OTHER, ChatCommand.add(`@ping ${OTHER} ${NOW}`))]));
                    expect(chat.hasUnread).toBe(true);
                });
            });

            test('shows a probe from the history without a time, hides its answers, and answers nothing', () => {
                testInEffectRoot(() => {
                    const { hub, chat } = liveChat(
                        [
                            wire(1, OTHER, ChatCommand.add(`@ping ${OTHER} ${NOW - 5000}`)),
                            wire(2, OTHER, ChatCommand.add(`@pong ${ME} ${NOW - 5000} ${NOW - 4990}`)),
                            wire(3, OTHER, ChatCommand.add('plain'))
                        ],
                        ALL_COMMANDS
                    );

                    expect(chat.messages.map((m) => m.display.kind)).toEqual(['ping', 'text']);
                    expect(hub.sendCommand).not.toHaveBeenCalled();
                });
            });

            test('keeps the measured time across a new sync', () => {
                testInEffectRoot(() => {
                    const { hub, chat } = liveChat([], ALL_COMMANDS);
                    chat.send('@ping');
                    const ping = wire(1, ME, ChatCommand.add(`@ping ${ME} ${NOW}`), sentId(hub, 0));
                    vi.setSystemTime(NOW + 7);
                    hub.receive(commandsFrame([ping]));

                    hub.disconnect();
                    hub.connect();
                    hub.receive(syncFrame([ping]));

                    expect(chat.messages.map((m) => m.display)).toEqual([{ kind: 'ping', selfMs: 7 }]);
                });
            });
        });

        describe('burst', () => {
            test('sends the requested number of plain messages', () => {
                testInEffectRoot(() => {
                    const { hub, chat } = liveChat([], ALL_COMMANDS);
                    chat.send('@burst 3');
                    expect(sentTexts(hub)).toEqual(['burst 1/3', 'burst 2/3', 'burst 3/3']);
                });
            });

            test.each(['@burst', '@burst abc', '@burst 0', '@burst 201', '@burst 1 2', '@burst -1'])(
                'ignores %j',
                (text) => {
                    testInEffectRoot(() => {
                        const { hub, chat } = liveChat([], ALL_COMMANDS);
                        chat.send(text);
                        expect(hub.sendCommand).not.toHaveBeenCalled();
                    });
                }
            );

            test('accepts the largest burst', () => {
                testInEffectRoot(() => {
                    const { hub, chat } = liveChat([], ALL_COMMANDS);
                    chat.send('@burst 200');
                    expect(hub.sendCommand).toHaveBeenCalledTimes(200);
                });
            });
        });

        describe('storm', () => {
            test('sends a single trigger', () => {
                testInEffectRoot(() => {
                    const { hub, chat } = liveChat([], ALL_COMMANDS);
                    chat.send('@storm 5');
                    expect(sentTexts(hub)).toEqual(['@storm 5']);
                });
            });

            test.each(['@storm', '@storm x', '@storm 0', '@storm 201'])('ignores %j', (text) => {
                testInEffectRoot(() => {
                    const { hub, chat } = liveChat([], ALL_COMMANDS);
                    chat.send(text);
                    expect(hub.sendCommand).not.toHaveBeenCalled();
                });
            });

            test('answers a received trigger with plain messages and shows the trigger', () => {
                testInEffectRoot(() => {
                    const { hub, chat } = liveChat([], ALL_COMMANDS);

                    hub.receive(commandsFrame([wire(1, OTHER, ChatCommand.add('@storm 2'))]));

                    expect(sentTexts(hub)).toEqual(['storm 1/2', 'storm 2/2']);
                    expect(chat.messages.map((m) => [m.text, m.display.kind])).toEqual([
                        ['@storm 2', 'text'],
                        ['storm 1/2', 'text'],
                        ['storm 2/2', 'text']
                    ]);
                });
            });

            test('does not start a storm from the answers of a storm', () => {
                testInEffectRoot(() => {
                    const { hub } = liveChat([], ALL_COMMANDS);
                    hub.receive(commandsFrame([wire(1, OTHER, ChatCommand.add('storm 1/2'))]));
                    expect(hub.sendCommand).not.toHaveBeenCalled();
                });
            });

            test('does not answer a trigger from the history', () => {
                testInEffectRoot(() => {
                    const { hub } = liveChat([wire(1, OTHER, ChatCommand.add('@storm 3'))], ALL_COMMANDS);
                    expect(hub.sendCommand).not.toHaveBeenCalled();
                });
            });
        });
    });
});
