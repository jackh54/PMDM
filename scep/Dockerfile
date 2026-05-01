FROM golang:1.22-alpine AS builder
WORKDIR /src
RUN apk add --no-cache git
RUN git clone --depth=1 --branch v2.3.0 https://github.com/micromdm/scep.git .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/scepserver ./cmd/scepserver

FROM alpine:3.20
RUN adduser -D -u 10001 app && mkdir -p /depot && chown -R app:app /depot
USER app
COPY --from=builder /out/scepserver /usr/bin/scepserver
EXPOSE 2016
ENTRYPOINT ["/usr/bin/scepserver"]
CMD ["-depot", "/depot", "-port", "2016"]
