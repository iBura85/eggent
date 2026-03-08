interface TelegramChatActionResponse {
  ok?: boolean;
  description?: string;
}

interface RunWithTelegramChatActionOptions {
  action: "typing";
  botToken: string;
  chatId: number | string;
  intervalMs?: number;
  onError?: (error: unknown) => void;
}

const DEFAULT_CHAT_ACTION_INTERVAL_MS = 4000;

export async function sendTelegramChatAction(options: {
  action: "typing";
  botToken: string;
  chatId: number | string;
}): Promise<void> {
  const response = await fetch(
    `https://api.telegram.org/bot${options.botToken}/sendChatAction`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: options.chatId,
        action: options.action,
      }),
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | TelegramChatActionResponse
    | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(
      `Telegram sendChatAction failed (${response.status})${
        payload?.description ? `: ${payload.description}` : ""
      }`
    );
  }
}

export async function runWithTelegramChatAction<T>(
  options: RunWithTelegramChatActionOptions,
  task: () => Promise<T>
): Promise<T> {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const intervalMs = options.intervalMs ?? DEFAULT_CHAT_ACTION_INTERVAL_MS;

  const safeSendAction = async () => {
    try {
      await sendTelegramChatAction({
        action: options.action,
        botToken: options.botToken,
        chatId: options.chatId,
      });
    } catch (error) {
      options.onError?.(error);
    }
  };

  const scheduleNext = () => {
    if (stopped) {
      return;
    }
    timer = setTimeout(async () => {
      await safeSendAction();
      scheduleNext();
    }, intervalMs);
  };

  await safeSendAction();
  scheduleNext();

  try {
    return await task();
  } finally {
    stopped = true;
    if (timer) {
      clearTimeout(timer);
    }
  }
}
