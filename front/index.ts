let eventSource: EventSource | undefined;

const logTextarea = document.getElementById("logTextarea");
const urlInput = document.querySelector<HTMLInputElement>('input[id="urlInput"]');

if (!logTextarea || !urlInput) {
    throw new Error("elements not found");
}

const log = (msg: string) => {
    logTextarea.textContent += `${msg}\n`;
};

const stopSSE = () => {
    log("stop");
    eventSource && eventSource.close();
};

const startSSE = (url: string = urlInput.value) => {

    log(`[start] ${url}`);

    eventSource = new EventSource(url);

    eventSource.addEventListener("open", ({ target: { readyState } }: Event) => {
        log(`[open] readyState: ${readyState}`);
    });

    eventSource.addEventListener("error", ({ target: { readyState } }: Event) => {
        log(`[error] readyState: ${readyState}`);
        switch (readyState) {
            case EventSource.CONNECTING:
                log(`[error] Переподключение`);
                break;
            case EventSource.CLOSED:
                log("[error] CLOSED");
                break;
            default:
                log("[error] Произошла ошибка.");
                break;
        }
        if (readyState === EventSource.CONNECTING) {
            log(`[error] Переподключение`);
        } else if (readyState === EventSource.CLOSED) {
            log("[error] CLOSED");
        } else {
            log("[error] Произошла ошибка.");
        }
    });

    eventSource.addEventListener("end", ({ data, lastEventId }) => {
        log(`[end] id: ${lastEventId}, data: ${data}`);
    });

    eventSource.addEventListener("stop", ({ data, lastEventId }) => {
        log(`[stop] id: ${lastEventId}, data: ${data}`);
        stopSSE();
    });

    eventSource.addEventListener("message", ({ data, lastEventId }: MessageEvent<string>) => {
        log(`[message] id: ${lastEventId}, data: ${data}`);
    });
};
