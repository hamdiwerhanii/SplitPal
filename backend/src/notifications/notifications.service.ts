import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import type { Env } from 'src/config/env.validation';
import { activeMemberIds, Group } from 'src/groups/entities/group.entity';
import { Locale } from 'src/user/enums/locale.enum';
import { UserService } from 'src/user/user.service';
import { buildPushBody, PushEvent } from './push.messages';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const CHUNK_SIZE = 100;

type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  data: Record<string, string>;
};

type ExpoTicket = {
  status: 'ok' | 'error';
  details?: { error?: string };
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly userService: UserService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  notifyGroup(
    group: Group,
    actorId: string,
    event: PushEvent,
    data: Record<string, string> = {},
  ): void {
    if (!this.config.get('PUSH_ENABLED', { infer: true })) {
      return;
    }
    const recipients = activeMemberIds(group).filter(
      (id) => id.toString() !== actorId,
    );
    this.send(recipients, group, event, data).catch((error: Error) =>
      this.logger.error('Push notification failed', error.stack),
    );
  }

  private async send(
    recipientIds: Types.ObjectId[],
    group: Group,
    event: PushEvent,
    data: Record<string, string>,
  ): Promise<void> {
    if (recipientIds.length === 0) {
      return;
    }

    const users = await this.userService.findPushRecipients(recipientIds);
    const messages: ExpoMessage[] = users.flatMap((user) =>
      user.pushTokens.map((to) => ({
        to,
        title: group.name,
        body: buildPushBody(user.locale ?? Locale.EN, event),
        sound: 'default' as const,
        data: { ...data, groupId: group._id.toString(), type: event.kind },
      })),
    );

    for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
      await this.sendChunk(messages.slice(i, i + CHUNK_SIZE));
    }
  }

  private async sendChunk(messages: ExpoMessage[]): Promise<void> {
    const accessToken = this.config.get('EXPO_ACCESS_TOKEN', { infer: true });
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      this.logger.warn(`Expo push API responded ${response.status}`);
      return;
    }

    const { data: tickets } = (await response.json()) as {
      data: ExpoTicket[];
    };
    await Promise.all(
      tickets.map((ticket, index) =>
        ticket.details?.error === 'DeviceNotRegistered'
          ? this.userService.removePushTokenEverywhere(messages[index].to)
          : Promise.resolve(),
      ),
    );
  }
}
