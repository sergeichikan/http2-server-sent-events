const logTextarea = document.querySelector('textarea[id="logTextarea"]');
const urlInput = document.querySelector<HTMLInputElement>('input[id="urlInput"]');
const startButton = document.querySelector<HTMLInputElement>('button[id="startButton"]');
const stopButton = document.querySelector<HTMLInputElement>('button[id="stopButton"]');

if (!logTextarea || !urlInput || !startButton || !stopButton) {
    throw new Error("elements not found");
}

const log = (msg: string) => {
    logTextarea.textContent += `${msg}\n`;
};

startButton.addEventListener("click", () => {
    const { value: url } = urlInput;

    const eventSource: EventSource = new EventSource(url);

    const stopSSE = () => {
        log("stop");
        eventSource.close();
    };

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
    });

    eventSource.addEventListener("end", ({ data, lastEventId }: Event) => {
        log(`[end] id: ${lastEventId}, data: ${data}`);
    });

    eventSource.addEventListener("stop", ({ data, lastEventId }: Event) => {
        log(`[stop] id: ${lastEventId}, data: ${data}`);
        stopSSE();
    });

    eventSource.addEventListener("message", ({ data, lastEventId }: MessageEvent<string>) => {
        log(`[message] id: ${lastEventId}, data: ${data}`);
    });

    stopButton.addEventListener("click", stopSSE);

    log(`[start] ${url}`);
});
