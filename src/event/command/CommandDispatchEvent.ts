import { ScriptEvent } from '@/event/ScriptEvent';

export class CommandDispatchEvent extends ScriptEvent {
  readonly eventName = 'CommandDispatchEvent';

  constructor(public commandString: string, public playerId?: string) {
    super();
  }
}