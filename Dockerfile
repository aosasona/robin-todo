FROM golang:1.23.2 AS base

RUN curl -fsSL https://deb.nodesource.com/setup_23.x | bash - && \
  apt-get update && \
  apt-get install -y nodejs && \
  npm install --global pnpm

WORKDIR /go/src/app

COPY go.* .

RUN go mod download

COPY . .

RUN go generate ./... && \
  CGO_ENABLED=0 go build -o /go/bin/app

FROM gcr.io/distroless/static-debian11

COPY --from=base /go/bin/app app

EXPOSE 8081

CMD ["/app"]
