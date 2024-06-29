import { ScriptEvent } from '@/event/ScriptEvent';

export class CommandDispatchEvent extends ScriptEvent {
  readonly eventName = 'CommandDispatchEvent';

  constructor(public playerId: string, public commandString: string) {
    super();
  }
}