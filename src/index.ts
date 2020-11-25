import { createSecureServer, ServerHttp2Stream, IncomingHttpHeaders, constants, Http2SecureServer } from "http2";
import { readFileSync, createReadStream } from "fs";
import { ListenOptions } from "net";

const options: ListenOptions = {
    host: "localhost",
    port: 8443,
};

const {
    HTTP2_HEADER_CONTENT_TYPE,
    HTTP2_HEADER_STATUS,
    HTTP2_HEADER_METHOD,
    HTTP2_HEADER_PATH,
    HTTP2_HEADER_CACHE_CONTROL,
} = constants;

const notFound = (stream: ServerHttp2Stream) => {
    stream.respond({
        [HTTP2_HEADER_STATUS]: 404,
        [HTTP2_HEADER_CONTENT_TYPE]: "text/plain; charset=utf-8",
    });
    stream.end("Page not found");
};

const sendIndexHtml = (stream: ServerHttp2Stream) => {
    stream.respond({
        [HTTP2_HEADER_STATUS]: 200,
        [HTTP2_HEADER_CONTENT_TYPE]: "text/html; charset=utf-8",
    });
    createReadStream("./front/index.html").pipe(stream);
};

const sendIndexJs = (stream: ServerHttp2Stream) => {
    stream.respond({
        [HTTP2_HEADER_STATUS]: 200,
        [HTTP2_HEADER_CONTENT_TYPE]: "application/javascript; charset=utf-8",
    });
    createReadStream("./front/index.js").pipe(stream);
};

const runSSE = (stream: ServerHttp2Stream) => {
    stream.respond({
        [HTTP2_HEADER_STATUS]: 200,
        [HTTP2_HEADER_CONTENT_TYPE]: "text/event-stream; charset=utf-8",
        [HTTP2_HEADER_CACHE_CONTROL]: "no-cache",
    });
    let i: number = 0;
    const intervalHandler = () => {
        if (stream.closed) {
            clearInterval(timer);
        } else if (i >= 5) {
            // const event = "event: stop";
            const event = "event: end";
            const data = "data: bye-bye";
            const id = `id: ${Date.now()}`;
            stream.end(`${event}\n${data}\n${id}\n\n`);
            clearInterval(timer);
        } else {
            i++;
            const data = `data: ${i}`;
            const id = `id: ${Date.now()}`;
            stream.write(`${data}\n${id}\n\n`);
        }
    };
    const timer = setInterval(intervalHandler, 1000);
    stream.once("error", () => clearInterval(timer));
};

const server: Http2SecureServer = createSecureServer({
    key: readFileSync("localhost-privkey.pem"),
    cert: readFileSync("localhost-cert.pem"),
});

server.on("error", console.log);

server.on("stream", (stream: ServerHttp2Stream) => stream.on("error", console.log));

server.on("stream", (stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) => {
    const {
        [HTTP2_HEADER_METHOD as ":method"]: method = "",
        [HTTP2_HEADER_PATH as ":path"]: path = "",
    } = headers;
    console.log(method, path);
    if (method !== "GET") {
        return notFound(stream);
    }
    switch (path) {
        case "/":
        case "/index.html":
            return sendIndexHtml(stream);
        case "/index.js":
            return sendIndexJs(stream);
        case "/sse":
            return runSSE(stream);
        default:
            return notFound(stream);
    }
});

server.listen(options, () => console.log(`https://${options.host}:${options.port}/`));
